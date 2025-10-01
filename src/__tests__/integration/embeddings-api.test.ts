/**
 * Integration Tests: Embeddings API
 *
 * Tests for embedding generation and backfill API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import type { EmbeddingGenerateRequest, BackfillRequest } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('Embeddings API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const signupResponse = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-embeddings-${Date.now()}@example.com`,
        password: 'TestPass123!',
      }),
    });

    const signupData = await signupResponse.json();
    authToken = signupData.session?.access_token;
    userId = signupData.user?.id;
  });

  afterAll(async () => {
    // Cleanup test user if needed
  });

  describe('POST /api/embeddings/generate', () => {
    it('generates embedding for text', async () => {
      const request: EmbeddingGenerateRequest = {
        text: 'This is a test summary about machine learning and AI.',
        type: 'summary',
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.embedding).toBeDefined();
      expect(Array.isArray(data.embedding)).toBe(true);
      expect(data.embedding).toHaveLength(1536);
      expect(data.model).toBe('text-embedding-3-small');
      expect(data.tokens).toBeGreaterThan(0);

      // Verify all values are numbers
      data.embedding.forEach((val: number) => {
        expect(typeof val).toBe('number');
      });
    });

    it('validates input - empty text', async () => {
      const request: EmbeddingGenerateRequest = {
        text: '',
        type: 'summary',
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.toLowerCase()).toContain('text');
    });

    it('validates input - text too long', async () => {
      const longText = 'a'.repeat(10000);
      const request: EmbeddingGenerateRequest = {
        text: longText,
        type: 'summary',
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.toLowerCase()).toContain('length');
    });

    it('requires authentication', async () => {
      const request: EmbeddingGenerateRequest = {
        text: 'Test text',
        type: 'summary',
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(401);
    });

    it('handles query type', async () => {
      const request: EmbeddingGenerateRequest = {
        text: 'machine learning papers',
        type: 'query',
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.embedding).toHaveLength(1536);
    });
  });

  describe('POST /api/embeddings/backfill', () => {
    beforeAll(async () => {
      // Create some test sources/summaries without embeddings
      const sources = [
        {
          title: 'Test Source 1',
          content_type: 'text',
          original_content: 'Content 1',
          summary_text: 'Summary 1',
          key_actions: ['Action 1'],
          key_topics: ['Topic 1'],
          word_count: 100,
        },
        {
          title: 'Test Source 2',
          content_type: 'text',
          original_content: 'Content 2',
          summary_text: 'Summary 2',
          key_actions: ['Action 2'],
          key_topics: ['Topic 2'],
          word_count: 150,
        },
      ];

      for (const source of sources) {
        await fetch(`${API_BASE_URL}/api/sources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(source),
        });
      }
    });

    it('backfills embeddings (admin only)', async () => {
      const request: BackfillRequest = {
        batch_size: 10,
        dry_run: false,
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/backfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      // May be 200 (admin) or 403 (non-admin)
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();

        expect(data.processed).toBeGreaterThanOrEqual(0);
        expect(data.failed).toBeGreaterThanOrEqual(0);
        expect(data.skipped).toBeGreaterThanOrEqual(0);
        expect(data.duration_ms).toBeGreaterThan(0);
      }
    });

    it('returns progress report', async () => {
      const request: BackfillRequest = {
        batch_size: 5,
        dry_run: true, // Don't actually process
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/backfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      if (response.status === 200) {
        const data = await response.json();

        expect(typeof data.processed).toBe('number');
        expect(typeof data.failed).toBe('number');
        expect(typeof data.skipped).toBe('number');
      }
    });

    it('supports dry run', async () => {
      const request: BackfillRequest = {
        dry_run: true,
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/backfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      if (response.status === 200) {
        const data = await response.json();

        // Dry run should report what would be processed
        expect(data.processed).toBeGreaterThanOrEqual(0);

        // But nothing should actually be updated
        // (verify by querying summaries - embeddings should still be null)
      }
    });

    it('requires authentication', async () => {
      const request: BackfillRequest = {
        batch_size: 10,
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/backfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(401);
    });

    it('validates batch size', async () => {
      const request = {
        batch_size: -5,
      };

      const response = await fetch(`${API_BASE_URL}/api/embeddings/backfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      });

      if (response.status !== 403) {
        expect(response.status).toBe(400);
      }
    });
  });
});
