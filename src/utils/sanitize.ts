import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

/**
 * Strip ALL HTML tags (safest for plain text)
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
  
  return cleaned.trim()
}

/**
 * Allow minimal safe HTML (use sparingly!)
 */
export function sanitizeHtmlInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
  
  return cleaned.trim()
}

/**
 * Validate URLs for SSRF protection
 * Only allows https:// and ipfs://
 */
export function validateUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  
  const trimmed = url.trim()
  
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('ipfs://')) {
    return null
  }
  
  if (trimmed.startsWith('ipfs://')) {
    const ipfsPattern = /^ipfs:\/\/[a-zA-Z0-9]+/
    return ipfsPattern.test(trimmed) ? trimmed : null
  }
  
  if (!validator.isURL(trimmed, {
    protocols: ['https'],
    require_protocol: true,
  })) {
    return null
  }
  
  try {
    const urlObj = new URL(trimmed)
    const hostname = urlObj.hostname.toLowerCase()
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return null
    }
    
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
    ]
    
    if (privateRanges.some(pattern => pattern.test(hostname))) {
      return null
    }
    
    return trimmed
  } catch {
    return null
  }
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumeric(
  input: string,
  options: { allowNegative?: boolean; allowDecimal?: boolean } = {}
): string | null {
  if (!input || typeof input !== 'string') return null
  
  const { allowNegative = false, allowDecimal = true } = options
  const trimmed = input.trim()
  
  let pattern = '^'
  if (allowNegative) pattern += '-?'
  pattern += '\\d+'
  if (allowDecimal) pattern += '(\\.\\d+)?'
  pattern += '$'
  
  const regex = new RegExp(pattern)
  return regex.test(trimmed) ? trimmed : null
}

/**
 * Sanitize object fields
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowHtml: string[] = []
): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    const value = sanitized[key]
    if (typeof value === 'string') {
      sanitized[key] = (allowHtml.includes(key)
        ? sanitizeHtmlInput(value)
        : sanitizeInput(value)) as T[Extract<keyof T, string>]
    }
  }
  
  return sanitized
}