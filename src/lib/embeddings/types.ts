/**
 * Semantic Search RAG - Type Definitions
 */

export type Embedding = number[]

export interface EmbeddingVector {
  vector: number[]
  dimensions: number
}

export interface SourceEmbedding {
  id: string
  source_id: string
  chunk_id: number
  embedding: number[]
  content_preview: string
  created_at: string
}

export interface SemanticSearchOptions {
  limit?: number
  threshold?: number
  includeMetadata?: boolean
}

export interface SemanticSearchResult {
  source_id: string
  chunk_id: number
  similarity: number
  content_preview: string
  metadata?: {
    title?: string
    content_type?: string
    created_at?: string
  }
}

export interface EmbeddingGenerationResult {
  embedding: number[]
  tokenCount: number
  tokens?: number
  model: string
}

export class EmbeddingError extends Error {
  code?: string
  retryable?: boolean
  cause?: any

  constructor(message: string, code?: string, retryable?: boolean, cause?: unknown) {
    super(message)
    this.name = 'EmbeddingError'
    this.code = code
    this.retryable = retryable
    this.cause = cause
  }
}

export interface BatchEmbeddingRequest {
  texts: string[]
  sourceIds?: string[]
  type?: 'summary' | 'chunk' | 'query'
  normalize?: boolean
}

export interface BatchEmbeddingResult {
  successes?: Array<{
    sourceId: string
    embeddingId: string
  }>
  failures?: Array<{
    sourceId: string
    error: string
  }>
  results?: Array<{
    index: number
    embedding?: number[]
    error?: string
  }>
  successful?: number
  failed?: number
  totalTokens?: number
}

export interface BackfillConfig {
  batchSize?: number
  concurrent?: boolean
  dryRun?: boolean
  skipExisting?: boolean
  maxRetries?: number
  batch_size?: number
  dry_run?: boolean
}

export interface BackfillResult {
  total?: number
  processed: number
  successes?: number
  failed: number
  failures: Array<{ summary_id?: string; sourceId?: string; error: string }>
  skipped: number
  duration_ms: number
}

export interface BackfillProgress {
  current: number
  total: number
  percentage: number
}

export interface EmbeddingGenerationRequest {
  text: string
  type?: 'summary' | 'chunk' | 'query'
  normalize?: boolean
  metadata?: Record<string, unknown>
}

export interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export interface HybridSearchWeights {
  semantic: number
  keyword: number
}

export interface HybridScore {
  sourceId?: string
  semanticScore: number | null
  keywordScore: number | null
  combinedScore?: number
  finalScore: number
  weights: HybridSearchWeights
}

// ============================================================================
// Gemini Embedding Types
// ============================================================================

/**
 * Task type for Gemini embeddings
 * Optimizes the embedding for specific use cases
 */
export type GeminiTaskType =
  | 'RETRIEVAL_QUERY'      // For search queries
  | 'RETRIEVAL_DOCUMENT'   // For documents being indexed
  | 'SEMANTIC_SIMILARITY'  // For comparing text similarity

/**
 * Supported output dimensions for Gemini embeddings
 * 768: Faster, lower storage, good for general use
 * 1536: Balanced performance and accuracy (recommended for compatibility)
 * 3072: Best accuracy, higher cost and storage
 */
export type GeminiOutputDimension = 768 | 1536 | 3072

/**
 * Request parameters for Gemini embedding generation
 */
export interface GeminiEmbeddingRequest {
  text: string
  outputDimensionality?: GeminiOutputDimension
  taskType?: GeminiTaskType
  model?: 'gemini-embedding-001' | 'text-embedding-004'
}

/**
 * Response from Gemini embedding API
 */
export interface GeminiEmbeddingResponse {
  embedding: number[]
  model: string
  tokenCount: number
  provider: 'gemini'
}

/**
 * Gemini API error response structure
 */
export interface GeminiErrorResponse {
  error: {
    code: number
    message: string
    status: string
  }
}

// ============================================================================
// Provider System Types
// ============================================================================

/**
 * Available embedding providers
 */
export type EmbeddingProvider = 'gemini' | 'openai'

/**
 * Provider selection strategy
 * - dual: Try Gemini first, fallback to OpenAI
 * - gemini-only: Use only Gemini (no fallback)
 * - openai-only: Use only OpenAI (legacy mode)
 */
export type ProviderStrategy = 'dual' | 'gemini-only' | 'openai-only'

/**
 * Configuration for provider selection and fallback behavior
 */
export interface ProviderConfig {
  strategy: ProviderStrategy
  geminiRateLimitRPM: number       // Requests per minute for Gemini
  geminiRateLimitDaily: number     // Requests per day for Gemini
  fallbackEnabled: boolean         // Auto-fallback to OpenAI
  costLoggingEnabled: boolean      // Track API costs
  preferredDimension: GeminiOutputDimension  // Default dimension
}

/**
 * Result from provider selection logic
 */
export interface ProviderSelectionResult {
  provider: EmbeddingProvider
  reason: 'primary' | 'rate_limit' | 'error' | 'text_too_long' | 'config'
  rateLimited: boolean
}

/**
 * Extended embedding generation result with provider information
 */
export interface ProviderEmbeddingResult extends EmbeddingGenerationResult {
  provider: EmbeddingProvider
  fallbackUsed: boolean
  cost: number
  latency_ms: number
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerDay: number
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean
  reason?: 'rpm_exceeded' | 'daily_exceeded' | 'ok'
  retryAfter?: number  // Seconds until limit resets
  currentUsage: {
    rpm: number
    daily: number
  }
}

/**
 * Rate limiter state for a user or global
 */
export interface RateLimiterState {
  userId?: string
  requests: number[]  // Array of timestamps
  lastReset: number
}

// ============================================================================
// Cost Tracking Types
// ============================================================================

/**
 * API call cost information
 */
export interface ApiCallCost {
  provider: EmbeddingProvider
  model: string
  tokens: number
  cost: number  // USD
  timestamp: string
  userId?: string
  endpoint?: string
}

/**
 * Aggregated cost summary
 */
export interface CostSummary {
  period: 'hourly' | 'daily' | 'monthly'
  gemini: {
    calls: number
    tokens: number
    cost: number
  }
  openai: {
    calls: number
    tokens: number
    cost: number
  }
  total: {
    calls: number
    tokens: number
    cost: number
  }
}

/**
 * Cost alert configuration
 */
export interface CostAlertConfig {
  dailyThreshold: number    // Alert when daily cost exceeds this
  monthlyThreshold: number  // Alert when monthly cost exceeds this
  rateLimitWarning: number  // Alert when approaching rate limit (0.0-1.0)
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Rate limit error
 */
export class RateLimitError extends EmbeddingError {
  retryAfter: number  // Seconds

  constructor(message: string, retryAfter: number = 60) {
    super(message, 'RATE_LIMIT', false)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Authentication error (invalid API key)
 */
export class AuthenticationError extends EmbeddingError {
  constructor(message: string, provider: EmbeddingProvider) {
    super(message, 'AUTHENTICATION_ERROR', false)
    this.name = 'AuthenticationError'
    this.cause = { provider }
  }
}

/**
 * Validation error (invalid input)
 */
export class ValidationError extends EmbeddingError {
  field: string

  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', false)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * API error (service unavailable, etc.)
 */
export class APIError extends EmbeddingError {
  statusCode: number
  provider: EmbeddingProvider

  constructor(
    message: string,
    statusCode: number,
    provider: EmbeddingProvider,
    retryable: boolean = true
  ) {
    super(message, 'API_ERROR', retryable)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.provider = provider
  }
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Common interface for all embedding providers
 */
export interface IEmbeddingProvider {
  name: EmbeddingProvider
  generateEmbedding(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult>
  checkAvailability(): Promise<boolean>
  estimateCost(tokens: number): number
}

// ============================================================================
// Logging Types
// ============================================================================

/**
 * Structured log entry for embedding operations
 */
export interface EmbeddingLogEntry {
  timestamp: string
  event: 'embedding_generated' | 'fallback' | 'rate_limit' | 'error'
  provider: EmbeddingProvider
  model: string
  tokens?: number
  cost?: number
  latency_ms?: number
  userId?: string
  fallbackReason?: string
  errorMessage?: string
  errorCode?: string
}
