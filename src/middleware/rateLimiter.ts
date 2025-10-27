import rateLimit from 'express-rate-limit'
import { config } from '../config/env.js'

/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key by IP address
  keyGenerator: (req) => {
    return req.ip || 'unknown'
  }
})

/**
 * Strict rate limiter for auth endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auths
})

/**
 * Per-wallet rate limiter
 * Limits requests by wallet address instead of IP
 */
export const walletLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this wallet',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use authenticated wallet address as key
    return req.user?.address || req.ip || 'unknown'
  },
  skip: (req) => {
    // Skip if not authenticated (fall back to IP limiter)
    return !req.user
  }
})