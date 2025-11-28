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
 * Client-side HMAC signing using Web Crypto API
 * Used in browser to sign payloads before submission
 */
export async function hmacSHA256Client(data: string, key: string): Promise<string> {
  // Convert strings to Uint8Arrays
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const messageData = encoder.encode(data)

  // Import key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Sign the message
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)

  // Convert signature to hex string
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Verify HMAC signature (server-side)
 */
export function verifyHMAC(data: string, key: string, signature: string): boolean {
  const expectedSignature = hmacSHA256Server(data, key)
  return expectedSignature === signature
}
