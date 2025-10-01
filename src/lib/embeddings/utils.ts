/**
 * Embedding Utils
 *
 * Vector operations and hybrid search scoring
 */

import type {
  Embedding,
  HybridSearchWeights,
  HybridScore,
} from './types';

const DEFAULT_DIMENSIONS = 1536;
const DEFAULT_WEIGHTS: HybridSearchWeights = {
  semantic: 0.7,
  keyword: 0.3,
};

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: Embedding, vec2: Embedding): number {
  if (vec1.length !== vec2.length) {
    throw new Error(
      `Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`
    );
  }

  const dotProduct = dotProductInternal(vec1, vec2);
  const mag1 = magnitude(vec1);
  const mag2 = magnitude(vec2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  // Clamp to [0, 1] range
  const similarity = dotProduct / (mag1 * mag2);
  return Math.max(0, Math.min(1, (similarity + 1) / 2));
}

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector: Embedding): Embedding {
  const mag = magnitude(vector);

  if (mag === 0) {
    throw new Error('Cannot normalize zero vector');
  }

  return vector.map((val) => val / mag);
}

/**
 * Calculate dot product of two vectors
 */
export function dotProduct(vec1: Embedding, vec2: Embedding): number {
  if (vec1.length !== vec2.length) {
    throw new Error(
      `Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`
    );
  }

  return dotProductInternal(vec1, vec2);
}

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(vec1: Embedding, vec2: Embedding): number {
  if (vec1.length !== vec2.length) {
    throw new Error(
      `Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`
    );
  }

  const sumSquaredDiff = vec1.reduce(
    (sum, val, i) => sum + Math.pow(val - vec2[i], 2),
    0
  );

  return Math.sqrt(sumSquaredDiff);
}

/**
 * Validate vector dimensions
 */
export function validateDimensions(
  vector: Embedding,
  expectedDimensions: number = DEFAULT_DIMENSIONS
): boolean {
  if (vector.length !== expectedDimensions) {
    throw new Error(
      `Expected ${expectedDimensions} dimensions, got ${vector.length}`
    );
  }

  return true;
}

/**
 * Calculate hybrid score from semantic and keyword scores
 */
export function calculateHybridScore(
  semanticScore: number | null,
  keywordScore: number | null,
  weights: HybridSearchWeights = DEFAULT_WEIGHTS
): HybridScore {
  // Validate weights
  validateWeights(weights);

  // Handle missing scores
  if (semanticScore === null && keywordScore === null) {
    return {
      finalScore: 0,
      semanticScore: null,
      keywordScore: null,
      weights,
    };
  }

  if (semanticScore === null) {
    return {
      finalScore: keywordScore!,
      semanticScore: null,
      keywordScore,
      weights,
    };
  }

  if (keywordScore === null) {
    return {
      finalScore: semanticScore,
      semanticScore,
      keywordScore: null,
      weights,
    };
  }

  // Calculate weighted average
  const finalScore =
    weights.semantic * semanticScore + weights.keyword * keywordScore;

  return {
    finalScore,
    semanticScore,
    keywordScore,
    weights,
  };
}

/**
 * Get default hybrid search weights
 */
export function getDefaultWeights(): HybridSearchWeights {
  return { ...DEFAULT_WEIGHTS };
}

/**
 * Validate that weights sum to 1.0 and are valid
 */
export function validateWeights(weights: HybridSearchWeights): boolean {
  // Check for negative weights
  if (weights.semantic < 0 || weights.keyword < 0) {
    throw new Error('Weights cannot be negative');
  }

  // Check for weights > 1.0
  if (weights.semantic > 1 || weights.keyword > 1) {
    throw new Error('Individual weights cannot exceed 1.0');
  }

  // Check sum
  const sum = weights.semantic + weights.keyword;
  const tolerance = 0.0001;

  if (Math.abs(sum - 1.0) > tolerance) {
    throw new Error(
      `Weights must sum to 1.0, got ${sum.toFixed(4)} (semantic: ${weights.semantic}, keyword: ${weights.keyword})`
    );
  }

  return true;
}

/**
 * Internal: Calculate dot product (no validation)
 */
function dotProductInternal(vec1: Embedding, vec2: Embedding): number {
  return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
}

/**
 * Internal: Calculate vector magnitude
 */
function magnitude(vector: Embedding): number {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}
