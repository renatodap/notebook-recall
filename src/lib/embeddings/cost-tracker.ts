/**
 * Cost Tracker
 *
 * Tracks API costs for embedding generation across providers
 * Provides summaries, alerts, and cost export functionality
 */

import {
  ApiCallCost,
  CostSummary,
  CostAlertConfig,
} from './types'

const ONE_HOUR_MS = 3_600_000
const ONE_DAY_MS = 86_400_000
const ONE_MONTH_MS = 30 * ONE_DAY_MS

/**
 * Cost Tracker for embedding API calls
 */
export class CostTracker {
  private logs: ApiCallCost[] = []

  /**
   * Log an API call with cost information
   *
   * @param call - API call cost data
   */
  logApiCall(call: ApiCallCost): void {
    this.logs.push(call)

    // Optional: Log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Cost Tracker]', {
        provider: call.provider,
        model: call.model,
        tokens: call.tokens,
        cost: call.cost,
        userId: call.userId,
      })
    }
  }

  /**
   * Get hourly cost summary
   */
  getHourlySummary(): CostSummary {
    const now = Date.now()
    const oneHourAgo = now - ONE_HOUR_MS

    return this.getSummaryForPeriod(oneHourAgo, now, 'hourly')
  }

  /**
   * Get daily cost summary
   */
  getDailySummary(): CostSummary {
    const now = Date.now()
    const oneDayAgo = now - ONE_DAY_MS

    return this.getSummaryForPeriod(oneDayAgo, now, 'daily')
  }

  /**
   * Get monthly cost summary
   */
  getMonthlySummary(): CostSummary {
    const now = Date.now()
    const oneMonthAgo = now - ONE_MONTH_MS

    return this.getSummaryForPeriod(oneMonthAgo, now, 'monthly')
  }

  /**
   * Get summary for a specific time period
   */
  private getSummaryForPeriod(
    startMs: number,
    endMs: number,
    period: 'hourly' | 'daily' | 'monthly'
  ): CostSummary {
    const filteredLogs = this.logs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime()
      return logTime >= startMs && logTime <= endMs
    })

    const geminiLogs = filteredLogs.filter((log) => log.provider === 'gemini')
    const openaiLogs = filteredLogs.filter((log) => log.provider === 'openai')

    return {
      period,
      gemini: {
        calls: geminiLogs.length,
        tokens: geminiLogs.reduce((sum, log) => sum + log.tokens, 0),
        cost: geminiLogs.reduce((sum, log) => sum + log.cost, 0),
      },
      openai: {
        calls: openaiLogs.length,
        tokens: openaiLogs.reduce((sum, log) => sum + log.tokens, 0),
        cost: openaiLogs.reduce((sum, log) => sum + log.cost, 0),
      },
      total: {
        calls: filteredLogs.length,
        tokens: filteredLogs.reduce((sum, log) => sum + log.tokens, 0),
        cost: filteredLogs.reduce((sum, log) => sum + log.cost, 0),
      },
    }
  }

  /**
   * Get free tier usage statistics
   */
  getFreeTierUsage(): {
    geminiCalls: number
    geminiTokens: number
    freeCalls: number
    paidCalls: number
  } {
    const now = Date.now()
    const oneDayAgo = now - ONE_DAY_MS

    const recentGeminiLogs = this.logs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime()
      return log.provider === 'gemini' && logTime >= oneDayAgo
    })

    const freeCalls = recentGeminiLogs.filter((log) => log.cost === 0).length
    const paidCalls = recentGeminiLogs.filter((log) => log.cost > 0).length

    return {
      geminiCalls: recentGeminiLogs.length,
      geminiTokens: recentGeminiLogs.reduce((sum, log) => sum + log.tokens, 0),
      freeCalls,
      paidCalls,
    }
  }

  /**
   * Check if cost alert should be triggered
   *
   * @param config - Alert configuration
   * @returns true if any alert threshold is exceeded
   */
  shouldAlert(config: CostAlertConfig): boolean {
    const dailySummary = this.getDailySummary()
    const monthlySummary = this.getMonthlySummary()
    const freeUsage = this.getFreeTierUsage()

    // Check daily cost threshold
    if (dailySummary.total.cost >= config.dailyThreshold) {
      console.warn('[Cost Alert] Daily cost threshold exceeded:', {
        current: dailySummary.total.cost,
        threshold: config.dailyThreshold,
      })
      return true
    }

    // Check monthly cost threshold
    if (monthlySummary.total.cost >= config.monthlyThreshold) {
      console.warn('[Cost Alert] Monthly cost threshold exceeded:', {
        current: monthlySummary.total.cost,
        threshold: config.monthlyThreshold,
      })
      return true
    }

    // Check approaching Gemini free tier limit (daily: 1500)
    const GEMINI_DAILY_LIMIT = 1500
    const usagePercentage = freeUsage.geminiCalls / GEMINI_DAILY_LIMIT

    if (usagePercentage >= config.rateLimitWarning) {
      console.warn('[Cost Alert] Approaching Gemini rate limit:', {
        current: freeUsage.geminiCalls,
        limit: GEMINI_DAILY_LIMIT,
        percentage: (usagePercentage * 100).toFixed(1) + '%',
      })
      return true
    }

    return false
  }

  /**
   * Export all logged API calls
   *
   * @returns Array of all API call logs
   */
  exportLogs(): ApiCallCost[] {
    return [...this.logs] // Return copy
  }

  /**
   * Reset cost tracker (clear all logs)
   */
  reset(): void {
    this.logs = []
  }

  /**
   * Get logs for a specific user
   */
  getUserLogs(userId: string): ApiCallCost[] {
    return this.logs.filter((log) => log.userId === userId)
  }

  /**
   * Get logs for a specific provider
   */
  getProviderLogs(provider: 'gemini' | 'openai'): ApiCallCost[] {
    return this.logs.filter((log) => log.provider === provider)
  }

  /**
   * Calculate total cost for a specific user
   */
  getUserTotalCost(userId: string): number {
    return this.getUserLogs(userId).reduce((sum, log) => sum + log.cost, 0)
  }

  /**
   * Get cost breakdown by endpoint
   */
  getCostByEndpoint(): Record<string, { calls: number; cost: number }> {
    const breakdown: Record<string, { calls: number; cost: number }> = {}

    this.logs.forEach((log) => {
      const endpoint = log.endpoint || 'unknown'
      if (!breakdown[endpoint]) {
        breakdown[endpoint] = { calls: 0, cost: 0 }
      }
      breakdown[endpoint].calls++
      breakdown[endpoint].cost += log.cost
    })

    return breakdown
  }
}

/**
 * Global cost tracker instance
 */
let globalCostTracker: CostTracker | null = null

/**
 * Get or create global cost tracker
 */
export function getGlobalCostTracker(): CostTracker {
  if (!globalCostTracker) {
    globalCostTracker = new CostTracker()
  }
  return globalCostTracker
}

/**
 * Reset global cost tracker
 */
export function resetGlobalCostTracker(): void {
  globalCostTracker = null
}

/**
 * Calculate cost for a given provider and token count
 */
export function calculateCost(
  provider: 'gemini' | 'openai',
  tokens: number,
  isGeminiFree: boolean = true
): number {
  if (provider === 'gemini') {
    if (isGeminiFree) {
      return 0.0 // Free tier
    }
    // Gemini paid tier: $0.001 per 1M tokens
    return (tokens / 1_000_000) * 0.001
  }

  if (provider === 'openai') {
    // OpenAI text-embedding-3-small: $0.02 per 1M tokens
    return (tokens / 1_000_000) * 0.02
  }

  return 0
}

/**
 * Log embedding API call with automatic cost calculation
 */
export function logEmbeddingCall(params: {
  provider: 'gemini' | 'openai'
  model: string
  tokens: number
  userId?: string
  endpoint?: string
  isGeminiFree?: boolean
}): void {
  const tracker = getGlobalCostTracker()

  const cost = calculateCost(
    params.provider,
    params.tokens,
    params.isGeminiFree ?? true
  )

  tracker.logApiCall({
    provider: params.provider,
    model: params.model,
    tokens: params.tokens,
    cost,
    timestamp: new Date().toISOString(),
    userId: params.userId,
    endpoint: params.endpoint,
  })
}
