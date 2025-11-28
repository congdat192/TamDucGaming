/**
 * Cryptographic utilities for anti-cheat
 * Purpose: Sign and verify game payloads to prevent tampering
 */

import crypto from 'crypto'

/**
 * Server-side HMAC signing using Node.js crypto
 * Used in API routes to verify payloads
 */
export function hmacSHA256Server(data: string, key: string): string {
  return crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex')
}

/**
 * Client-side HMAC SHA256 (for payload signing)
 * Uses Web Crypto API (browser only)
 */
export async function hmacSHA256Client(message: string, secret: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('hmacSHA256Client can only be called in browser')
  }

  // Check if crypto.subtle is available (requires HTTPS or localhost)
  if (!window.crypto || !window.crypto.subtle) {
    console.warn('[CRYPTO] crypto.subtle not available (non-secure context), skipping HMAC signing')
    return '' // Return empty string to skip signing
  }

  try {
    const enc = new TextEncoder()
    const key = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(message)
    )

    // Convert to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    console.error('[CRYPTO] HMAC signing failed:', error)
    return '' // Return empty string on error
  }
}

/**
 * Verify HMAC signature (server-side)
 */
export function verifyHMAC(data: string, key: string, signature: string): boolean {
  const expectedSignature = hmacSHA256Server(data, key)
  return expectedSignature === signature
}
