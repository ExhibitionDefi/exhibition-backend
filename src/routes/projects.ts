import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import { walletLimiter } from '../middleware/rateLimiter.js'
import { validateUrl, sanitizeInput, sanitizeNumeric } from '../utils/sanitize.js'
import type { ProjectCreateRequest } from '../types/index.js'

const router = Router()

/**
 * POST /api/projects/create
 * Create a new project (protected)
 */
router.post(
  '/create',
  authenticateJWT,
  verifyCsrfToken,
  walletLimiter,
  async (req, res) => {
    try {
      const data = req.body as ProjectCreateRequest
      
      // Sanitize text inputs
      const tokenName = sanitizeInput(data.tokenName)
      const tokenSymbol = sanitizeInput(data.tokenSymbol)
      
      // Validate URL (SSRF protection)
      const tokenLogoURI = validateUrl(data.tokenLogoURI)
      if (!tokenLogoURI) {
        res.status(400).json({
          success: false,
          error: 'Invalid token logo URL',
          message: 'Only HTTPS and IPFS URLs are allowed'
        })
        return
      }
      
      // Sanitize numeric inputs
      const fundingGoal = sanitizeNumeric(data.fundingGoal)
      const softCap = sanitizeNumeric(data.softCap)
      const tokenPrice = sanitizeNumeric(data.tokenPrice)
      
      if (!fundingGoal || !softCap || !tokenPrice) {
        res.status(400).json({
          success: false,
          error: 'Invalid numeric values'
        })
        return
      }
      
      // TODO: Call your smart contract or database
      // Example: await createProjectOnChain(...)
      
      res.json({
        success: true,
        message: 'Project created successfully',
        data: {
          tokenName,
          tokenSymbol,
          tokenLogoURI,
          owner: req.user!.address
        }
      })
      
    } catch (error) {
      console.error('Create project error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create project'
      })
    }
  }
)

/**
 * POST /api/projects/:id/contribute
 * Contribute to a project (protected)
 */
router.post(
  '/:id/contribute',
  authenticateJWT,
  verifyCsrfToken,
  walletLimiter,
  async (req, res) => {
    try {
      const projectId = req.params.id
      const amount = sanitizeNumeric(req.body.amount)
      
      if (!amount) {
        res.status(400).json({
          success: false,
          error: 'Invalid contribution amount'
        })
        return
      }
      
      // TODO: Process contribution
      
      res.json({
        success: true,
        message: 'Contribution recorded',
        data: {
          projectId,
          amount,
          contributor: req.user!.address
        }
      })
      
    } catch (error) {
      console.error('Contribute error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to process contribution'
      })
    }
  }
)

/**
 * GET /api/projects/:id
 * Get project details (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const projectId = sanitizeInput(req.params.id)
    
    // TODO: Fetch project from database/chain
    
    res.json({
      success: true,
      data: {
        id: projectId,
        // ... project data
      }
    })
    
  } catch (error) {
    console.error('Get project error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    })
  }
})

export default router