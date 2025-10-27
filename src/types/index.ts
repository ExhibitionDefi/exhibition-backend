/**
 * Shared TypeScript types for Exhibition Backend
 */

export interface JWTPayload {
  address: string // Wallet address (lowercase)
  iat: number     // Issued at timestamp
  exp: number     // Expiration timestamp
}

export interface AuthRequest extends Request {
  user?: JWTPayload
  csrfToken?: string
}

export interface VerifyWalletRequest {
  address: string
  signature: string
  message: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ProjectCreateRequest {
  tokenName: string
  tokenSymbol: string
  tokenLogoURI: string
  fundingGoal: string
  softCap: string
  tokenPrice: string
  minContribution: string
  maxContribution: string
  startTime: number
  endTime: number
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: Date
}