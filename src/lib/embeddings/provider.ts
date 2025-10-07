/**
 * Embedding Provider with Smart Fallback
 *
 * Orchestrates embedding generation across Gemini (primary) and OpenAI (fallback)
 * with rate limiting, cost tracking, and intelligent provider selection.
 */

import { GeminiEmbeddingClient } from './gemini'
import { generateEmbedding as generateOpenAIEmbedding } from './client'
import { getGlobalGeminiRateLimiter } from './rate-limiter'
import { getGlobalCostTracker, calculateCost } from './cost-tracker'
import {
  ProviderConfig,
  ProviderEmbeddingResult,
  ProviderSelectionResult,
  EmbeddingGenerationRequest,
  RateLimitError,
  APIError,
  AuthenticationError,
  EmbeddingProvider as EmbeddingProviderType,
  GeminiOutputDimension,
} from './types'

/**
 * Default provider configuration
 */
const DEFAULT_CONFIG: ProviderConfig = {
  strategy: (process.env.EMBEDDING_PROVIDER as any) || 'dual',
  geminiRateLimitRPM: parseInt(process.env.GEMINI_RATE_LIMIT_RPM || '15'),
  geminiRateLimitDaily: parseInt(process.env.GEMINI_RATE_LIMIT_DAILY || '1500'),
  fallbackEnabled: process.env.EMBEDDING_FALLBACK_ENABLED !== 'false',
  costLoggingEnabled: process.env.EMBEDDING_COST_LOGGING !== 'false',
  preferredDimension: (parseInt(process.env.EMBEDDING_DIMENSION || '1536') as GeminiOutputDimension),
}

/**
 * Embedding Provider with automatic fallback and cost optimization
 */
export class EmbeddingProvider {
  private geminiClient: GeminiEmbeddingClient | null = null
  private config: ProviderConfig
  private rateLimiter = getGlobalGeminiRateLimiter()
  private costTracker = getGlobalCostTracker()

  constructor(config: Partial<ProviderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Initialize Gemini client if API key is available
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      this.geminiClient = new GeminiEmbeddingClient({
        apiKey: process.env.GOOGLE_GEMINI_API_KEY,
        outputDimensionality: this.config.preferredDimension,
      })
    }
  }

  /**
   * Generate embedding with automatic provider selection and fallback
   *
   * @param request - Embedding generation request
   * @returns Embedding result with provider info, cost, and latency
   */
  async generateEmbedding(
    request: EmbeddingGenerationRequest
  ): Promise<ProviderEmbeddingResult> {
    const startTime = Date.now()

    // Determine which provider to use
    const selection = await this.selectProvider(request)

    let result: ProviderEmbeddingResult | null = null
    let fallbackUsed = false

    try {
      // Try primary provider
      if (selection.provider === 'gemini') {
        result = await this.callGemini(request, startTime)
      } else {
        result = await this.callOpenAI(request, startTime)
      }
    } catch (error) {
      // Handle errors with fallback logic
      result = await this.handleProviderError(
        error,
        request,
        selection.provider,
        startTime
      )
      fallbackUsed = true
    }

    if (!result) {
      throw new Error('Failed to generate embedding from any provider')
    }

    // Update fallback flag
    result.fallbackUsed = fallbackUsed

    // Log cost if enabled
    if (this.config.costLoggingEnabled) {
      this.logCost(result, request)
    }

    return result
  }

  /**
   * Select the best provider for this request
   */
  private async selectProvider(
    request: EmbeddingGenerationRequest
  ): Promise<ProviderSelectionResult> {
    // Strategy: openai-only
    if (this.config.strategy === 'openai-only') {
      return {
        provider: 'openai',
        reason: 'config',
        rateLimited: false,
      }
    }

    // Strategy: gemini-only
    if (this.config.strategy === 'gemini-only') {
      return {
        provider: 'gemini',
        reason: 'config',
        rateLimited: false,
      }
    }

    // Strategy: dual (intelligent routing)

    // Check if Gemini client is available
    if (!this.geminiClient) {
      return {
        provider: 'openai',
        reason: 'config',
        rateLimited: false,
      }
    }

    // Check text length (Gemini max: 2048 tokens ≈ 8000 chars)
    const estimatedTokens = Math.ceil(request.text.length / 4)
    if (estimatedTokens > 2048) {
      return {
        provider: 'openai',
        reason: 'text_too_long',
        rateLimited: false,
      }
    }

    // Check rate limits BEFORE calling API
    const rateLimitCheck = await this.rateLimiter.checkLimit()

    if (!rateLimitCheck.allowed) {
      // Rate limit would be exceeded, use OpenAI
      return {
        provider: 'openai',
        reason: 'rate_limit',
        rateLimited: true,
      }
    }

    // Default: Use Gemini (free tier, better quality)
    return {
      provider: 'gemini',
      reason: 'primary',
      rateLimited: false,
    }
  }

  /**
   * Call Gemini API
   */
  private async callGemini(
    request: EmbeddingGenerationRequest,
    startTime: number
  ): Promise<ProviderEmbeddingResult> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized')
    }

    const geminiRequest = {
      text: request.text,
      outputDimensionality: this.config.preferredDimension,
      taskType: this.mapRequestTypeToTaskType(request.type),
    }

    const result = await this.geminiClient.generateEmbedding(
      geminiRequest,
      request.normalize ?? true
    )

    // Record request in rate limiter
    this.rateLimiter.recordRequest()

    const latency_ms = Date.now() - startTime
    const cost = calculateCost('gemini', result.tokenCount, true)

    return {
      embedding: result.embedding,
      model: result.model,
      tokenCount: result.tokenCount,
      tokens: result.tokenCount,
      provider: 'gemini',
      fallbackUsed: false,
      cost,
      latency_ms,
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    request: EmbeddingGenerationRequest,
    startTime: number
  ): Promise<ProviderEmbeddingResult> {
    const result = await generateOpenAIEmbedding(request)

    const latency_ms = Date.now() - startTime
    const tokenCount = result.tokens || result.tokenCount || 0
    const cost = calculateCost('openai', tokenCount, false)

    return {
      embedding: result.embedding,
      model: result.model,
      tokenCount,
      tokens: tokenCount,
      provider: 'openai',
      fallbackUsed: false,
      cost,
      latency_ms,
    }
  }

  /**
   * Handle provider errors with intelligent fallback
   */
  private async handleProviderError(
    error: unknown,
    request: EmbeddingGenerationRequest,
    failedProvider: EmbeddingProviderType,
    startTime: number
  ): Promise<ProviderEmbeddingResult | null> {
    // Log the error
    console.error(`[Provider Error] ${failedProvider} failed:`, error)

    // If fallback is disabled, re-throw
    if (!this.config.fallbackEnabled) {
      throw error
    }

    // If OpenAI failed, no fallback available
    if (failedProvider === 'openai') {
      throw error
    }

    // If Gemini failed, try OpenAI

    // Determine fallback reason
    let fallbackReason = 'error'
    if (error instanceof RateLimitError) {
      fallbackReason = 'rate_limit'
    } else if (error instanceof APIError) {
      fallbackReason = 'error'
    }

    // Log fallback event
    console.log('[Provider Fallback]', {
      from: failedProvider,
      to: 'openai',
      reason: fallbackReason,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    try {
      // Attempt OpenAI fallback
      const result = await this.callOpenAI(request, startTime)
      result.fallbackUsed = true
      return result
    } catch (fallbackError) {
      // Both providers failed
      console.error('[Provider Error] OpenAI fallback also failed:', fallbackError)
      throw new Error(
        `All providers failed. Gemini: ${error instanceof Error ? error.message : 'Unknown'}, OpenAI: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`
      )
    }
  }

  /**
   * Map request type to Gemini task type
   */
  private mapRequestTypeToTaskType(
    type?: 'summary' | 'chunk' | 'query'
  ): 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' {
    switch (type) {
      case 'query':
        return 'RETRIEVAL_QUERY'
      case 'summary':
      case 'chunk':
        return 'RETRIEVAL_DOCUMENT'
      default:
        return 'SEMANTIC_SIMILARITY'
    }
  }

  /**
   * Log cost information
   */
  private logCost(
    result: ProviderEmbeddingResult,
    request: EmbeddingGenerationRequest
  ): void {
    this.costTracker.logApiCall({
      provider: result.provider,
      model: result.model,
      tokens: result.tokenCount,
      cost: result.cost,
      timestamp: new Date().toISOString(),
      userId: request.metadata?.userId as string | undefined,
      endpoint: request.metadata?.endpoint as string | undefined,
    })
  }

  /**
   * Get current configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config }
  }

  /**
   * Check if Gemini is available
   */
  async isGeminiAvailable(): Promise<boolean> {
    if (!this.geminiClient) {
      return false
    }

    try {
      return await this.geminiClient.checkAvailability()
    } catch {
      return false
    }
  }

  /**
   * Check if OpenAI is available
   */
  async isOpenAIAvailable(): Promise<boolean> {
    try {
      await generateOpenAIEmbedding({
        text: 'test',
        type: 'query',
      })
      return true
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false
      }
      return true // Other errors don't mean unavailable
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus() {
    return await this.rateLimiter.checkLimit()
  }

  /**
   * Get cost summary
   */
  getCostSummary() {
    return {
      daily: this.costTracker.getDailySummary(),
      monthly: this.costTracker.getMonthlySummary(),
      freeUsage: this.costTracker.getFreeTierUsage(),
    }
  }
}

/**
 * Global provider instance
 */
let globalProvider: EmbeddingProvider | null = null

/**
 * Get or create global embedding provider
 */
export function getGlobalEmbeddingProvider(
  config?: Partial<ProviderConfig>
): EmbeddingProvider {
  if (!globalProvider) {
    globalProvider = new EmbeddingProvider(config)
  }
  return globalProvider
}

/**
 * Reset global provider (useful for testing)
 */
export function resetGlobalProvider(): void {
  globalProvider = null
}

/**
 * Convenience function: Generate embedding with automatic provider selection
 *
 * This is the main entry point for application code.
 *
 * @param request - Embedding request
 * @returns Embedding result with provider info
 */
export async function generateEmbeddingWithFallback(
  request: EmbeddingGenerationRequest
): Promise<ProviderEmbeddingResult> {
  const provider = getGlobalEmbeddingProvider()
  return provider.generateEmbedding(request)
}
