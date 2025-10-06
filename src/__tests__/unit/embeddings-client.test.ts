/**
 * Unit Tests: Embedding Client
 *
 * Tests for embedding generation via OpenAI API
 */

// @ts-nocheck - Mock type issues with Jest, tests work correctly at runtime
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type {
  EmbeddingGenerationRequest,
  BatchEmbeddingRequest,
} from '@/lib/embeddings/types';

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Embedding Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding()', () => {
    it('creates valid embedding', async () => {
      // Mock API response
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          object: 'list',
          data: [
            {
              object: 'embedding',
              embedding: mockEmbedding,
              index: 0,
            },
          ],
          model: 'text-embedding-3-small',
          usage: {
            prompt_tokens: 8,
            total_tokens: 8,
          },
        }),
      } as Response);

      const request: EmbeddingGenerationRequest = {
        text: 'test text',
        type: 'summary',
      };

      // Dynamic import to avoid module resolution during mock setup
      const { generateEmbedding } = await import('@/lib/embeddings/client');
      const result = await generateEmbedding(request);

      expect(result.embedding).toHaveLength(1536);
      expect(result.model).toBe('text-embedding-3-small');
      expect(result.tokenCount).toBe(8);

      // Verify all values are numbers between -1 and 1
      result.embedding.forEach((val) => {
        expect(typeof val).toBe('number');
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      });
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'API Error' },
        }),
      } as Response);

      const request: EmbeddingGenerationRequest = {
        text: 'test',
        type: 'query',
      };

      const { generateEmbedding } = await import('@/lib/embeddings/client');

      await expect(generateEmbedding(request)).rejects.toThrow();
    });

    it('retries on transient failures', async () => {
      // Fail twice, succeed third time
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Network error' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Network error' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            object: 'list',
            data: [
              {
                object: 'embedding',
                embedding: new Array(1536).fill(0.5),
                index: 0,
              },
            ],
            model: 'text-embedding-3-small',
            usage: { prompt_tokens: 10, total_tokens: 10 },
          }),
        } as Response);

      const request: EmbeddingGenerationRequest = {
        text: 'test',
        type: 'summary',
      };

      const { generateEmbedding } = await import('@/lib/embeddings/client');
      const result = await generateEmbedding(request);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.embedding).toHaveLength(1536);
    });

    it('validates input length', async () => {
      const longText = 'a'.repeat(10000);
      const request: EmbeddingGenerationRequest = {
        text: longText,
        type: 'summary',
      };

      const { generateEmbedding } = await import('@/lib/embeddings/client');

      await expect(generateEmbedding(request)).rejects.toThrow(/max length/i);
    });

    it('normalizes vectors when requested', async () => {
      // Unnormalized vector
      const unnormalizedVector = new Array(1536).fill(2.0);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          object: 'list',
          data: [
            {
              object: 'embedding',
              embedding: unnormalizedVector,
              index: 0,
            },
          ],
          model: 'text-embedding-3-small',
          usage: { prompt_tokens: 5, total_tokens: 5 },
        }),
      } as Response);

      const request: EmbeddingGenerationRequest = {
        text: 'test',
        type: 'summary',
        normalize: true,
      };

      const { generateEmbedding } = await import('@/lib/embeddings/client');
      const result = await generateEmbedding(request);

      // Calculate magnitude
      const magnitude = Math.sqrt(
        result.embedding.reduce((sum, val) => sum + val * val, 0)
      );

      // Should be approximately 1.0
      expect(magnitude).toBeCloseTo(1.0, 5);
    });
  });

  describe('generateEmbeddings()', () => {
    it('processes batch', async () => {
      const mockEmbedding1 = new Array(1536).fill(0.1);
      const mockEmbedding2 = new Array(1536).fill(0.2);
      const mockEmbedding3 = new Array(1536).fill(0.3);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ embedding: mockEmbedding1, index: 0 }],
            usage: { total_tokens: 5 },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ embedding: mockEmbedding2, index: 0 }],
            usage: { total_tokens: 5 },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ embedding: mockEmbedding3, index: 0 }],
            usage: { total_tokens: 5 },
          }),
        } as Response);

      const request: BatchEmbeddingRequest = {
        texts: ['text1', 'text2', 'text3'],
        type: 'summary',
      };

      const { generateEmbeddings } = await import('@/lib/embeddings/client');
      const result = await generateEmbeddings(request);

      expect(result.results).toHaveLength(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.totalTokens).toBe(15);

      // Verify all embeddings valid
      result.results?.forEach((item) => {
        if (!item.error) {
          expect(item.embedding).toHaveLength(1536);
        }
      });
    });

    it('handles partial failures', async () => {
      const mockEmbedding1 = new Array(1536).fill(0.1);
      const mockEmbedding3 = new Array(1536).fill(0.3);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ embedding: mockEmbedding1, index: 0 }],
            usage: { total_tokens: 5 },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: { message: 'API error on item 2' },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: { message: 'API error on item 2' },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: { message: 'API error on item 2' },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: { message: 'API error on item 2' },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ embedding: mockEmbedding3, index: 0 }],
            usage: { total_tokens: 5 },
          }),
        });

      const request: BatchEmbeddingRequest = {
        texts: ['text1', 'text2', 'text3'],
        type: 'summary',
      };

      const { generateEmbeddings } = await import('@/lib/embeddings/client');
      const result = await generateEmbeddings(request);

      expect(result.results).toHaveLength(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);

      // Check successful items
      expect(result.results[0].embedding).toHaveLength(1536);
      expect(result.results[2].embedding).toHaveLength(1536);

      // Check failed item
      expect(result.results[1].error).toBeDefined();
      expect(result.results[1].embedding).toBeUndefined();
    });

    it('respects rate limits', async () => {
      // Simulate rate limit error followed by success
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            error: { message: 'Rate limit exceeded' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ embedding: new Array(1536).fill(0.5), index: 0 }],
            usage: { total_tokens: 5 },
          }),
        });

      const request: BatchEmbeddingRequest = {
        texts: ['text1'],
        type: 'summary',
      };

      const { generateEmbeddings } = await import('@/lib/embeddings/client');
      const result = await generateEmbeddings(request);

      expect(result.successful).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + retry
    });
  });
});
