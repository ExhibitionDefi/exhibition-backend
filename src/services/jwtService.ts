import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import type { JWTPayload } from '../types/index.js'

/**
 * JWT Service for secure token generation and verification
 */

/**
 * Generate a JWT token for an authenticated wallet
 */
export function generateToken(address: string): string {
  const normalizedAddress = address.toLowerCase()
 
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    address: normalizedAddress,
  }
 
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
  }
 
  const token = jwt.sign(payload, config.jwt.secret, options)
 
  return token
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    }) as JWTPayload
    
    if (!decoded.address || !/^0x[a-f0-9]{40}$/.test(decoded.address)) {
      return null
    }
    
    return decoded
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn('JWT verification failed:', error.message)
    } else if (error instanceof jwt.TokenExpiredError) {
      console.warn('JWT expired:', error.message)
    }
    return null
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    if (!decoded || !decoded.exp) return true
    
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp < now
  } catch {
    return true
  }
}