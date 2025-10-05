/**
 * @jest-environment node
 */

import { semanticSearch, storeSourceEmbedding } from '../search'
import * as generator from '../generator'

// Mock dependencies
jest.mock('../generator')
jest.mock('@/lib/supabase/server')

const mockGenerateEmbedding = generator.generateEmbedding as jest.MockedFunction<typeof generator.generateEmbedding>

describe('SemanticSearch', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('semanticSearch', () => {
    it('should find similar sources', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        tokenCount: 10,
        model: 'text-embedding-3-small'
      })

      const mockResults = [
        {
          source_id: 'source-1',
          chunk_id: 0,
          distance: 0.2,
          content_preview: 'Machine learning content...',
          title: 'ML Paper',
          content_type: 'pdf',
          created_at: new Date().toISOString()
        }
      ]

      // Mock Supabase RPC call
      const mockRpc = jest.fn().mockResolvedValue({
        data: mockResults,
        error: null
      })

      const mockSupabase = {
        rpc: mockRpc
      }

      jest.spyOn(require('@/lib/supabase/server'), 'createRouteHandlerClient')
        .mockResolvedValue(mockSupabase)

      const results = await semanticSearch(mockUserId, 'machine learning algorithms')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0]).toHaveProperty('source_id')
      expect(results[0]).toHaveProperty('similarity')
      expect(results[0].similarity).toBeGreaterThan(0.7) // 1 - 0.2 = 0.8
      expect(mockRpc).toHaveBeenCalledWith('search_sources_by_embedding', expect.any(Object))
    })

    it('should return empty array for no matches', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        tokenCount: 10,
        model: 'text-embedding-3-small'
      })

      const mockRpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      })

      const mockSupabase = {
        rpc: mockRpc
      }

      jest.spyOn(require('@/lib/supabase/server'), 'createRouteHandlerClient')
        .mockResolvedValue(mockSupabase)

      const results = await semanticSearch(mockUserId, 'totally unrelated query xyz123')

      expect(results).toEqual([])
    })

    it('should respect top-k limit', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        tokenCount: 10,
        model: 'text-embedding-3-small'
      })

      const mockRpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      })

      const mockSupabase = {
        rpc: mockRpc
      }

      jest.spyOn(require('@/lib/supabase/server'), 'createRouteHandlerClient')
        .mockResolvedValue(mockSupabase)

      await semanticSearch(mockUserId, 'test', { limit: 3 })

      expect(mockRpc).toHaveBeenCalledWith('search_sources_by_embedding',
        expect.objectContaining({ match_count: 3 })
      )
    })

    it('should filter by similarity threshold', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        tokenCount: 10,
        model: 'text-embedding-3-small'
      })

      const mockRpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      })

      const mockSupabase = {
        rpc: mockRpc
      }

      jest.spyOn(require('@/lib/supabase/server'), 'createRouteHandlerClient')
        .mockResolvedValue(mockSupabase)

      await semanticSearch(mockUserId, 'test', { threshold: 0.8 })

      expect(mockRpc).toHaveBeenCalledWith('search_sources_by_embedding',
        expect.objectContaining({ match_threshold: 0.2 }) // 1 - 0.8
      )
    })

    it('should handle empty query', async () => {
      const results = await semanticSearch(mockUserId, '')
      expect(results).toEqual([])
    })

    it('should handle search errors gracefully', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        tokenCount: 10,
        model: 'text-embedding-3-small'
      })

      const mockRpc = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const mockSupabase = {
        rpc: mockRpc
      }

      jest.spyOn(require('@/lib/supabase/server'), 'createRouteHandlerClient')
        .mockResolvedValue(mockSupabase)

      const results = await semanticSearch(mockUserId, 'test')

      expect(results).toEqual([])
    })
  })

  describe('storeSourceEmbedding', () => {
    it('should store embedding successfully', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        tokenCount: 10,
        model: 'text-embedding-3-small'
      })

      const mockEmbeddingId = 'embedding-123'
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: mockEmbeddingId },
            error: null
          })
        })
      })

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          upsert: mockUpsert
        })
      }

      jest.spyOn(require('@/lib/supabase/server'), 'createRouteHandlerClient')
        .mockResolvedValue(mockSupabase)

      const result = await storeSourceEmbedding('source-123', 'Test content for embedding')

      expect(result).toBe(mockEmbeddingId)
      expect(mockUpsert).toHaveBeenCalled()
    })

    it('should handle storage errors', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        tokenCount: 10,
        model: 'text-embedding-3-small'
      })

      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Storage error')
          })
        })
      })

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          upsert: mockUpsert
        })
      }

      jest.spyOn(require('@/lib/supabase/server'), 'createRouteHandlerClient')
        .mockResolvedValue(mockSupabase)

      const result = await storeSourceEmbedding('source-123', 'Test content')

      expect(result).toBeNull()
    })
  })
})
