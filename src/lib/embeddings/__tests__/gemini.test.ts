/**
 * Gemini Embedding Client - Unit Tests
 * Following TDD: These tests are written BEFORE implementation
 */

import {
  generateGeminiEmbedding,
  GeminiEmbeddingClient,
} from '../gemini'
import {
  GeminiEmbeddingRequest,
  GeminiEmbeddingResponse,
  ValidationError,
  APIError,
  RateLimitError,
  AuthenticationError,
} from '../types'

// Mock fetch globally
global.fetch = jest.fn()

describe('GeminiEmbeddingClient', () => {
  let client: GeminiEmbeddingClient

  beforeEach(() => {
    client = new GeminiEmbeddingClient({
      apiKey: 'test-api-key',
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('generateEmbedding', () => {
    // GC-001: Generate embedding with valid text
    it('should generate 1536-dimensional embedding with valid text', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Hello world',
        outputDimensionality: 1536,
      }

      const result = await client.generateEmbedding(request)

      expect(result.embedding).toHaveLength(1536)
      expect(result.model).toBe('gemini-embedding-001')
      expect(result.provider).toBe('gemini')
      expect(result.tokenCount).toBeGreaterThan(0)
    })

    // GC-002: Handle empty text
    it('should throw ValidationError for empty text', async () => {
      const request: GeminiEmbeddingRequest = {
        text: '',
      }

      await expect(client.generateEmbedding(request)).rejects.toThrow(
        ValidationError
      )
      await expect(client.generateEmbedding(request)).rejects.toThrow(
        'Text cannot be empty'
      )
    })

    // GC-003: Handle text too long
    it('should throw ValidationError for text exceeding max length', async () => {
      const longText = 'a'.repeat(10000)
      const request: GeminiEmbeddingRequest = {
        text: longText,
      }

      await expect(client.generateEmbedding(request)).rejects.toThrow(
        ValidationError
      )
      await expect(client.generateEmbedding(request)).rejects.toThrow(
        'exceeds max length'
      )
    })

    // GC-004: Handle API error (500) with retries
    it('should retry 3 times on 500 error then throw APIError', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            code: 500,
            message: 'Internal server error',
            status: 'INTERNAL',
          },
        }),
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
      }

      await expect(client.generateEmbedding(request)).rejects.toThrow(APIError)

      // Should have called fetch 4 times (1 initial + 3 retries)
      expect(global.fetch).toHaveBeenCalledTimes(4)
    }, 15000)

    // GC-005: Handle rate limit (429)
    it('should throw RateLimitError on 429 response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: 429,
            message: 'Rate limit exceeded',
            status: 'RESOURCE_EXHAUSTED',
          },
        }),
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
      }

      await expect(client.generateEmbedding(request)).rejects.toThrow(
        RateLimitError
      )

      // Should NOT retry on 429
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    // GC-006: Handle invalid API key (401)
    it('should throw AuthenticationError on 401 response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 401,
            message: 'Invalid API key',
            status: 'UNAUTHENTICATED',
          },
        }),
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
      }

      await expect(client.generateEmbedding(request)).rejects.toThrow(
        AuthenticationError
      )
      await expect(client.generateEmbedding(request)).rejects.toThrow(
        'Invalid API key'
      )
    }, 10000)

    // GC-007: Normalize embedding vector
    it('should normalize embedding vector when requested', async () => {
      const unnormalizedEmbedding = [3, 4] // Magnitude = 5
      const mockResponse = {
        embedding: {
          values: unnormalizedEmbedding,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
      }

      const result = await client.generateEmbedding(request, true) // normalize=true

      // Calculate magnitude of normalized vector
      const magnitude = Math.sqrt(
        result.embedding.reduce((sum, val) => sum + val * val, 0)
      )

      expect(magnitude).toBeCloseTo(1.0, 3)
    })

    // GC-008: Generate with different dimensions
    it('should generate 768-dimensional embedding when requested', async () => {
      const mockEmbedding = new Array(768).fill(0).map(() => Math.random())
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
        outputDimensionality: 768,
      }

      const result = await client.generateEmbedding(request)

      expect(result.embedding).toHaveLength(768)
    })

    // GC-009: Retry on transient failure
    it('should succeed after transient failure on retry', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      const mockSuccessResponse = {
        embedding: {
          values: mockEmbedding,
        },
      }

      // First call fails with 503, second succeeds
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({
            error: {
              code: 503,
              message: 'Service unavailable',
              status: 'UNAVAILABLE',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse,
        })

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
      }

      const result = await client.generateEmbedding(request)

      expect(result.embedding).toHaveLength(1536)
      expect(global.fetch).toHaveBeenCalledTimes(2) // 1 fail + 1 success
    })

    // GC-010: Respect task type parameter
    it('should include taskType in request body', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Query text',
        taskType: 'RETRIEVAL_QUERY',
      }

      await client.generateEmbedding(request)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.taskType).toBe('RETRIEVAL_QUERY')
    })

    // Additional edge case: Network timeout
    it('should handle network timeout with retry', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      )

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
      }

      await expect(client.generateEmbedding(request)).rejects.toThrow()
    }, 10000)

    // Additional edge case: Malformed API response
    it('should throw error on malformed API response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing 'embedding' field
          invalid: 'response',
        }),
      })

      const request: GeminiEmbeddingRequest = {
        text: 'Test',
      }

      await expect(client.generateEmbedding(request)).rejects.toThrow()
    }, 10000)

    // Additional edge case: Unicode text
    it('should handle Unicode text correctly', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: GeminiEmbeddingRequest = {
        text: 'こんにちは世界 🌍',
      }

      const result = await client.generateEmbedding(request)

      expect(result.embedding).toHaveLength(1536)
    })
  })

  describe('estimateCost', () => {
    it('should return 0 for free tier usage', () => {
      const cost = client.estimateCost(1000)
      expect(cost).toBe(0.0)
    })

    it('should calculate cost correctly for paid tier', () => {
      const cost = client.estimateCost(1_000_000)
      // Gemini paid tier: $0.001/1M tokens
      expect(cost).toBe(0.001)
    })
  })

  describe('checkAvailability', () => {
    it('should return true when API key is valid', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const available = await client.checkAvailability()

      expect(available).toBe(true)
    })

    it('should return false when API key is invalid', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 401,
            message: 'Invalid API key',
            status: 'UNAUTHENTICATED',
          },
        }),
      })

      const available = await client.checkAvailability()

      expect(available).toBe(false)
    })
  })
})

describe('generateGeminiEmbedding (convenience function)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate embedding using environment variable for API key', async () => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key'

    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
    const mockResponse = {
      embedding: {
        values: mockEmbedding,
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateGeminiEmbedding('Test text')

    expect(result.embedding).toHaveLength(1536)
    expect(result.provider).toBe('gemini')

    delete process.env.GOOGLE_GEMINI_API_KEY
  })

  it('should throw error if API key is not set', async () => {
    delete process.env.GOOGLE_GEMINI_API_KEY

    await expect(generateGeminiEmbedding('Test')).rejects.toThrow(
      'GOOGLE_GEMINI_API_KEY'
    )
  })
})
