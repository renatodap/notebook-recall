/**
 * Embedding Client
 *
 * Handles embedding generation via Anthropic API
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  BatchEmbeddingRequest,
  BatchEmbeddingResult,
  EmbeddingError,
  RetryConfig,
  Embedding,
} from './types';
import { normalizeVector } from './utils';

const MAX_TEXT_LENGTH = 8000;
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate embedding for a single text
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

  return withRetry(async () => {
    try {
      // Note: Anthropic doesn't have a direct embeddings endpoint
      // We'll use OpenAI's API for embeddings instead
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          input: request.text,
          model: 'text-embedding-3-small',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate embedding');
      }

      const data = await response.json();
      let embedding: Embedding = data.data[0].embedding;

      // Normalize if requested
      if (request.normalize !== false) {
        embedding = normalizeVector(embedding);
      }

      return {
        embedding,
        model: 'text-embedding-3-small',
        tokens: data.usage.total_tokens,
        dimensions: 1536,
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
  }, DEFAULT_RETRY_CONFIG);
}

/**
 * Generate embeddings for multiple texts in batch
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
      totalTokens += result.tokens;
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
 * Generate embedding from plain text (convenience method)
 */
export async function embed(text: string): Promise<Embedding> {
  const result = await generateEmbedding({
    text,
    type: 'query',
    normalize: true,
  });

  return result.embedding;
}

/**
 * Execute function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors
      if (
        error instanceof EmbeddingError &&
        error.code === 'VALIDATION_ERROR'
      ) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
