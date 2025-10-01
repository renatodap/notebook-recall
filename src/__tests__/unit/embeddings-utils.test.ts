/**
 * Unit Tests: Embedding Utils
 *
 * Tests for vector operations and hybrid search scoring
 */

import { describe, it, expect } from '@jest/globals';
import type { Embedding, HybridSearchWeights } from '@/lib/embeddings/types';

describe('Embedding Utils', () => {
  describe('Vector Operations', () => {
    describe('cosineSimilarity()', () => {
      it('calculates correctly for known vectors', async () => {
        const { cosineSimilarity } = await import('@/lib/embeddings/utils');

        // Identical unit vectors should have similarity 1.0
        const vec1 = [1, 0, 0];
        const vec2 = [1, 0, 0];

        const similarity = cosineSimilarity(vec1, vec2);
        expect(similarity).toBeCloseTo(1.0, 5);
      });

      it('handles identical vectors', async () => {
        const { cosineSimilarity } = await import('@/lib/embeddings/utils');

        const vec = new Array(1536).fill(0).map(() => Math.random());

        const similarity = cosineSimilarity(vec, vec);
        expect(similarity).toBeCloseTo(1.0, 5);
      });

      it('handles orthogonal vectors', async () => {
        const { cosineSimilarity } = await import('@/lib/embeddings/utils');

        // Perpendicular vectors
        const vec1 = [1, 0, 0];
        const vec2 = [0, 1, 0];

        const similarity = cosineSimilarity(vec1, vec2);
        expect(similarity).toBeCloseTo(0.0, 5);
      });

      it('validates dimensions', async () => {
        const { cosineSimilarity } = await import('@/lib/embeddings/utils');

        const vec1536 = new Array(1536).fill(1);
        const vec512 = new Array(512).fill(1);

        expect(() => cosineSimilarity(vec1536, vec512)).toThrow(/dimension/i);
      });

      it('returns value between 0 and 1', async () => {
        const { cosineSimilarity } = await import('@/lib/embeddings/utils');

        // Random vectors
        const vec1 = new Array(100).fill(0).map(() => Math.random() * 2 - 1);
        const vec2 = new Array(100).fill(0).map(() => Math.random() * 2 - 1);

        const similarity = cosineSimilarity(vec1, vec2);

        expect(similarity).toBeGreaterThanOrEqual(0);
        expect(similarity).toBeLessThanOrEqual(1);
      });
    });

    describe('normalizeVector()', () => {
      it('normalizes correctly', async () => {
        const { normalizeVector } = await import('@/lib/embeddings/utils');

        const unnormalized = [3, 4]; // Magnitude 5
        const normalized = normalizeVector(unnormalized);

        // Check magnitude is 1.0
        const magnitude = Math.sqrt(
          normalized.reduce((sum, val) => sum + val * val, 0)
        );
        expect(magnitude).toBeCloseTo(1.0, 5);

        // Check values
        expect(normalized[0]).toBeCloseTo(0.6, 5);
        expect(normalized[1]).toBeCloseTo(0.8, 5);
      });

      it('preserves direction', async () => {
        const { normalizeVector, cosineSimilarity } = await import(
          '@/lib/embeddings/utils'
        );

        const original = [1, 2, 3, 4, 5];
        const normalized = normalizeVector(original);

        // Cosine similarity with original should be 1.0 (same direction)
        const similarity = cosineSimilarity(original, normalized);
        expect(similarity).toBeCloseTo(1.0, 5);
      });

      it('handles zero vector', async () => {
        const { normalizeVector } = await import('@/lib/embeddings/utils');

        const zeroVector = [0, 0, 0];

        expect(() => normalizeVector(zeroVector)).toThrow(/zero/i);
      });

      it('handles already normalized vector', async () => {
        const { normalizeVector } = await import('@/lib/embeddings/utils');

        const alreadyNormalized = [1, 0, 0];
        const result = normalizeVector(alreadyNormalized);

        expect(result).toEqual(alreadyNormalized);
      });
    });

    describe('dotProduct()', () => {
      it('calculates correctly', async () => {
        const { dotProduct } = await import('@/lib/embeddings/utils');

        const vec1 = [1, 2, 3];
        const vec2 = [4, 5, 6];

        const result = dotProduct(vec1, vec2);
        expect(result).toBe(32); // 1*4 + 2*5 + 3*6 = 32
      });

      it('validates dimensions', async () => {
        const { dotProduct } = await import('@/lib/embeddings/utils');

        const vec1 = [1, 2, 3];
        const vec2 = [1, 2];

        expect(() => dotProduct(vec1, vec2)).toThrow(/dimension/i);
      });
    });

    describe('euclideanDistance()', () => {
      it('calculates correctly', async () => {
        const { euclideanDistance } = await import('@/lib/embeddings/utils');

        const vec1 = [0, 0, 0];
        const vec2 = [3, 4, 0];

        const distance = euclideanDistance(vec1, vec2);
        expect(distance).toBe(5); // sqrt(3^2 + 4^2) = 5
      });

      it('returns 0 for identical vectors', async () => {
        const { euclideanDistance } = await import('@/lib/embeddings/utils');

        const vec = [1, 2, 3];

        const distance = euclideanDistance(vec, vec);
        expect(distance).toBe(0);
      });
    });

    describe('validateDimensions()', () => {
      it('validates 1536 dimensions by default', async () => {
        const { validateDimensions } = await import('@/lib/embeddings/utils');

        const vec1536 = new Array(1536).fill(1);
        const vec512 = new Array(512).fill(1);

        expect(validateDimensions(vec1536)).toBe(true);
        expect(() => validateDimensions(vec512)).toThrow(/1536/);
      });

      it('validates custom dimensions', async () => {
        const { validateDimensions } = await import('@/lib/embeddings/utils');

        const vec100 = new Array(100).fill(1);

        expect(validateDimensions(vec100, 100)).toBe(true);
        expect(() => validateDimensions(vec100, 200)).toThrow(/200/);
      });
    });
  });

  describe('Hybrid Search Scoring', () => {
    describe('calculateHybridScore()', () => {
      it('combines scores with weights', async () => {
        const { calculateHybridScore } = await import('@/lib/embeddings/utils');

        const weights: HybridSearchWeights = {
          semantic: 0.7,
          keyword: 0.3,
        };

        const result = calculateHybridScore(0.8, 0.6, weights);

        // 0.7 * 0.8 + 0.3 * 0.6 = 0.56 + 0.18 = 0.74
        expect(result.finalScore).toBeCloseTo(0.74, 5);
        expect(result.semanticScore).toBe(0.8);
        expect(result.keywordScore).toBe(0.6);
        expect(result.weights).toEqual(weights);
      });

      it('handles missing semantic score', async () => {
        const { calculateHybridScore } = await import('@/lib/embeddings/utils');

        const result = calculateHybridScore(null, 0.7);

        expect(result.finalScore).toBe(0.7);
        expect(result.semanticScore).toBeNull();
        expect(result.keywordScore).toBe(0.7);
      });

      it('handles missing keyword score', async () => {
        const { calculateHybridScore } = await import('@/lib/embeddings/utils');

        const result = calculateHybridScore(0.9, null);

        expect(result.finalScore).toBe(0.9);
        expect(result.semanticScore).toBe(0.9);
        expect(result.keywordScore).toBeNull();
      });

      it('returns 0 when both scores missing', async () => {
        const { calculateHybridScore } = await import('@/lib/embeddings/utils');

        const result = calculateHybridScore(null, null);

        expect(result.finalScore).toBe(0);
        expect(result.semanticScore).toBeNull();
        expect(result.keywordScore).toBeNull();
      });

      it('validates weights sum to 1.0', async () => {
        const { calculateHybridScore } = await import('@/lib/embeddings/utils');

        const invalidWeights: HybridSearchWeights = {
          semantic: 0.8,
          keyword: 0.8, // Sum is 1.6
        };

        expect(() => calculateHybridScore(0.8, 0.6, invalidWeights)).toThrow(
          /sum to 1/i
        );
      });

      it('uses default weights when not provided', async () => {
        const { calculateHybridScore } = await import('@/lib/embeddings/utils');

        const result = calculateHybridScore(0.8, 0.6);

        // Default: semantic=0.7, keyword=0.3
        expect(result.weights.semantic).toBe(0.7);
        expect(result.weights.keyword).toBe(0.3);
        expect(result.finalScore).toBeCloseTo(0.74, 5);
      });

      it('returns score between 0 and 1', async () => {
        const { calculateHybridScore } = await import('@/lib/embeddings/utils');

        const result = calculateHybridScore(0.5, 0.5);

        expect(result.finalScore).toBeGreaterThanOrEqual(0);
        expect(result.finalScore).toBeLessThanOrEqual(1);
      });
    });

    describe('getDefaultWeights()', () => {
      it('returns default weights', async () => {
        const { getDefaultWeights } = await import('@/lib/embeddings/utils');

        const weights = getDefaultWeights();

        expect(weights.semantic).toBe(0.7);
        expect(weights.keyword).toBe(0.3);
      });

      it('weights sum to 1.0', async () => {
        const { getDefaultWeights } = await import('@/lib/embeddings/utils');

        const weights = getDefaultWeights();
        const sum = weights.semantic + weights.keyword;

        expect(sum).toBeCloseTo(1.0, 5);
      });
    });

    describe('validateWeights()', () => {
      it('validates correct weights', async () => {
        const { validateWeights } = await import('@/lib/embeddings/utils');

        const validWeights: HybridSearchWeights = {
          semantic: 0.6,
          keyword: 0.4,
        };

        expect(validateWeights(validWeights)).toBe(true);
      });

      it('rejects weights that don\'t sum to 1.0', async () => {
        const { validateWeights } = await import('@/lib/embeddings/utils');

        const invalidWeights: HybridSearchWeights = {
          semantic: 0.5,
          keyword: 0.6,
        };

        expect(() => validateWeights(invalidWeights)).toThrow(/sum to 1/i);
      });

      it('rejects negative weights', async () => {
        const { validateWeights } = await import('@/lib/embeddings/utils');

        const negativeWeights: HybridSearchWeights = {
          semantic: 1.2,
          keyword: -0.2,
        };

        expect(() => validateWeights(negativeWeights)).toThrow(/negative/i);
      });

      it('rejects weights > 1.0', async () => {
        const { validateWeights } = await import('@/lib/embeddings/utils');

        const largeWeights: HybridSearchWeights = {
          semantic: 1.5,
          keyword: -0.5,
        };

        expect(() => validateWeights(largeWeights)).toThrow();
      });
    });
  });
});
