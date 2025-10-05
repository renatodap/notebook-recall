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

  constructor(message: string, code?: string, retryable?: boolean, cause?: any) {
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
  failed?: number
  failures: Array<{ summary_id?: string; sourceId?: string; error: string }>
  skipped?: number
  duration_ms?: number
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
  metadata?: Record<string, any>
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
  finalScore?: number
  weights?: HybridSearchWeights
}
