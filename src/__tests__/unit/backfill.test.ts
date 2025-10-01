/**
 * Unit Tests: Backfill Service
 *
 * Tests for batch embedding generation for existing summaries
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { BackfillConfig } from '@/lib/embeddings/types';

// Mock Supabase client
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIsNull = jest.fn();
const mockLimit = jest.fn();
const mockUpdate = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock embedding client
const mockGenerateEmbedding = jest.fn();
jest.mock('@/lib/embeddings/client', () => ({
  generateEmbedding: mockGenerateEmbedding,
}));

describe('Backfill Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq, isNull: mockIsNull });
    mockEq.mockReturnValue({ limit: mockLimit });
    mockIsNull.mockReturnValue({ eq: mockEq, limit: mockLimit });
    mockLimit.mockReturnValue({ data: [], error: null });
  });

  describe('backfillEmbeddings()', () => {
    it('processes all summaries without embeddings', async () => {
      const mockSummaries = [
        { id: '1', summary_text: 'Summary 1', key_topics: ['topic1'] },
        { id: '2', summary_text: 'Summary 2', key_topics: ['topic2'] },
        { id: '3', summary_text: 'Summary 3', key_topics: ['topic3'] },
      ];

      // Mock database responses
      mockLimit.mockResolvedValueOnce({
        data: mockSummaries,
        error: null,
      });

      // Mock update chain
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: {}, error: null });

      // Mock embedding generation
      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(1536).fill(0.5),
        model: 'text-embedding-3-small',
        tokens: 10,
        dimensions: 1536,
      });

      const { backfillEmbeddings } = await import('@/lib/embeddings/backfill');
      const result = await backfillEmbeddings();

      expect(result.processed).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(mockGenerateEmbedding).toHaveBeenCalledTimes(3);
    });

    it('skips summaries with existing embeddings', async () => {
      const mockSummaries = [
        { id: '1', summary_text: 'Summary 1', key_topics: [] },
        { id: '2', summary_text: 'Summary 2', key_topics: [] },
      ];

      mockLimit.mockResolvedValueOnce({
        data: mockSummaries,
        error: null,
      });

      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(1536).fill(0.5),
        model: 'text-embedding-3-small',
        tokens: 10,
        dimensions: 1536,
      });

      const { backfillEmbeddings } = await import('@/lib/embeddings/backfill');
      const config: BackfillConfig = {
        skipExisting: true,
      };

      await backfillEmbeddings(config);

      // Should only query summaries where embedding IS NULL
      expect(mockIsNull).toHaveBeenCalledWith('embedding');
    });

    it('handles failures gracefully', async () => {
      const mockSummaries = [
        { id: '1', summary_text: 'Summary 1', key_topics: [] },
        { id: '2', summary_text: 'Summary 2', key_topics: [] },
        { id: '3', summary_text: 'Summary 3', key_topics: [] },
      ];

      mockLimit.mockResolvedValueOnce({
        data: mockSummaries,
        error: null,
      });

      // Fail on second summary
      mockGenerateEmbedding
        .mockResolvedValueOnce({
          embedding: new Array(1536).fill(0.5),
          model: 'test',
          tokens: 10,
          dimensions: 1536,
        })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          embedding: new Array(1536).fill(0.5),
          model: 'test',
          tokens: 10,
          dimensions: 1536,
        });

      const { backfillEmbeddings } = await import('@/lib/embeddings/backfill');
      const result = await backfillEmbeddings();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].summary_id).toBe('2');
      expect(result.failures[0].error).toContain('API error');
    });

    it('respects batch size', async () => {
      const mockSummaries = new Array(25).fill(0).map((_, i) => ({
        id: `${i + 1}`,
        summary_text: `Summary ${i + 1}`,
        key_topics: [],
      }));

      // Return 10 at a time
      mockLimit
        .mockResolvedValueOnce({
          data: mockSummaries.slice(0, 10),
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockSummaries.slice(10, 20),
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockSummaries.slice(20, 25),
          error: null,
        })
        .mockResolvedValue({ data: [], error: null });

      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(1536).fill(0.5),
        model: 'test',
        tokens: 10,
        dimensions: 1536,
      });

      const { backfillEmbeddings } = await import('@/lib/embeddings/backfill');
      const config: BackfillConfig = {
        batch_size: 10,
      };

      const result = await backfillEmbeddings(config);

      expect(result.processed).toBe(25);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('supports dry run', async () => {
      const mockSummaries = [
        { id: '1', summary_text: 'Summary 1', key_topics: [] },
        { id: '2', summary_text: 'Summary 2', key_topics: [] },
      ];

      mockLimit.mockResolvedValueOnce({
        data: mockSummaries,
        error: null,
      });

      const { backfillEmbeddings } = await import('@/lib/embeddings/backfill');
      const config: BackfillConfig = {
        dry_run: true,
      };

      const result = await backfillEmbeddings(config);

      // Should report what would be processed
      expect(result.processed).toBe(2);

      // Should NOT call embedding generation
      expect(mockGenerateEmbedding).not.toHaveBeenCalled();

      // Should NOT update database
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('retries on transient failures', async () => {
      const mockSummaries = [
        { id: '1', summary_text: 'Summary 1', key_topics: [] },
      ];

      mockLimit.mockResolvedValueOnce({
        data: mockSummaries,
        error: null,
      });

      // Fail twice, then succeed
      mockGenerateEmbedding
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          embedding: new Array(1536).fill(0.5),
          model: 'test',
          tokens: 10,
          dimensions: 1536,
        });

      const { backfillEmbeddings } = await import('@/lib/embeddings/backfill');
      const config: BackfillConfig = {
        maxRetries: 3,
      };

      const result = await backfillEmbeddings(config);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockGenerateEmbedding).toHaveBeenCalledTimes(3);
    });

    it('reports duration', async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { backfillEmbeddings } = await import('@/lib/embeddings/backfill');
      const result = await backfillEmbeddings();

      expect(result.duration_ms).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration_ms).toBe('number');
    });
  });

  describe('getPendingCount()', () => {
    it('returns count of summaries without embeddings', async () => {
      mockIsNull.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ count: jest.fn().mockResolvedValue({ count: 42, error: null }) });

      const { getPendingCount } = await import('@/lib/embeddings/backfill');
      const count = await getPendingCount();

      expect(count).toBe(42);
      expect(mockIsNull).toHaveBeenCalledWith('embedding');
    });
  });

  describe('getCompletedCount()', () => {
    it('returns count of summaries with embeddings', async () => {
      mockSelect.mockReturnValue({
        not: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({ count: 158, error: null }),
          }),
        }),
      });

      const { getCompletedCount } = await import('@/lib/embeddings/backfill');
      const count = await getCompletedCount();

      expect(count).toBe(158);
    });
  });

  describe('processBatch()', () => {
    it('processes specified batch size', async () => {
      const mockSummaries = new Array(5).fill(0).map((_, i) => ({
        id: `${i + 1}`,
        summary_text: `Summary ${i + 1}`,
        key_topics: [],
      }));

      mockLimit.mockResolvedValueOnce({
        data: mockSummaries,
        error: null,
      });

      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(1536).fill(0.5),
        model: 'test',
        tokens: 10,
        dimensions: 1536,
      });

      const { processBatch } = await import('@/lib/embeddings/backfill');
      const processed = await processBatch(5);

      expect(processed).toBe(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('returns 0 when no summaries to process', async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { processBatch } = await import('@/lib/embeddings/backfill');
      const processed = await processBatch(10);

      expect(processed).toBe(0);
    });
  });
});
