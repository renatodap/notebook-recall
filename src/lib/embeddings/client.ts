/**
 * Embedding Client
 *
 * Handles embedding generation with intelligent provider selection:
 * - Gemini (FREE tier - 1500/day) as primary
 * - OpenAI ($0.13/M tokens) as automatic fallback
 *
 * Includes automatic retry, rate limiting, cost tracking, and normalization.
 */

import {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  BatchEmbeddingRequest,
  BatchEmbeddingResult,
  EmbeddingError,
  Embedding,
} from './types';
import { getGlobalEmbeddingProvider } from './provider';

const MAX_TEXT_LENGTH = 8000;

/**
 * Generates a single embedding vector using intelligent provider selection
 *
 * Uses Gemini (FREE tier) as primary with automatic fallback to OpenAI.
 * Automatically retries on failures and normalizes vectors by default.
 *
 * @param request - Embedding generation request with text and options
 * @returns Promise resolving to embedding result with vector, model info, and token count
 * @throws {EmbeddingError} If text is empty, too long, or API call fails
 *
 * @example
 * const result = await generateEmbedding({
 *   text: 'Machine learning is fascinating',
 *   type: 'document',
 *   normalize: true
 * })
 * console.log(result.embedding) // [0.1, -0.2, 0.3, ...]
 * console.log(result.tokenCount) // 5
 * console.log(result.provider) // 'gemini' or 'openai'
 * console.log(result.cost) // 0.0 (if Gemini) or ~0.000001 (if OpenAI)
 */
export async function generateEmbedding(
  request: EmbeddingGenerationRequest
): Promise<EmbeddingGenerationResult> {
  // Validate input length
  if (request.text.length > MAX_TEXT_LENGTH) {
    throw new EmbeddingError(
      `Text exceeds max length of ${MAX_TEXT_LENGTH} characters`,
      'VALIDATION_ERROR'
    );
  }

  if (!request.text || request.text.trim().length === 0) {
    throw new EmbeddingError('Text cannot be empty', 'VALIDATION_ERROR');
  }

  try {
    // Use provider with intelligent routing and fallback
    const provider = getGlobalEmbeddingProvider();
    const result = await provider.generateEmbedding(request);

    return {
      embedding: result.embedding,
      model: result.model,
      tokenCount: result.tokenCount,
      tokens: result.tokens,
      provider: result.provider,
      cost: result.cost,
      latency_ms: result.latency_ms,
      fallbackUsed: result.fallbackUsed,
    };
  } catch (error) {
    if (error instanceof EmbeddingError) {
      throw error;
    }

    throw new EmbeddingError(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'API_ERROR',
      true,
      error
    );
  }
}

/**
 * Generates embeddings for multiple texts in a batch operation
 *
 * Processes each text individually but returns aggregated results including
 * success/failure counts and total token usage. Continues processing even
 * if individual texts fail.
 *
 * @param request - Batch request with array of texts and options
 * @returns Promise resolving to batch result with per-text embeddings and statistics
 *
 * @example
 * const result = await generateEmbeddings({
 *   texts: ['First text', 'Second text', 'Third text'],
 *   type: 'document',
 *   normalize: true
 * })
 * console.log(result.successful)  // 3
 * console.log(result.failed)      // 0
 * console.log(result.totalTokens) // 15
 * console.log(result.results)     // Array of embeddings with indices
 */
export async function generateEmbeddings(
  request: BatchEmbeddingRequest
): Promise<BatchEmbeddingResult> {
  const results: BatchEmbeddingResult['results'] = [];
  let successful = 0;
  let failed = 0;
  let totalTokens = 0;

  for (let i = 0; i < request.texts.length; i++) {
    try {
      const result = await generateEmbedding({
        text: request.texts[i],
        type: request.type,
        normalize: request.normalize,
      });

      results.push({
        index: i,
        embedding: result.embedding,
      });

      successful++;
      totalTokens += result.tokens || result.tokenCount || 0;
    } catch (error) {
      results.push({
        index: i,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });

      failed++;
    }
  }

  return {
    results,
    successful,
    failed,
    totalTokens,
  };
}

/**
 * Convenience method to generate embedding from plain text with sensible defaults
 *
 * Simplified interface that automatically uses 'query' type and enables normalization.
 * Use this for quick embedding generation when you don't need detailed metadata.
 *
 * @param text - Text to generate embedding for (max 8000 characters)
 * @returns Promise resolving to normalized embedding vector
 * @throws {EmbeddingError} If text is invalid or API call fails
 *
 * @example
 * const embedding = await embed('What is machine learning?')
 * // Returns normalized vector ready for similarity search
 */
export async function embed(text: string): Promise<Embedding> {
  const result = await generateEmbedding({
    text,
    type: 'query',
    normalize: true,
  });

  return result.embedding;
}

