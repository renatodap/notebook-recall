/**
 * Rate Limiter - Unit Tests
 * Following TDD: These tests are written BEFORE implementation
 */

import { RateLimiter } from '../rate-limiter'
import { RateLimitCheckResult, RateLimitConfig } from '../types'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  const config: RateLimitConfig = {
    requestsPerMinute: 15,
    requestsPerDay: 1500,
  }

  beforeEach(() => {
    rateLimiter = new RateLimiter(config)
    jest.clearAllMocks()
  })

  describe('checkLimit', () => {
    // RL-001: Allow within RPM limit
    it('should allow request when within RPM limit', async () => {
      const result: RateLimitCheckResult = await rateLimiter.checkLimit()

      expect(result.allowed).toBe(true)
      expect(result.reason).toBe('ok')
      expect(result.currentUsage.rpm).toBe(0) // No prior requests
      expect(result.currentUsage.daily).toBe(0)
    })

    // RL-002: Block at RPM limit
    it('should block request when RPM limit is exceeded', async () => {
      // Make 15 requests (at the limit)
      for (let i = 0; i < 15; i++) {
        const result = await rateLimiter.checkLimit()
        expect(result.allowed).toBe(true)
        rateLimiter.recordRequest()
      }

      // 16th request should be blocked
      const result = await rateLimiter.checkLimit()

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('rpm_exceeded')
      expect(result.currentUsage.rpm).toBe(15)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    // RL-003: Block at daily limit
    it('should block request when daily limit is exceeded', async () => {
      // Simulate 1500 requests over time
      const now = Date.now()
      const timestamps: number[] = []

      for (let i = 0; i < 1500; i++) {
        // Spread requests over 24 hours (avoid RPM limit)
        timestamps.push(now - i * 60_000) // 1 minute apart
      }

      // Inject timestamps into rate limiter
      rateLimiter['requests'] = timestamps

      const result = await rateLimiter.checkLimit()

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily_exceeded')
      expect(result.currentUsage.daily).toBe(1500)
    })

    // RL-004: Reset after 1 minute
    it('should allow requests again after 1 minute window passes', async () => {
      const now = Date.now()

      // Create 15 requests from 61 seconds ago
      const oldTimestamps = Array.from(
        { length: 15 },
        (_, i) => now - 61_000 - i * 1000
      )
      rateLimiter['requests'] = oldTimestamps

      const result = await rateLimiter.checkLimit()

      // Old requests should be cleaned up, so this should be allowed
      expect(result.allowed).toBe(true)
      expect(result.currentUsage.rpm).toBe(0) // Old requests removed
    })

    // RL-005: Reset after 24 hours
    it('should allow requests again after 24 hour window passes', async () => {
      const now = Date.now()

      // Create 1500 requests from 24 hours + 1 second ago
      const oldTimestamps = Array.from(
        { length: 1500 },
        (_, i) => now - 86_400_001 - i * 1000
      )
      rateLimiter['requests'] = oldTimestamps

      const result = await rateLimiter.checkLimit()

      // Old requests should be cleaned up
      expect(result.allowed).toBe(true)
      expect(result.currentUsage.daily).toBe(0)
    })

    // RL-006: Handle concurrent requests
    it('should handle concurrent request checks correctly', async () => {
      const promises = Array.from({ length: 20 }, () =>
        rateLimiter.checkLimit()
      )

      const results = await Promise.all(promises)

      const allowed = results.filter((r) => r.allowed).length
      const blocked = results.filter((r) => !r.allowed).length

      // With RPM limit of 15, max 15 should be allowed
      expect(allowed).toBeLessThanOrEqual(15)
      expect(blocked).toBeGreaterThanOrEqual(5)
    })

    // RL-007: Track per-user limits
    it('should track limits separately per user', async () => {
      const userARateLimiter = new RateLimiter(config, 'user-a')
      const userBRateLimiter = new RateLimiter(config, 'user-b')

      // User A hits limit
      for (let i = 0; i < 15; i++) {
        await userARateLimiter.checkLimit()
        userARateLimiter.recordRequest()
      }

      const userAResult = await userARateLimiter.checkLimit()
      expect(userAResult.allowed).toBe(false)

      // User B should still have quota
      const userBResult = await userBRateLimiter.checkLimit()
      expect(userBResult.allowed).toBe(true)
    })
  })

  describe('recordRequest', () => {
    it('should record request timestamp', () => {
      rateLimiter.recordRequest()

      const state = rateLimiter.getState()
      expect(state.requests).toHaveLength(1)
      expect(state.requests[0]).toBeCloseTo(Date.now(), -2) // Within 100ms
    })

    it('should accumulate multiple requests', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()

      const state = rateLimiter.getState()
      expect(state.requests).toHaveLength(3)
    })
  })

  describe('getState', () => {
    it('should return current rate limiter state', () => {
      const state = rateLimiter.getState()

      expect(state).toHaveProperty('requests')
      expect(state).toHaveProperty('lastReset')
      expect(state.requests).toEqual([])
    })

    it('should include userId if provided', () => {
      const userRateLimiter = new RateLimiter(config, 'user-123')
      const state = userRateLimiter.getState()

      expect(state.userId).toBe('user-123')
    })
  })

  describe('reset', () => {
    it('should clear all recorded requests', () => {
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()
      rateLimiter.recordRequest()

      expect(rateLimiter.getState().requests).toHaveLength(3)

      rateLimiter.reset()

      expect(rateLimiter.getState().requests).toHaveLength(0)
    })

    it('should update lastReset timestamp', () => {
      const beforeReset = Date.now()
      rateLimiter.reset()
      const afterReset = Date.now()

      const state = rateLimiter.getState()
      expect(state.lastReset).toBeGreaterThanOrEqual(beforeReset)
      expect(state.lastReset).toBeLessThanOrEqual(afterReset)
    })
  })

  describe('getRetryAfter', () => {
    it('should return seconds until RPM window resets', async () => {
      const now = Date.now()

      // Add request from 30 seconds ago
      rateLimiter['requests'] = [now - 30_000]

      const retryAfter = rateLimiter.getRetryAfter()

      // Should be ~30 seconds (60 - 30)
      expect(retryAfter).toBeGreaterThan(25)
      expect(retryAfter).toBeLessThan(35)
    })

    it('should return 0 if no requests recorded', () => {
      const retryAfter = rateLimiter.getRetryAfter()

      expect(retryAfter).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid successive checks correctly', async () => {
      const results: RateLimitCheckResult[] = []

      for (let i = 0; i < 20; i++) {
        const result = await rateLimiter.checkLimit()
        results.push(result)

        if (result.allowed) {
          rateLimiter.recordRequest()
        }
      }

      const allowedCount = results.filter((r) => r.allowed).length

      // Should allow exactly 15 (RPM limit)
      expect(allowedCount).toBe(15)
    })

    it('should clean up old timestamps efficiently', () => {
      const now = Date.now()

      // Add mix of old and recent requests
      const timestamps = [
        ...Array.from({ length: 10 }, (_, i) => now - 90_000 - i * 1000), // Old (>60s)
        ...Array.from({ length: 5 }, (_, i) => now - i * 1000), // Recent
      ]

      rateLimiter['requests'] = timestamps

      // Trigger cleanup by checking limit
      rateLimiter.checkLimit()

      const state = rateLimiter.getState()

      // Should only keep recent requests (within 60s window)
      expect(state.requests.length).toBeLessThanOrEqual(5)
    })

    it('should handle zero limits configuration', async () => {
      const zeroLimitRateLimiter = new RateLimiter({
        requestsPerMinute: 0,
        requestsPerDay: 0,
      })

      const result = await zeroLimitRateLimiter.checkLimit()

      expect(result.allowed).toBe(false)
    })
  })
})
