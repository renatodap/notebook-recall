/**
 * Rate Limiter
 *
 * Implements token bucket / sliding window rate limiting
 * for Gemini API free tier (15 RPM, 1500/day)
 */

import {
  RateLimitConfig,
  RateLimitCheckResult,
  RateLimiterState,
} from './types'

const ONE_MINUTE_MS = 60_000
const ONE_DAY_MS = 86_400_000

/**
 * Rate Limiter using sliding window algorithm
 *
 * Tracks request timestamps and enforces both RPM and daily limits.
 */
export class RateLimiter {
  private requests: number[] = [] // Array of request timestamps
  private lastReset: number = Date.now()
  private userId?: string
  private config: RateLimitConfig

  /**
   * Create a new rate limiter
   *
   * @param config - Rate limit configuration (RPM and daily limits)
   * @param userId - Optional user ID for per-user rate limiting
   */
  constructor(config: RateLimitConfig, userId?: string) {
    this.config = config
    this.userId = userId
  }

  /**
   * Check if a request would exceed rate limits
   *
   * @returns Result indicating whether request is allowed
   */
  async checkLimit(): Promise<RateLimitCheckResult> {
    const now = Date.now()

    // Clean up old requests
    this.cleanupOldRequests(now)

    // Check RPM limit
    const rpmCheck = this.checkRPM(now)
    if (!rpmCheck.allowed) {
      return rpmCheck
    }

    // Check daily limit
    const dailyCheck = this.checkDaily(now)
    if (!dailyCheck.allowed) {
      return dailyCheck
    }

    // Both limits OK
    return {
      allowed: true,
      reason: 'ok',
      currentUsage: {
        rpm: this.getRPMUsage(now),
        daily: this.getDailyUsage(now),
      },
    }
  }

  /**
   * Record a request (call this after successfully making an API call)
   */
  recordRequest(): void {
    const now = Date.now()
    this.requests.push(now)
  }

  /**
   * Get current rate limiter state
   */
  getState(): RateLimiterState {
    return {
      userId: this.userId,
      requests: [...this.requests], // Return copy
      lastReset: this.lastReset,
    }
  }

  /**
   * Reset the rate limiter (clear all recorded requests)
   */
  reset(): void {
    this.requests = []
    this.lastReset = Date.now()
  }

  /**
   * Get seconds until rate limit window resets
   * @returns Seconds until oldest request expires from RPM window
   */
  getRetryAfter(): number {
    if (this.requests.length === 0) {
      return 0
    }

    const now = Date.now()
    const oldestRequest = Math.min(...this.requests)
    const timeSinceOldest = now - oldestRequest

    // Time remaining in the 1-minute window
    const remainingMs = Math.max(0, ONE_MINUTE_MS - timeSinceOldest)

    return Math.ceil(remainingMs / 1000) // Convert to seconds
  }

  /**
   * Clean up requests older than 24 hours
   */
  private cleanupOldRequests(now: number): void {
    const oneDayAgo = now - ONE_DAY_MS

    // Keep only requests within the last 24 hours
    this.requests = this.requests.filter((timestamp) => timestamp > oneDayAgo)
  }

  /**
   * Check requests per minute (RPM) limit
   */
  private checkRPM(now: number): RateLimitCheckResult {
    const oneMinuteAgo = now - ONE_MINUTE_MS
    const recentRequests = this.requests.filter((ts) => ts > oneMinuteAgo)

    if (recentRequests.length >= this.config.requestsPerMinute) {
      return {
        allowed: false,
        reason: 'rpm_exceeded',
        retryAfter: this.getRetryAfter(),
        currentUsage: {
          rpm: recentRequests.length,
          daily: this.getDailyUsage(now),
        },
      }
    }

    return {
      allowed: true,
      currentUsage: {
        rpm: recentRequests.length,
        daily: this.getDailyUsage(now),
      },
    }
  }

  /**
   * Check daily request limit
   */
  private checkDaily(now: number): RateLimitCheckResult {
    const dailyUsage = this.getDailyUsage(now)

    if (dailyUsage >= this.config.requestsPerDay) {
      // Calculate time until daily reset (midnight UTC or 24h from oldest request)
      const oldestRequest = Math.min(...this.requests)
      const resetTime = oldestRequest + ONE_DAY_MS
      const retryAfter = Math.ceil((resetTime - now) / 1000)

      return {
        allowed: false,
        reason: 'daily_exceeded',
        retryAfter: Math.max(0, retryAfter),
        currentUsage: {
          rpm: this.getRPMUsage(now),
          daily: dailyUsage,
        },
      }
    }

    return {
      allowed: true,
      currentUsage: {
        rpm: this.getRPMUsage(now),
        daily: dailyUsage,
      },
    }
  }

  /**
   * Get current RPM usage
   */
  private getRPMUsage(now: number): number {
    const oneMinuteAgo = now - ONE_MINUTE_MS
    return this.requests.filter((ts) => ts > oneMinuteAgo).length
  }

  /**
   * Get current daily usage
   */
  private getDailyUsage(now: number): number {
    const oneDayAgo = now - ONE_DAY_MS
    return this.requests.filter((ts) => ts > oneDayAgo).length
  }
}

/**
 * Global rate limiter instance for Gemini API
 * Shared across all requests (not per-user)
 */
let globalGeminiRateLimiter: RateLimiter | null = null

/**
 * Get or create global Gemini rate limiter
 */
export function getGlobalGeminiRateLimiter(
  config: RateLimitConfig = {
    requestsPerMinute: 15,
    requestsPerDay: 1500,
  }
): RateLimiter {
  if (!globalGeminiRateLimiter) {
    globalGeminiRateLimiter = new RateLimiter(config)
  }
  return globalGeminiRateLimiter
}

/**
 * Reset global rate limiter (useful for testing)
 */
export function resetGlobalRateLimiter(): void {
  globalGeminiRateLimiter = null
}

/**
 * Per-user rate limiters (map of userId -> RateLimiter)
 */
const userRateLimiters = new Map<string, RateLimiter>()

/**
 * Get or create per-user rate limiter
 */
export function getUserRateLimiter(
  userId: string,
  config: RateLimitConfig = {
    requestsPerMinute: 15,
    requestsPerDay: 1500,
  }
): RateLimiter {
  if (!userRateLimiters.has(userId)) {
    userRateLimiters.set(userId, new RateLimiter(config, userId))
  }
  return userRateLimiters.get(userId)!
}

/**
 * Clear user rate limiter
 */
export function clearUserRateLimiter(userId: string): void {
  userRateLimiters.delete(userId)
}

/**
 * Clear all user rate limiters
 */
export function clearAllUserRateLimiters(): void {
  userRateLimiters.clear()
}
