/**
 * Embedding Types
 *
 * Type definitions for vector embeddings and semantic search operations.
 */

/**
 * Vector embedding (1536 dimensions for text-embedding-3-small)
 */
export type Embedding = number[];

/**
 * Content types that can be embedded
 */
export type EmbeddableContentType = 'summary' | 'query' | 'title' | 'topics';

/**
 * Request to generate an embedding
 */
export interface EmbeddingGenerationRequest {
  text: string;
  type: EmbeddableContentType;
  normalize?: boolean;
}

/**
 * Result of embedding generation
 */
export interface EmbeddingGenerationResult {
  embedding: Embedding;
  model: string;
  tokens: number;
  dimensions: number;
}

/**
 * Batch embedding generation request
 */
export interface BatchEmbeddingRequest {
  texts: string[];
  type: EmbeddableContentType;
  normalize?: boolean;
}

/**
 * Single item in batch embedding result
 */
export interface BatchEmbeddingItem {
  index: number;
  embedding?: Embedding;
  error?: string;
}

/**
 * Result of batch embedding generation
 */
export interface BatchEmbeddingResult {
  results: BatchEmbeddingItem[];
  successful: number;
  failed: number;
  totalTokens: number;
}

/**
 * Backfill operation configuration
 */
export interface BackfillConfig {
  batch_size?: number;
  dry_run?: boolean;
  skipExisting?: boolean;
  maxRetries?: number;
}

/**
 * Progress report for backfill operation
 */
export interface BackfillProgress {
  processed: number;
  failed: number;
  skipped: number;
  remaining: number;
  failures: Array<{
    summary_id: string;
    error: string;
  }>;
}

/**
 * Result of backfill operation
 */
export interface BackfillResult {
  processed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  failures: Array<{
    summary_id: string;
    error: string;
  }>;
}

/**
 * Vector similarity score
 */
export interface SimilarityScore {
  score: number;
  type: 'cosine' | 'euclidean' | 'dot_product';
}

/**
 * Search mode options
 */
export type SearchMode = 'semantic' | 'keyword' | 'hybrid';

/**
 * Match type in search results
 */
export type MatchType = 'semantic' | 'keyword' | 'hybrid';

/**
 * Weights for hybrid search scoring
 */
export interface HybridSearchWeights {
  semantic: number;
  keyword: number;
}

/**
 * Hybrid score calculation result
 */
export interface HybridScore {
  finalScore: number;
  semanticScore: number | null;
  keywordScore: number | null;
  weights: HybridSearchWeights;
}

/**
 * Embedding API error
 */
export class EmbeddingError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR',
    public retryable: boolean = false,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Cache entry for query embeddings
 */
export interface CachedEmbedding {
  embedding: Embedding;
  timestamp: number;
  text: string;
}

/**
 * Embedding generation statistics
 */
export interface EmbeddingStats {
  totalGenerated: number;
  totalFailed: number;
  averageTokens: number;
  averageDuration: number;
  lastGenerated: Date | null;
}
