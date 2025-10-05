/**
 * Simple in-memory rate limiter for AI API endpoints
 * Production deployments should use Redis (Upstash) or similar
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Check if request is allowed based on rate limit
 * @param identifier - User ID or IP address
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No existing entry or window expired - allow and create new entry
  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Within window - check if under limit
  if (entry.count < config.maxRequests) {
    entry.count++
    rateLimitStore.set(identifier, entry)

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  // Exceeded limit
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  }
}

/**
 * Clean up expired entries from rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Simple AI operations (summaries, tags, titles)
  SIMPLE_AI: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  },

  // Complex AI operations (synthesis, contradictions)
  COMPLEX_AI: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },

  // Content fetching (URLs, PDFs)
  CONTENT_FETCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },

  // Search operations
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
} as const
