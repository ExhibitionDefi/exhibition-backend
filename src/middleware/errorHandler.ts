import type { Request, Response, NextFunction } from 'express'
import { config } from '../config/env.js'

/**
 * Global Error Handler Middleware
 * 
 * Security Features:
 * - Prevents error stack trace leaks in production
 * - Sanitizes error messages
 * - Logs detailed errors server-side only
 * - Returns user-friendly messages to client
 * 
 * Usage: Add as LAST middleware in server.ts
 */

/**
 * Global error handler
 * Catches all unhandled errors and returns safe responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log full error details server-side (never sent to client)
  console.error('❌ Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.address || 'anonymous',
    timestamp: new Date().toISOString(),
  })
  
  // Determine status code
  const statusCode = (err as any).statusCode || 500
  
  // Generic message for production (prevents information disclosure)
  const message = config.server.isDevelopment 
    ? err.message 
    : 'An unexpected error occurred. Please try again later.'
  
  // Build safe error response
  const errorResponse: any = {
    success: false,
    error: 'Server error',
    message,
  }
  
  // Include stack trace only in development
  if (config.server.isDevelopment) {
    errorResponse.stack = err.stack
    errorResponse.details = {
      path: req.path,
      method: req.method,
    }
  }
  
  res.status(statusCode).json(errorResponse)
}

/**
 * 404 Not Found Handler
 * Handles requests to non-existent routes
 */
export function notFoundHandler(
  req: Request,
  res: Response
): void {
  console.warn('⚠️  404 Not Found:', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  })
  
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  })
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch promise rejections
 * 
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation()
 *     res.json(data)
 *   }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Custom Error Classes
 * Use these for specific error types with proper status codes
 */

export class BadRequestError extends Error {
  statusCode = 400
  
  constructor(message: string = 'Bad request') {
    super(message)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401
  
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  statusCode = 403
  
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends Error {
  statusCode = 404
  
  constructor(message: string = 'Not found') {
    super(message)
    this.name = 'Not found'
  }
}

export class ValidationError extends Error {
  statusCode = 422
  
  constructor(message: string = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
  }
}