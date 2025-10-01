/**
 * Embedding Module Interfaces
 *
 * Function signatures for embedding generation, vector operations, and backfill processes.
 */

import {
  Embedding,
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  BatchEmbeddingRequest,
  BatchEmbeddingResult,
  BackfillConfig,
  BackfillResult,
  HybridSearchWeights,
  HybridScore,
  RetryConfig,
} from './types';

/**
 * Embedding Client Interface
 *
 * Responsible for generating embeddings via Claude API
 */
export interface IEmbeddingClient {
  /**
   * Generate a single embedding for text
   *
   * @param request - Embedding generation request
   * @returns Promise resolving to embedding result
   * @throws EmbeddingError if generation fails
   */
  generateEmbedding(
    request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult>;

  /**
   * Generate embeddings for multiple texts in batch
   *
   * @param request - Batch embedding request
   * @returns Promise resolving to batch results
   */
  generateEmbeddings(
    request: BatchEmbeddingRequest
  ): Promise<BatchEmbeddingResult>;

  /**
   * Generate embedding from plain text (convenience method)
   *
   * @param text - Text to embed
   * @returns Promise resolving to embedding vector
   */
  embed(text: string): Promise<Embedding>;
}

/**
 * Vector Operations Interface
 *
 * Mathematical operations on embedding vectors
 */
export interface IVectorOperations {
  /**
   * Calculate cosine similarity between two vectors
   *
   * @param vec1 - First embedding vector
   * @param vec2 - Second embedding vector
   * @returns Similarity score between 0 and 1
   * @throws Error if vectors have different dimensions
   */
  cosineSimilarity(vec1: Embedding, vec2: Embedding): number;

  /**
   * Normalize a vector to unit length
   *
   * @param vector - Vector to normalize
   * @returns Normalized vector with magnitude 1.0
   */
  normalizeVector(vector: Embedding): Embedding;

  /**
   * Calculate dot product of two vectors
   *
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Dot product
   */
  dotProduct(vec1: Embedding, vec2: Embedding): number;

  /**
   * Calculate Euclidean distance between two vectors
   *
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Euclidean distance
   */
  euclideanDistance(vec1: Embedding, vec2: Embedding): number;

  /**
   * Validate that vector has expected dimensions
   *
   * @param vector - Vector to validate
   * @param expectedDimensions - Expected number of dimensions (default: 1536)
   * @returns True if valid
   * @throws Error if dimensions don't match
   */
  validateDimensions(vector: Embedding, expectedDimensions?: number): boolean;
}

/**
 * Hybrid Search Scoring Interface
 *
 * Combines semantic and keyword search scores
 */
export interface IHybridSearch {
  /**
   * Calculate hybrid score from semantic and keyword scores
   *
   * @param semanticScore - Semantic similarity score (0-1) or null
   * @param keywordScore - Keyword match score (0-1) or null
   * @param weights - Weights for each component (must sum to 1.0)
   * @returns Combined hybrid score
   * @throws Error if weights don't sum to 1.0
   */
  calculateHybridScore(
    semanticScore: number | null,
    keywordScore: number | null,
    weights?: HybridSearchWeights
  ): HybridScore;

  /**
   * Get default hybrid search weights
   *
   * @returns Default weights (semantic: 0.7, keyword: 0.3)
   */
  getDefaultWeights(): HybridSearchWeights;

  /**
   * Validate that weights sum to 1.0
   *
   * @param weights - Weights to validate
   * @returns True if valid
   * @throws Error if weights invalid
   */
  validateWeights(weights: HybridSearchWeights): boolean;
}

/**
 * Backfill Service Interface
 *
 * Batch process to generate embeddings for existing summaries
 */
export interface IBackfillService {
  /**
   * Backfill embeddings for summaries without them
   *
   * @param config - Backfill configuration
   * @returns Promise resolving to backfill result
   */
  backfillEmbeddings(config?: BackfillConfig): Promise<BackfillResult>;

  /**
   * Get count of summaries needing embeddings
   *
   * @returns Promise resolving to count
   */
  getPendingCount(): Promise<number>;

  /**
   * Get count of summaries with embeddings
   *
   * @returns Promise resolving to count
   */
  getCompletedCount(): Promise<number>;

  /**
   * Process a single batch of summaries
   *
   * @param batchSize - Number of summaries to process
   * @returns Promise resolving to number processed
   */
  processBatch(batchSize: number): Promise<number>;
}

/**
 * Retry Logic Interface
 *
 * Handle retries with exponential backoff
 */
export interface IRetryLogic {
  /**
   * Execute function with retry logic
   *
   * @param fn - Function to execute
   * @param config - Retry configuration
   * @returns Promise resolving to function result
   */
  withRetry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>;

  /**
   * Calculate delay for next retry attempt
   *
   * @param attempt - Current attempt number (0-indexed)
   * @param config - Retry configuration
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number, config: RetryConfig): number;

  /**
   * Determine if error is retryable
   *
   * @param error - Error to check
   * @returns True if retryable
   */
  isRetryable(error: unknown): boolean;
}

/**
 * Embedding Cache Interface
 *
 * Cache query embeddings for performance
 */
export interface IEmbeddingCache {
  /**
   * Get cached embedding for text
   *
   * @param text - Query text
   * @returns Cached embedding or null if not found/expired
   */
  get(text: string): Embedding | null;

  /**
   * Set cached embedding for text
   *
   * @param text - Query text
   * @param embedding - Embedding to cache
   * @param ttl - Time to live in milliseconds (default: 1 hour)
   */
  set(text: string, embedding: Embedding, ttl?: number): void;

  /**
   * Clear expired cache entries
   */
  cleanup(): void;

  /**
   * Clear all cache entries
   */
  clear(): void;
}

/**
 * Database Query Interface for Embeddings
 *
 * Database operations related to embeddings
 */
export interface IEmbeddingDatabase {
  /**
   * Store embedding for a summary
   *
   * @param summaryId - Summary ID
   * @param embedding - Embedding vector
   * @returns Promise resolving to success
   */
  storeEmbedding(summaryId: string, embedding: Embedding): Promise<boolean>;

  /**
   * Search summaries by embedding similarity
   *
   * @param queryEmbedding - Query embedding vector
   * @param limit - Maximum results to return
   * @param threshold - Minimum similarity threshold (0-1)
   * @param userId - User ID for filtering
   * @returns Promise resolving to matching summary IDs with scores
   */
  searchByEmbedding(
    queryEmbedding: Embedding,
    limit: number,
    threshold: number,
    userId: string
  ): Promise<Array<{ summary_id: string; similarity: number }>>;

  /**
   * Get summaries without embeddings
   *
   * @param userId - User ID for filtering
   * @param limit - Maximum results to return
   * @returns Promise resolving to summary IDs
   */
  getSummariesWithoutEmbeddings(
    userId: string,
    limit: number
  ): Promise<string[]>;

  /**
   * Get embedding for summary
   *
   * @param summaryId - Summary ID
   * @returns Promise resolving to embedding or null
   */
  getEmbedding(summaryId: string): Promise<Embedding | null>;
}
