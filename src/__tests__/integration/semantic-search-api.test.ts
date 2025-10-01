/**
 * Integration Tests: Semantic Search API
 *
 * Tests for enhanced search endpoint with semantic capabilities
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import type { SearchRequest, CreateSourceRequest } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('Semantic Search API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  const testSourceIds: string[] = [];

  beforeAll(async () => {
    // Create test user
    const signupResponse = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-search-${Date.now()}@example.com`,
        password: 'TestPass123!',
      }),
    });

    const signupData = await signupResponse.json();
    authToken = signupData.session?.access_token;
    userId = signupData.user?.id;

    // Create test sources with specific content for semantic search
    const sources: CreateSourceRequest[] = [
      {
        title: 'AI Safety Research',
        content_type: 'text',
        original_content:
          'This paper discusses AI alignment and safety concerns in machine learning systems.',
        summary_text:
          'Research on AI alignment and safety in ML systems.',
        key_actions: ['Review safety protocols'],
        key_topics: ['AI safety', 'alignment', 'machine learning'],
        word_count: 150,
      },
      {
        title: 'Machine Learning Ethics',
        content_type: 'text',
        original_content:
          'Ethical considerations in developing artificial intelligence and ML models.',
        summary_text: 'Ethics guide for AI and ML development.',
        key_actions: ['Implement ethical guidelines'],
        key_topics: ['ethics', 'AI', 'machine learning'],
        word_count: 120,
      },
      {
        title: 'Cooking Recipes',
        content_type: 'text',
        original_content: 'A collection of delicious pasta recipes.',
        summary_text: 'Pasta cooking guide with various recipes.',
        key_actions: ['Try carbonara recipe'],
        key_topics: ['cooking', 'recipes', 'pasta'],
        word_count: 80,
      },
    ];

    for (const source of sources) {
      const response = await fetch(`${API_BASE_URL}/api/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(source),
      });

      const data = await response.json();
      testSourceIds.push(data.source.id);
    }

    // Wait a bit for embeddings to be generated
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup test sources
    for (const sourceId of testSourceIds) {
      await fetch(`${API_BASE_URL}/api/sources/${sourceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }
  });

  describe('POST /api/search (Enhanced)', () => {
    describe('Semantic Search Mode', () => {
      it('finds similar content semantically', async () => {
        const request: SearchRequest = {
          query: 'artificial intelligence alignment',
          mode: 'semantic',
          limit: 20,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data.results).toBeDefined();
        expect(Array.isArray(data.results)).toBe(true);
        expect(data.search_mode).toBe('semantic');

        // Should find AI safety sources with high relevance
        const aiSafetyResult = data.results.find(
          (r: { source: { title: string } }) =>
            r.source.title === 'AI Safety Research'
        );

        if (aiSafetyResult) {
          expect(aiSafetyResult.relevance_score).toBeGreaterThan(0.7);
          expect(aiSafetyResult.match_type).toBe('semantic');
        }
      });

      it('does not return unrelated content', async () => {
        const request: SearchRequest = {
          query: 'artificial intelligence safety',
          mode: 'semantic',
          limit: 20,
          threshold: 0.7,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        const data = await response.json();

        // Cooking recipes should NOT appear in results
        const cookingResult = data.results.find(
          (r: { source: { title: string } }) =>
            r.source.title === 'Cooking Recipes'
        );

        expect(cookingResult).toBeUndefined();
      });

      it('respects similarity threshold', async () => {
        const request: SearchRequest = {
          query: 'machine learning',
          mode: 'semantic',
          threshold: 0.8,
          limit: 20,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        const data = await response.json();

        // All results should have relevance score > 0.8
        data.results.forEach((result: { relevance_score: number }) => {
          expect(result.relevance_score).toBeGreaterThan(0.8);
        });
      });
    });

    describe('Keyword Search Mode', () => {
      it('finds exact keyword matches', async () => {
        const request: SearchRequest = {
          query: 'pasta',
          mode: 'keyword',
          limit: 20,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data.search_mode).toBe('keyword');

        // Should find cooking recipes
        const cookingResult = data.results.find(
          (r: { source: { title: string } }) =>
            r.source.title === 'Cooking Recipes'
        );

        expect(cookingResult).toBeDefined();
        expect(cookingResult.match_type).toBe('keyword');
      });
    });

    describe('Hybrid Search Mode', () => {
      it('combines semantic and keyword results', async () => {
        const request: SearchRequest = {
          query: 'machine learning ethics',
          mode: 'hybrid',
          limit: 20,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data.search_mode).toBe('hybrid');
        expect(data.results.length).toBeGreaterThan(0);

        // Should include both semantic and keyword matches
        const hasSemanticMatch = data.results.some(
          (r: { match_type: string }) =>
            r.match_type === 'semantic' || r.match_type === 'hybrid'
        );

        expect(hasSemanticMatch).toBe(true);
      });

      it('ranks results correctly', async () => {
        const request: SearchRequest = {
          query: 'AI safety',
          mode: 'hybrid',
          limit: 20,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        const data = await response.json();

        // Results should be ordered by relevance_score (descending)
        for (let i = 0; i < data.results.length - 1; i++) {
          expect(data.results[i].relevance_score).toBeGreaterThanOrEqual(
            data.results[i + 1].relevance_score
          );
        }
      });
    });

    describe('Fallback Behavior', () => {
      it('falls back to keyword when no embeddings', async () => {
        // Create source without embedding (if possible)
        const sourceWithoutEmbedding: CreateSourceRequest = {
          title: 'No Embedding Test',
          content_type: 'text',
          original_content: 'Test content without embedding',
          summary_text: 'Test summary',
          key_actions: [],
          key_topics: ['test'],
          word_count: 50,
        };

        await fetch(`${API_BASE_URL}/api/sources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(sourceWithoutEmbedding),
        });

        const request: SearchRequest = {
          query: 'test',
          mode: 'semantic',
          limit: 20,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        expect(response.status).toBe(200);

        // Should still return results (via keyword fallback)
        const data = await response.json();
        expect(data.results).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('handles empty results', async () => {
        const request: SearchRequest = {
          query: 'xyzabc123nonexistent',
          mode: 'semantic',
          limit: 20,
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.results).toEqual([]);
        expect(data.total).toBe(0);
      });

      it('validates limit parameter', async () => {
        const request = {
          query: 'test',
          mode: 'semantic',
          limit: 1000, // Too large
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(request),
        });

        expect(response.status).toBe(400);
      });

      it('requires authentication', async () => {
        const request: SearchRequest = {
          query: 'test',
          mode: 'semantic',
        };

        const response = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        expect(response.status).toBe(401);
      });
    });
  });
});
