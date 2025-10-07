/**
 * Gemini Embedding Client
 *
 * Provides embedding generation using Google's Gemini API
 * with retry logic, error handling, and cost tracking.
 */

import {
  GeminiEmbeddingRequest,
  GeminiEmbeddingResponse,
  GeminiErrorResponse,
  GeminiOutputDimension,
  ValidationError,
  APIError,
  RateLimitError,
  AuthenticationError,
  IEmbeddingProvider,
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult,
  RetryConfig,
} from './types'
import { normalizeVector } from './utils'

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-embedding-001'
const MAX_TEXT_LENGTH_CHARS = 8000 // Conservative estimate for ~2048 tokens
const MAX_TOKENS = 2048 // Gemini's actual token limit

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
}

/**
 * Configuration for Gemini embedding client
 */
export interface GeminiClientConfig {
  apiKey: string
  model?: typeof DEFAULT_MODEL | 'text-embedding-004'
  outputDimensionality?: GeminiOutputDimension
  retryConfig?: RetryConfig
}

/**
 * Gemini Embedding Client
 * Implements the IEmbeddingProvider interface
 */
export class GeminiEmbeddingClient implements IEmbeddingProvider {
  readonly name = 'gemini' as const
  private apiKey: string
  private model: string
  private defaultDimension: GeminiOutputDimension
  private retryConfig: RetryConfig

  constructor(config: GeminiClientConfig) {
    if (!config.apiKey) {
      throw new ValidationError(
        'Gemini API key is required',
        'apiKey'
      )
    }

    this.apiKey = config.apiKey
    this.model = config.model || DEFAULT_MODEL
    this.defaultDimension = config.outputDimensionality || 1536
    this.retryConfig = config.retryConfig || DEFAULT_RETRY_CONFIG
  }

  /**
   * Generate embedding for text
   *
   * @param request - Embedding request parameters
   * @param normalize - Whether to normalize the vector (default: true)
   * @returns Embedding response with vector and metadata
   * @throws ValidationError if input is invalid
   * @throws RateLimitError if rate limit is exceeded
   * @throws APIError if API call fails
   */
  async generateEmbedding(
    request: GeminiEmbeddingRequest | EmbeddingGenerationRequest,
    normalize: boolean = true
  ): Promise<GeminiEmbeddingResponse> {
    // Validate input
    this.validateRequest(request)

    const text = request.text
    const outputDimensionality =
      'outputDimensionality' in request
        ? request.outputDimensionality
        : this.defaultDimension
    const taskType =
      'taskType' in request ? request.taskType : undefined

    // Build request body
    const requestBody = {
      model: `models/${this.model}`,
      content: {
        parts: [{ text }],
      },
      taskType: taskType || this.inferTaskType(request),
      outputDimensionality: outputDimensionality || this.defaultDimension,
    }

    // Make API call with retry logic
    const response = await this.callApiWithRetry(requestBody)

    // Extract and process embedding
    let embedding = response.embedding.values

    // Normalize if requested
    if (normalize) {
      embedding = normalizeVector(embedding)
    }

    // Estimate token count (rough approximation: 4 chars ≈ 1 token)
    const tokenCount = Math.ceil(text.length / 4)

    return {
      embedding,
      model: this.model,
      tokenCount,
      provider: 'gemini',
    }
  }

  /**
   * Validate embedding request
   * @throws ValidationError if validation fails
   */
  private validateRequest(request: GeminiEmbeddingRequest | EmbeddingGenerationRequest): void {
    const text = request.text

    if (!text || text.trim().length === 0) {
      throw new ValidationError('Text cannot be empty', 'text')
    }

    if (text.length > MAX_TEXT_LENGTH_CHARS) {
      throw new ValidationError(
        `Text exceeds max length of ${MAX_TEXT_LENGTH_CHARS} characters (approximately ${MAX_TOKENS} tokens)`,
        'text'
      )
    }

    if ('outputDimensionality' in request && request.outputDimensionality) {
      const validDimensions: GeminiOutputDimension[] = [768, 1536, 3072]
      if (!validDimensions.includes(request.outputDimensionality)) {
        throw new ValidationError(
          `Invalid output dimensionality. Must be one of: ${validDimensions.join(', ')}`,
          'outputDimensionality'
        )
      }
    }
  }

  /**
   * Infer task type from request
   */
  private inferTaskType(
    request: GeminiEmbeddingRequest | EmbeddingGenerationRequest
  ): string {
    if ('taskType' in request && request.taskType) {
      return request.taskType
    }

    if ('type' in request) {
      switch (request.type) {
        case 'query':
          return 'RETRIEVAL_QUERY'
        case 'summary':
        case 'chunk':
          return 'RETRIEVAL_DOCUMENT'
        default:
          return 'SEMANTIC_SIMILARITY'
      }
    }

    return 'SEMANTIC_SIMILARITY'
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callApiWithRetry(
    requestBody: Record<string, unknown>
  ): Promise<{ embedding: { values: number[] } }> {
    let lastError: unknown

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${GEMINI_API_BASE_URL}/models/${this.model}:embedContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        )

        if (!response.ok) {
          const errorData: GeminiErrorResponse = await response.json()

          // Handle specific error codes
          if (response.status === 401) {
            throw new AuthenticationError(
              errorData.error?.message || 'Invalid API key',
              'gemini'
            )
          }

          if (response.status === 429) {
            throw new RateLimitError(
              errorData.error?.message || 'Rate limit exceeded',
              60 // Retry after 60 seconds
            )
          }

          // Throw API error for other status codes
          throw new APIError(
            errorData.error?.message || `API error: ${response.status}`,
            response.status,
            'gemini',
            response.status >= 500 // Retry on 5xx errors
          )
        }

        const data = await response.json()

        // Validate response structure
        if (!data.embedding || !Array.isArray(data.embedding.values)) {
          throw new APIError(
            'Invalid response format from Gemini API',
            500,
            'gemini',
            true
          )
        }

        return data
      } catch (error) {
        lastError = error

        // Don't retry on validation errors or authentication errors
        if (
          error instanceof ValidationError ||
          error instanceof AuthenticationError ||
          error instanceof RateLimitError
        ) {
          throw error
        }

        // Don't retry if this was the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay *
            Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        )

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // All retries failed
    if (lastError instanceof Error) {
      throw lastError
    }

    throw new APIError(
      'Failed to generate embedding after retries',
      500,
      'gemini',
      false
    )
  }

  /**
   * Check if Gemini API is available
   * @returns true if API is reachable and valid, false otherwise
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.generateEmbedding(
        { text: 'test', outputDimensionality: 1536 },
        false
      )
      return true
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return false
      }
      // Other errors (rate limit, server errors) don't mean unavailable
      return true
    }
  }

  /**
   * Estimate cost for given number of tokens
   * @param tokens - Number of tokens
   * @returns Estimated cost in USD
   */
  estimateCost(tokens: number): number {
    // Gemini free tier: 15 RPM, 1500/day = $0.00
    // Paid tier: $0.001 per 1M tokens
    // For estimation purposes, assume free tier for small amounts
    if (tokens < 100_000) {
      return 0.0
    }
    return (tokens / 1_000_000) * 0.001
  }
}

/**
 * Convenience function to generate Gemini embedding using environment variable for API key
 *
 * @param text - Text to embed
 * @param options - Optional request parameters
 * @returns Embedding response
 * @throws Error if GOOGLE_GEMINI_API_KEY is not set
 */
export async function generateGeminiEmbedding(
  text: string,
  options?: Partial<GeminiEmbeddingRequest>
): Promise<GeminiEmbeddingResponse> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      'GOOGLE_GEMINI_API_KEY environment variable is not set'
    )
  }

  const client = new GeminiEmbeddingClient({ apiKey })

  return client.generateEmbedding({
    text,
    ...options,
  })
}
