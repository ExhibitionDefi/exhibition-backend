import { verifyMessage } from 'ethers'
import { config } from '../config/env.js'

export interface VerificationResult {
  isValid: boolean
  recoveredAddress?: string
  error?: string
}

/**
 * Verify a wallet signature and check whitelist
 */
export async function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): Promise<VerificationResult> {
  try {
    const normalizedAddress = address.toLowerCase()
    
    if (!isValidAddress(normalizedAddress)) {
      return { isValid: false, error: 'Invalid address format' }
    }
    
    if (!isValidSignature(signature)) {
      return { isValid: false, error: 'Invalid signature format' }
    }
    
    // Verify message matches expected format (prevents replay attacks)
    if (message !== config.auth.signatureMessage) {
      return { 
        isValid: false, 
        error: 'Message does not match expected format' 
      }
    }
    
    // Recover address from signature (EIP-191)
    const recoveredAddress = verifyMessage(message, signature).toLowerCase()
    
    if (recoveredAddress !== normalizedAddress) {
      return { 
        isValid: false, 
        error: 'Signature does not match claimed address',
        recoveredAddress 
      }
    }
    
    // Check whitelist if enabled
    if (config.auth.walletWhitelist.length > 0) {
      if (!config.auth.walletWhitelist.includes(normalizedAddress)) {
        return { 
          isValid: false, 
          error: 'Wallet address not in whitelist',
          recoveredAddress 
        }
      }
    }
    
    return { isValid: true, recoveredAddress }
    
  } catch (error) {
    console.error('Signature verification error:', error)
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    }
  }
}

/**
 * Check if an address is whitelisted
 */
export function isWhitelisted(address: string): boolean {
  if (config.auth.walletWhitelist.length === 0) {
    return true
  }
  
  const normalized = address.toLowerCase()
  return config.auth.walletWhitelist.includes(normalized)
}

function isValidAddress(address: string): boolean {
  return /^0x[a-f0-9]{40}$/.test(address)
}

function isValidSignature(signature: string): boolean {
  return /^0x[a-f0-9]{130}$/i.test(signature)
}

export function getExpectedMessage(): string {
  return config.auth.signatureMessage
}