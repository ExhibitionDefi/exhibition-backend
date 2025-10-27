import type { Request, Response, NextFunction } from 'express'
import { sanitizeObject } from '../utils/sanitize.js'

/**
 * Middleware to sanitize request body
 * Applies to all incoming JSON data
 */
export function sanitizeRequestBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === 'object') {
    // Fields that can contain minimal HTML
    const htmlFields: string[] = [] // Add fields like 'description' if needed
    
    req.body = sanitizeObject(req.body, htmlFields)
  }
  
  next()
}

/**
 * Middleware to sanitize query parameters
 */
export function sanitizeQueryParams(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query as Record<string, any>)
  }
  
  next()
}