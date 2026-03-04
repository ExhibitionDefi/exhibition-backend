import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/jwtService.js'
import { isWhitelisted } from '../services/walletVerifier.js'
import type { JWTPayload } from '../types/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

/**
 * Main authentication middleware
 * Validates JWT from httpOnly cookie
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from httpOnly cookie
    const token = req.cookies?.auth_token
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        message: 'No auth token provided' 
      })
      return
    }
    
    const decoded = verifyToken(token)
    
    if (!decoded) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token',
        message: 'Please sign in again' 
      })
      return
    }
    
    if (!isWhitelisted(decoded.address)) {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'Wallet not authorized' 
      })
      return
    }
    
    req.user = decoded
    next()
    
  } catch (error) {
    console.error('Authentication middleware error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed',
      message: 'Internal server error' 
    })
  }
}

/**
 * Optional authentication - attaches user if present
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = req.cookies?.auth_token
    
    if (token) {
      const decoded = verifyToken(token)
      if (decoded && isWhitelisted(decoded.address)) {
        req.user = decoded
      }
    }
    
    next()
  } catch (error) {
    next()
  }
}

/**
 * Require specific wallet address (owner-only)
 */
export function requireAddress(allowedAddress: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      })
      return
    }
    
    const normalized = allowedAddress.toLowerCase()
    
    if (req.user.address !== normalized) {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'Owner-only action' 
      })
      return
    }
    
    next()
  }
}