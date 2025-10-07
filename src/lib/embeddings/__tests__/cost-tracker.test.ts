/**
 * Cost Tracker - Unit Tests
 * Following TDD: These tests are written BEFORE implementation
 */

import { CostTracker } from '../cost-tracker'
import { ApiCallCost, CostSummary } from '../types'

describe('CostTracker', () => {
  let costTracker: CostTracker

  beforeEach(() => {
    costTracker = new CostTracker()
    jest.clearAllMocks()
  })

  describe('logApiCall', () => {
    // CT-001: Calculate Gemini free tier cost
    it('should calculate Gemini free tier cost as $0.00', () => {
      const call: ApiCallCost = {
        provider: 'gemini',
        model: 'gemini-embedding-001',
        tokens: 100,
        cost: 0.0,
        timestamp: new Date().toISOString(),
        userId: 'user-123',
      }

      costTracker.logApiCall(call)

      const summary = costTracker.getDailySummary()
      expect(summary.gemini.cost).toBe(0.0)
      expect(summary.gemini.calls).toBe(1)
      expect(summary.gemini.tokens).toBe(100)
    })

    // CT-002: Calculate Gemini paid tier cost
    it('should calculate Gemini paid tier cost correctly', () => {
      const call: ApiCallCost = {
        provider: 'gemini',
        model: 'gemini-embedding-001',
        tokens: 1_000_000,
        cost: 0.001, // $0.001/1M tokens
        timestamp: new Date().toISOString(),
      }

      costTracker.logApiCall(call)

      const summary = costTracker.getDailySummary()
      expect(summary.gemini.cost).toBe(0.001)
    })

    // CT-003: Calculate OpenAI cost
    it('should calculate OpenAI cost correctly', () => {
      const call: ApiCallCost = {
        provider: 'openai',
        model: 'text-embedding-3-small',
        tokens: 1_000_000,
        cost: 0.02, // $0.02/1M tokens
        timestamp: new Date().toISOString(),
      }

      costTracker.logApiCall(call)

      const summary = costTracker.getDailySummary()
      expect(summary.openai.cost).toBe(0.02)
      expect(summary.openai.calls).toBe(1)
    })

    it('should log multiple API calls', () => {
      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: new Date().toISOString(),
        },
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 150,
          cost: 0.0,
          timestamp: new Date().toISOString(),
        },
        {
          provider: 'openai',
          model: 'text-embedding-3-small',
          tokens: 200,
          cost: 0.004,
          timestamp: new Date().toISOString(),
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const summary = costTracker.getDailySummary()
      expect(summary.gemini.calls).toBe(2)
      expect(summary.gemini.tokens).toBe(250)
      expect(summary.openai.calls).toBe(1)
      expect(summary.total.calls).toBe(3)
    })
  })

  describe('getDailySummary', () => {
    // CT-004: Aggregate daily costs
    it('should aggregate daily costs correctly', () => {
      const now = new Date()

      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 500,
          cost: 0.0,
          timestamp: now.toISOString(),
        },
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 500,
          cost: 0.0,
          timestamp: now.toISOString(),
        },
        {
          provider: 'openai',
          model: 'text-embedding-3-small',
          tokens: 1000,
          cost: 0.02,
          timestamp: now.toISOString(),
        },
        {
          provider: 'openai',
          model: 'text-embedding-3-small',
          tokens: 2000,
          cost: 0.04,
          timestamp: now.toISOString(),
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const summary = costTracker.getDailySummary()

      expect(summary.period).toBe('daily')
      expect(summary.gemini.calls).toBe(2)
      expect(summary.gemini.tokens).toBe(1000)
      expect(summary.gemini.cost).toBe(0.0)
      expect(summary.openai.calls).toBe(2)
      expect(summary.openai.tokens).toBe(3000)
      expect(summary.openai.cost).toBe(0.06)
      expect(summary.total.calls).toBe(4)
      expect(summary.total.tokens).toBe(4000)
      expect(summary.total.cost).toBe(0.06)
    })

    it('should only include calls from last 24 hours', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago

      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: yesterday.toISOString(), // Too old
        },
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 200,
          cost: 0.0,
          timestamp: now.toISOString(), // Current
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const summary = costTracker.getDailySummary()

      // Should only count the recent call
      expect(summary.gemini.calls).toBe(1)
      expect(summary.gemini.tokens).toBe(200)
    })
  })

  describe('getMonthlySummary', () => {
    // CT-005: Aggregate monthly costs
    it('should aggregate monthly costs correctly', () => {
      const now = new Date()

      // Generate calls over 30 days
      const calls: ApiCallCost[] = []
      for (let day = 0; day < 30; day++) {
        const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)
        calls.push({
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: date.toISOString(),
        })
        calls.push({
          provider: 'openai',
          model: 'text-embedding-3-small',
          tokens: 100,
          cost: 0.002,
          timestamp: date.toISOString(),
        })
      }

      calls.forEach((call) => costTracker.logApiCall(call))

      const summary = costTracker.getMonthlySummary()

      expect(summary.period).toBe('monthly')
      expect(summary.gemini.calls).toBe(30)
      expect(summary.gemini.tokens).toBe(3000)
      expect(summary.gemini.cost).toBe(0.0)
      expect(summary.openai.calls).toBe(30)
      expect(summary.openai.tokens).toBe(3000)
      expect(summary.openai.cost).toBeCloseTo(0.06, 2)
      expect(summary.total.calls).toBe(60)
    })

    it('should only include calls from last 30 days', () => {
      const now = new Date()
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: twoMonthsAgo.toISOString(), // Too old
        },
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 200,
          cost: 0.0,
          timestamp: now.toISOString(), // Current month
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const summary = costTracker.getMonthlySummary()

      // Should only count recent month
      expect(summary.gemini.calls).toBe(1)
      expect(summary.gemini.tokens).toBe(200)
    })
  })

  describe('getFreeT ierUsage', () => {
    // CT-006: Track free tier usage
    it('should track Gemini free tier usage separately', () => {
      const calls: ApiCallCost[] = []

      // 100 free calls
      for (let i = 0; i < 100; i++) {
        calls.push({
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: new Date().toISOString(),
        })
      }

      calls.forEach((call) => costTracker.logApiCall(call))

      const freeUsage = costTracker.getFreeTierUsage()

      expect(freeUsage.geminiCalls).toBe(100)
      expect(freeUsage.geminiTokens).toBe(10000)
      expect(freeUsage.paidCalls).toBe(0)
    })

    it('should separate free and paid Gemini calls', () => {
      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0, // Free
          timestamp: new Date().toISOString(),
        },
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 1_000_000,
          cost: 0.001, // Paid
          timestamp: new Date().toISOString(),
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const freeUsage = costTracker.getFreeTierUsage()

      expect(freeUsage.geminiCalls).toBe(2)
      expect(freeUsage.freeCalls).toBe(1)
      expect(freeUsage.paidCalls).toBe(1)
    })
  })

  describe('shouldAlert', () => {
    // CT-007: Alert on approaching limit
    it('should alert when approaching daily rate limit (93%)', () => {
      const calls: ApiCallCost[] = []

      // 1400 calls (93% of 1500 daily limit)
      for (let i = 0; i < 1400; i++) {
        calls.push({
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: new Date().toISOString(),
        })
      }

      calls.forEach((call) => costTracker.logApiCall(call))

      const shouldAlert = costTracker.shouldAlert({
        dailyThreshold: 100, // Not relevant for this check
        monthlyThreshold: 1000,
        rateLimitWarning: 0.93, // Alert at 93%
      })

      expect(shouldAlert).toBe(true)
    })

    it('should alert when daily cost exceeds threshold', () => {
      const calls: ApiCallCost[] = [
        {
          provider: 'openai',
          model: 'text-embedding-3-small',
          tokens: 10_000_000,
          cost: 0.2, // $0.20 for 10M tokens
          timestamp: new Date().toISOString(),
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const shouldAlert = costTracker.shouldAlert({
        dailyThreshold: 0.1, // $0.10 threshold
        monthlyThreshold: 10,
        rateLimitWarning: 0.9,
      })

      expect(shouldAlert).toBe(true)
    })

    it('should not alert when under all thresholds', () => {
      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: new Date().toISOString(),
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const shouldAlert = costTracker.shouldAlert({
        dailyThreshold: 10,
        monthlyThreshold: 100,
        rateLimitWarning: 0.9,
      })

      expect(shouldAlert).toBe(false)
    })
  })

  describe('exportLogs', () => {
    // CT-008: Log API call with metadata
    it('should export all logged API calls', () => {
      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: '2025-10-06T10:00:00Z',
          userId: 'user-123',
          endpoint: '/api/sources',
        },
        {
          provider: 'openai',
          model: 'text-embedding-3-small',
          tokens: 200,
          cost: 0.004,
          timestamp: '2025-10-06T10:05:00Z',
          userId: 'user-456',
          endpoint: '/api/search',
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      const exportedLogs = costTracker.exportLogs()

      expect(exportedLogs).toHaveLength(2)
      expect(exportedLogs[0]).toMatchObject({
        provider: 'gemini',
        userId: 'user-123',
        endpoint: '/api/sources',
      })
      expect(exportedLogs[1]).toMatchObject({
        provider: 'openai',
        userId: 'user-456',
      })
    })

    it('should include all required metadata fields', () => {
      const call: ApiCallCost = {
        provider: 'gemini',
        model: 'gemini-embedding-001',
        tokens: 100,
        cost: 0.0,
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        endpoint: '/api/sources',
      }

      costTracker.logApiCall(call)

      const logs = costTracker.exportLogs()

      expect(logs[0]).toHaveProperty('provider')
      expect(logs[0]).toHaveProperty('model')
      expect(logs[0]).toHaveProperty('tokens')
      expect(logs[0]).toHaveProperty('cost')
      expect(logs[0]).toHaveProperty('timestamp')
      expect(logs[0]).toHaveProperty('userId')
      expect(logs[0]).toHaveProperty('endpoint')
    })
  })

  describe('reset', () => {
    it('should clear all tracked API calls', () => {
      const calls: ApiCallCost[] = [
        {
          provider: 'gemini',
          model: 'gemini-embedding-001',
          tokens: 100,
          cost: 0.0,
          timestamp: new Date().toISOString(),
        },
        {
          provider: 'openai',
          model: 'text-embedding-3-small',
          tokens: 200,
          cost: 0.004,
          timestamp: new Date().toISOString(),
        },
      ]

      calls.forEach((call) => costTracker.logApiCall(call))

      expect(costTracker.exportLogs()).toHaveLength(2)

      costTracker.reset()

      expect(costTracker.exportLogs()).toHaveLength(0)

      const summary = costTracker.getDailySummary()
      expect(summary.total.calls).toBe(0)
      expect(summary.total.cost).toBe(0)
    })
  })
})
