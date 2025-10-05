/**
 * @jest-environment node
 */

import { generateEmbedding, generateEmbeddingsBatch } from '../generator'

// Mock fetch for testing
global.fetch = jest.fn()

describe('EmbeddingGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: mockEmbedding }],
          usage: { total_tokens: 10 }
        })
      })

      const result = await generateEmbedding('test content')

      expect(result.embedding).toHaveLength(1536)
      expect(result.embedding).toEqual(mockEmbedding)
      expect(result.tokenCount).toBe(10)
      expect(result.model).toBe('text-embedding-3-small')
    })

    it('should handle empty text', async () => {
      await expect(generateEmbedding('')).rejects.toThrow('Text cannot be empty')
    })

    it('should handle very long text (>8000 tokens)', async () => {
      const longText = 'word '.repeat(10000)
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: mockEmbedding }],
          usage: { total_tokens: 8191 }
        })
      })

      const result = await generateEmbedding(longText)

      expect(result.embedding).toHaveLength(1536)
      expect(fetch).toHaveBeenCalledTimes(1)

      // Check that text was truncated
      const callArgs = (fetch as jest.Mock).mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.input.length).toBeLessThanOrEqual(8191 * 4)
    })

    it('should throw error if API key not configured', async () => {
      delete process.env.OPENAI_API_KEY

      await expect(generateEmbedding('test')).rejects.toThrow('OPENAI_API_KEY not configured')
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({
          error: { message: 'Invalid input' }
        })
      })

      await expect(generateEmbedding('test')).rejects.toThrow('OpenAI API error: Invalid input')
    })
  })

  describe('generateEmbeddingsBatch', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = ['text1', 'text2', 'text3']
      const mockEmbeddings = texts.map(() =>
        new Array(1536).fill(0).map(() => Math.random())
      )

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockEmbeddings.map(embedding => ({ embedding })),
          usage: { total_tokens: 30 }
        })
      })

      const results = await generateEmbeddingsBatch(texts)

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.embedding).toHaveLength(1536)
        expect(result.model).toBe('text-embedding-3-small')
      })
    })

    it('should handle empty array', async () => {
      const results = await generateEmbeddingsBatch([])
      expect(results).toEqual([])
    })

    it('should batch large arrays (>100 items)', async () => {
      const texts = new Array(250).fill('test')
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: Array(100).fill({ embedding: mockEmbedding }),
          usage: { total_tokens: 1000 }
        })
      })

      const results = await generateEmbeddingsBatch(texts)

      // Should make 3 calls (100 + 100 + 50)
      expect(fetch).toHaveBeenCalledTimes(3)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should continue on batch failure', async () => {
      const texts = Array(150).fill('test')
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: Array(100).fill({ embedding: mockEmbedding }),
            usage: { total_tokens: 1000 }
          })
        })
        .mockRejectedValueOnce(new Error('Network error'))

      const results = await generateEmbeddingsBatch(texts)

      // Should still return results from successful batch
      expect(results.length).toBeGreaterThan(0)
    })
  })
})
