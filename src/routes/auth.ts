// src/routes/auth.ts
import { Router } from 'express'
import { verifyWalletSignature, getExpectedMessage } from '../services/walletVerifier.js'
import { generateToken } from '../services/jwtService.js'
import { setCsrfToken } from '../middleware/csrf.js'
import { config } from '../config/env.js'
import type { VerifyWalletRequest } from '../types/index.js'

const router = Router()

const getCookieOptions = () => {
  if (!config.server.isProduction) {
    return {
      secure: false,
      sameSite: 'lax' as const,
      domain: undefined,
    }
  }
  return {
    secure: true,
    sameSite: 'lax' as const,
    domain: '.exhibitiondefi.xyz',
  }
}

/**
 * GET /api/auth/message
 */
router.get('/message', (_req, res) => {
  res.json({
    success: true,
    data: { message: getExpectedMessage() }
  })
})

/**
 * GET /api/auth/me
 * Check existing session via httpOnly cookie
 */
router.get('/me', async (req, res) => {
  const token = req.cookies?.auth_token

  if (!token) {
    res.status(401).json({ success: false, error: 'Not authenticated' })
    return
  }

  const { verifyToken } = await import('../services/jwtService.js')
  const decoded = verifyToken(token)

  if (!decoded) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
    return
  }

  // Refresh CSRF token on session restore so frontend always has a valid one
  const csrfToken = setCsrfToken(req, res)

  res.json({
    success: true,
    data: {
      address:   decoded.address,
      expiresAt: decoded.exp * 1000,
      csrfToken,                      // ← return it so frontend can hydrate store
    }
  })
})

/**
 * POST /api/auth/verify
 * authLimiter removed — applied globally in app.ts
 */
router.post('/verify', async (req, res) => {
  try {
    const { address, signature, message } = req.body as VerifyWalletRequest

    if (!address || !signature || !message) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Address, signature, and message are required'
      })
      return
    }

    const verification = await verifyWalletSignature(address, signature, message)

    if (!verification.isValid) {
      res.status(401).json({
        success: false,
        error: 'Verification failed',
        message: verification.error || 'Invalid signature'
      })
      return
    }

    const token = generateToken(address)
    const cookieOptions = getCookieOptions()

    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      ...cookieOptions,
    })

    const csrfToken = setCsrfToken(req, res)

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        address:   verification.recoveredAddress,
        csrfToken,
      }
    })

  } catch (error) {
    console.error('Auth verify error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error'
    })
  }
})

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req, res) => {
  const cookieOptions = getCookieOptions()

  res.clearCookie('auth_token', cookieOptions)
  res.clearCookie('csrf_token', cookieOptions)

  res.json({ success: true, message: 'Logged out successfully' })
})

export default router