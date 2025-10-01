/**
 * Test Helpers: Embeddings
 *
 * Utility functions for embedding tests
 */

import { expect } from '@jest/globals';
import type { Embedding } from '@/lib/embeddings/types';
import type { Source, Summary, SearchResult } from '@/types';

/**
 * Create a test source with optional embedding
 */
export async function createSourceWithEmbedding(
  authToken: string,
  data: {
    title: string;
    content: string;
    topics?: string[];
  }
): Promise<{ source: Source; summary: Summary }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const response = await fetch(`${API_BASE_URL}/api/sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      title: data.title,
      content_type: 'text',
      original_content: data.content,
      summary_text: data.content.substring(0, 100),
      key_actions: ['Test action'],
      key_topics: data.topics || ['test'],
      word_count: data.content.split(' ').length,
    }),
  });

  const result = await response.json();
  return { source: result.source, summary: result.summary };
}

/**
 * Generate a test embedding with optional seed for reproducibility
 */
export function generateTestEmbedding(seed: number = Math.random()): Embedding {
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  return new Array(1536).fill(0).map((_, i) => seededRandom(seed + i) * 2 - 1);
}

/**
 * Assert that two embeddings are similar within threshold
 */
export function expectSimilarEmbeddings(
  emb1: Embedding,
  emb2: Embedding,
  threshold: number = 0.9
): void {
  expect(emb1).toHaveLength(1536);
  expect(emb2).toHaveLength(1536);

  // Calculate cosine similarity
  const dotProduct = emb1.reduce((sum, val, i) => sum + val * emb2[i], 0);
  const mag1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));

  const cosineSimilarity = dotProduct / (mag1 * mag2);

  expect(cosineSimilarity).toBeGreaterThanOrEqual(threshold);
}

/**
 * Assert that embeddings are different (similarity below threshold)
 */
export function expectDifferentEmbeddings(
  emb1: Embedding,
  emb2: Embedding,
  threshold: number = 0.3
): void {
  expect(emb1).toHaveLength(1536);
  expect(emb2).toHaveLength(1536);

  const dotProduct = emb1.reduce((sum, val, i) => sum + val * emb2[i], 0);
  const mag1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));

  const cosineSimilarity = dotProduct / (mag1 * mag2);

  expect(cosineSimilarity).toBeLessThan(threshold);
}

/**
 * Assert that search results are ordered by relevance score (descending)
 */
export function expectOrderedByRelevance(results: SearchResult[]): void {
  for (let i = 0; i < results.length - 1; i++) {
    expect(results[i].relevance_score).toBeGreaterThanOrEqual(
      results[i + 1].relevance_score
    );
  }
}

/**
 * Assert that all search results meet minimum relevance threshold
 */
export function expectAllAboveThreshold(
  results: SearchResult[],
  threshold: number
): void {
  results.forEach((result) => {
    expect(result.relevance_score).toBeGreaterThanOrEqual(threshold);
  });
}

/**
 * Assert that embedding is normalized (magnitude ≈ 1.0)
 */
export function expectNormalizedEmbedding(
  embedding: Embedding,
  tolerance: number = 0.01
): void {
  expect(embedding).toHaveLength(1536);

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );

  expect(Math.abs(magnitude - 1.0)).toBeLessThan(tolerance);
}

/**
 * Assert that all values in embedding are valid numbers
 */
export function expectValidEmbedding(embedding: Embedding): void {
  expect(embedding).toHaveLength(1536);

  embedding.forEach((val) => {
    expect(typeof val).toBe('number');
    expect(Number.isFinite(val)).toBe(true);
    expect(Number.isNaN(val)).toBe(false);
  });
}

/**
 * Calculate cosine similarity between two embeddings (for testing)
 */
export function calculateCosineSimilarity(
  vec1: Embedding,
  vec2: Embedding
): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same dimensions');
  }

  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (mag1 * mag2);
}

/**
 * Wait for async operations (e.g., embedding generation)
 */
export async function waitForEmbedding(
  timeout: number = 5000,
  interval: number = 500
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.min(timeout, 2000));
  });
}

/**
 * Mock Supabase vector search response
 */
export function mockVectorSearchResponse(
  summaries: Array<{ id: string; similarity: number }>
) {
  return {
    data: summaries.map((s) => ({
      summary_id: s.id,
      similarity: s.similarity,
    })),
    error: null,
  };
}

/**
 * Create test auth token (for tests that don't require real auth)
 */
export function createMockAuthToken(userId: string = 'test-user-id'): string {
  // In real tests, this would come from actual signup/login
  return `mock-token-${userId}-${Date.now()}`;
}

/**
 * Assert that backfill result is valid
 */
export function expectValidBackfillResult(result: {
  processed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
}): void {
  expect(result.processed).toBeGreaterThanOrEqual(0);
  expect(result.failed).toBeGreaterThanOrEqual(0);
  expect(result.skipped).toBeGreaterThanOrEqual(0);
  expect(result.duration_ms).toBeGreaterThan(0);

  expect(typeof result.processed).toBe('number');
  expect(typeof result.failed).toBe('number');
  expect(typeof result.skipped).toBe('number');
  expect(typeof result.duration_ms).toBe('number');
}
