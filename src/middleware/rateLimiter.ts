import rateLimit from 'express-rate-limit'
import { config } from '../config/env.js'

/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

/**
 * General API rate limiter
 * Uses config values: 50 requests per 1 minute per IP
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
  skipSuccessfulRequests: true,
})

/**
 * Generous rate limiter for RPC proxy
 * Blockchain operations are frequent - uses 20x the normal API limit
 */
export const rpcLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // Same window as API limiter
  max: config.rateLimit.maxRequests * 20, // 20x more generous (50 * 20 = 1000)
  message: {
    success: false,
    error: 'RPC rate limit exceeded',
    message: 'Too many blockchain requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    return req.ip || 'unknown'
  }
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
    return req.user?.address || req.ip || 'unknown'
  },
  skip: (req) => {
    return !req.user
  }
})