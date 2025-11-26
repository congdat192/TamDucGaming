// Simple in-memory rate limiter
// For production with multiple servers, consider using Redis or database

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitMap.entries())
  for (const [key, entry] of entries) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 10 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number  // Maximum requests
  windowMs: number     // Time window in milliseconds
}

export function rateLimit(identifier: string, config: RateLimitConfig): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // No entry or window expired - create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return { success: true, remaining: config.maxRequests - 1 }
  }

  // Within window - check limit
  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0 }
  }

  // Increment count
  entry.count++
  rateLimitMap.set(identifier, entry)

  return { success: true, remaining: config.maxRequests - entry.count }
}

export function getRateLimitStatus(identifier: string): { count: number; resetAt: number } | null {
  return rateLimitMap.get(identifier) || null
}
