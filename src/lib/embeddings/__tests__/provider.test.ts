/**
 * Provider Selection Logic - Unit Tests
 * Following TDD: These tests are written BEFORE implementation
 */

import { EmbeddingProvider } from '../provider'
import {
  ProviderConfig,
  ProviderEmbeddingResult,
  EmbeddingGenerationRequest,
  RateLimitError,
  APIError,
} from '../types'

// Mock the clients
jest.mock('../gemini', () => ({
  GeminiEmbeddingClient: jest.fn().mockImplementation(() => ({
    generateEmbedding: jest.fn(),
    checkAvailability: jest.fn().mockResolvedValue(true),
    estimateCost: jest.fn().mockReturnValue(0.0),
    name: 'gemini',
  })),
}))

jest.mock('../client', () => ({
  generateEmbedding: jest.fn(),
}))

import { GeminiEmbeddingClient } from '../gemini'
import { generateEmbedding as generateOpenAIEmbedding } from '../client'

describe('EmbeddingProvider', () => {
  let provider: EmbeddingProvider
  let mockGeminiClient: jest.Mocked<any>
  let mockOpenAIGenerate: jest.MockedFunction<typeof generateOpenAIEmbedding>

  const defaultConfig: ProviderConfig = {
    strategy: 'dual',
    geminiRateLimitRPM: 15,
    geminiRateLimitDaily: 1500,
    fallbackEnabled: true,
    costLoggingEnabled: true,
    preferredDimension: 1536,
  }

  const mockEmbedding1536 = new Array(1536).fill(0).map(() => Math.random())

  beforeEach(() => {
    jest.clearAllMocks()

    // Get mocked clients
    mockGeminiClient = new (GeminiEmbeddingClient as any)()
    mockOpenAIGenerate = generateOpenAIEmbedding as jest.MockedFunction<
      typeof generateOpenAIEmbedding
    >

    provider = new EmbeddingProvider(defaultConfig)
  })

  describe('generateEmbedding', () => {
    const testRequest: EmbeddingGenerationRequest = {
      text: 'Test text',
      type: 'query',
      normalize: true,
    }

    // PS-001: Use Gemini when available
    it('should use Gemini as primary provider when available', async () => {
      mockGeminiClient.generateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'gemini-embedding-001',
        tokenCount: 10,
        provider: 'gemini',
      })

      const result = await provider.generateEmbedding(testRequest)

      expect(result.provider).toBe('gemini')
      expect(result.fallbackUsed).toBe(false)
      expect(result.embedding).toHaveLength(1536)
      expect(mockGeminiClient.generateEmbedding).toHaveBeenCalledTimes(1)
      expect(mockOpenAIGenerate).not.toHaveBeenCalled()
    })

    // PS-002: Fallback to OpenAI on Gemini rate limit
    it('should fallback to OpenAI when Gemini returns 429', async () => {
      mockGeminiClient.generateEmbedding.mockRejectedValueOnce(
        new RateLimitError('Rate limit exceeded', 60)
      )

      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 10,
        tokens: 10,
      })

      const result = await provider.generateEmbedding(testRequest)

      expect(result.provider).toBe('openai')
      expect(result.fallbackUsed).toBe(true)
      expect(mockGeminiClient.generateEmbedding).toHaveBeenCalledTimes(1)
      expect(mockOpenAIGenerate).toHaveBeenCalledTimes(1)
    })

    // PS-003: Fallback to OpenAI on Gemini error
    it('should fallback to OpenAI when Gemini fails with server error', async () => {
      mockGeminiClient.generateEmbedding.mockRejectedValueOnce(
        new APIError('Service unavailable', 503, 'gemini', true)
      )

      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 10,
        tokens: 10,
      })

      const result = await provider.generateEmbedding(testRequest)

      expect(result.provider).toBe('openai')
      expect(result.fallbackUsed).toBe(true)
    })

    // PS-004: Use only Gemini when configured
    it('should use only Gemini in gemini-only mode', async () => {
      const geminiOnlyProvider = new EmbeddingProvider({
        ...defaultConfig,
        strategy: 'gemini-only',
      })

      mockGeminiClient.generateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'gemini-embedding-001',
        tokenCount: 10,
        provider: 'gemini',
      })

      const result = await geminiOnlyProvider.generateEmbedding(testRequest)

      expect(result.provider).toBe('gemini')
      expect(mockOpenAIGenerate).not.toHaveBeenCalled()
    })

    // PS-005: Fail when Gemini-only fails
    it('should throw error in gemini-only mode when Gemini fails', async () => {
      const geminiOnlyProvider = new EmbeddingProvider({
        ...defaultConfig,
        strategy: 'gemini-only',
        fallbackEnabled: false,
      })

      mockGeminiClient.generateEmbedding.mockRejectedValueOnce(
        new APIError('Service unavailable', 503, 'gemini', false)
      )

      await expect(
        geminiOnlyProvider.generateEmbedding(testRequest)
      ).rejects.toThrow('Service unavailable')

      expect(mockOpenAIGenerate).not.toHaveBeenCalled()
    })

    // PS-006: Use only OpenAI when configured
    it('should use only OpenAI in openai-only mode', async () => {
      const openaiOnlyProvider = new EmbeddingProvider({
        ...defaultConfig,
        strategy: 'openai-only',
      })

      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 10,
        tokens: 10,
      })

      const result = await openaiOnlyProvider.generateEmbedding(testRequest)

      expect(result.provider).toBe('openai')
      expect(mockGeminiClient.generateEmbedding).not.toHaveBeenCalled()
    })

    // PS-007: Auto-fallback for long text (>2048 tokens)
    it('should use OpenAI directly for text >2048 tokens', async () => {
      const longRequest: EmbeddingGenerationRequest = {
        text: 'a'.repeat(10000), // Very long text
        type: 'chunk',
      }

      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 3000,
        tokens: 3000,
      })

      const result = await provider.generateEmbedding(longRequest)

      expect(result.provider).toBe('openai')
      expect(mockGeminiClient.generateEmbedding).not.toHaveBeenCalled()
      expect(mockOpenAIGenerate).toHaveBeenCalledTimes(1)
    })

    // PS-008: Log provider switch
    it('should log fallback event with reason', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      mockGeminiClient.generateEmbedding.mockRejectedValueOnce(
        new RateLimitError('Rate limit exceeded', 60)
      )

      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 10,
        tokens: 10,
      })

      await provider.generateEmbedding(testRequest)

      // Check that fallback was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('fallback'),
        expect.objectContaining({
          reason: expect.any(String),
          provider: 'openai',
        })
      )

      consoleSpy.mockRestore()
    })

    // PS-009: Fail when both providers fail
    it('should throw error when both Gemini and OpenAI fail', async () => {
      mockGeminiClient.generateEmbedding.mockRejectedValueOnce(
        new APIError('Service unavailable', 503, 'gemini', true)
      )

      mockOpenAIGenerate.mockRejectedValueOnce(
        new Error('OpenAI service unavailable')
      )

      await expect(provider.generateEmbedding(testRequest)).rejects.toThrow()
    })

    // PS-010: Respect rate limits before API call
    it('should skip Gemini and use OpenAI when rate limit would be exceeded', async () => {
      // Simulate rate limiter indicating limit would be exceeded
      // This test requires the provider to check rate limiter before calling Gemini

      // Make 15 requests to hit the RPM limit
      for (let i = 0; i < 15; i++) {
        mockGeminiClient.generateEmbedding.mockResolvedValueOnce({
          embedding: mockEmbedding1536,
          model: 'gemini-embedding-001',
          tokenCount: 10,
          provider: 'gemini',
        })
        await provider.generateEmbedding(testRequest)
      }

      // 16th request should skip Gemini due to rate limit
      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 10,
        tokens: 10,
      })

      const result = await provider.generateEmbedding(testRequest)

      // This might still call Gemini once and get rate limited, then fallback
      // OR it should preemptively skip Gemini if rate limiter is checked first
      expect(result.provider).toBe('openai')
    })
  })

  describe('Cost tracking', () => {
    it('should include cost in result', async () => {
      const testRequest: EmbeddingGenerationRequest = {
        text: 'Test',
        type: 'query',
      }

      mockGeminiClient.generateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'gemini-embedding-001',
        tokenCount: 100,
        provider: 'gemini',
      })

      const result = await provider.generateEmbedding(testRequest)

      expect(result.cost).toBeDefined()
      expect(result.cost).toBe(0.0) // Gemini free tier
    })

    it('should track OpenAI cost when falling back', async () => {
      const testRequest: EmbeddingGenerationRequest = {
        text: 'Test',
        type: 'query',
      }

      mockGeminiClient.generateEmbedding.mockRejectedValueOnce(
        new RateLimitError('Rate limit', 60)
      )

      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 100,
        tokens: 100,
      })

      const result = await provider.generateEmbedding(testRequest)

      expect(result.cost).toBeGreaterThan(0) // OpenAI has cost
      expect(result.provider).toBe('openai')
    })
  })

  describe('Latency tracking', () => {
    it('should include latency_ms in result', async () => {
      const testRequest: EmbeddingGenerationRequest = {
        text: 'Test',
        type: 'query',
      }

      mockGeminiClient.generateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'gemini-embedding-001',
        tokenCount: 10,
        provider: 'gemini',
      })

      const result = await provider.generateEmbedding(testRequest)

      expect(result.latency_ms).toBeDefined()
      expect(result.latency_ms).toBeGreaterThan(0)
    })

    it('should include fallback latency when using OpenAI', async () => {
      const testRequest: EmbeddingGenerationRequest = {
        text: 'Test',
        type: 'query',
      }

      mockGeminiClient.generateEmbedding.mockRejectedValueOnce(
        new RateLimitError('Rate limit', 60)
      )

      mockOpenAIGenerate.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'text-embedding-3-small',
        tokenCount: 10,
        tokens: 10,
      })

      const result = await provider.generateEmbedding(testRequest)

      expect(result.latency_ms).toBeGreaterThan(0)
      // Should include time for both Gemini attempt + OpenAI fallback
    })
  })

  describe('Provider selection logic', () => {
    it('should return correct provider selection reason', async () => {
      const testRequest: EmbeddingGenerationRequest = {
        text: 'Test',
        type: 'query',
      }

      mockGeminiClient.generateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding1536,
        model: 'gemini-embedding-001',
        tokenCount: 10,
        provider: 'gemini',
      })

      const result = await provider.generateEmbedding(testRequest)

      // Internal selection result should be 'primary' for Gemini
      expect(result.provider).toBe('gemini')
      expect(result.fallbackUsed).toBe(false)
    })
  })
})
