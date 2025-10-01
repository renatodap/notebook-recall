/**
 * Test Fixtures: Embeddings
 *
 * Mock data and fixtures for embedding tests
 */

import type { Embedding } from '@/lib/embeddings/types';
import type { SearchResult } from '@/types';

/**
 * Generate a random 1536-dimensional embedding
 */
export const mockEmbedding1536 = (): Embedding =>
  new Array(1536).fill(0).map(() => Math.random() * 2 - 1);

/**
 * Generate a deterministic embedding from a seed
 */
export const mockEmbeddingFromSeed = (seed: number): Embedding => {
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  return new Array(1536).fill(0).map((_, i) => seededRandom(seed + i) * 2 - 1);
};

/**
 * Mock embeddings with known similarity relationships
 */
export const mockSimilarEmbeddings = {
  query: mockEmbeddingFromSeed(42),
  highMatch: mockEmbeddingFromSeed(43), // Very similar
  mediumMatch: mockEmbeddingFromSeed(100), // Somewhat similar
  lowMatch: mockEmbeddingFromSeed(500), // Not similar
};

/**
 * Create two embeddings with specific cosine similarity
 */
export const createEmbeddingsWithSimilarity = (
  targetSimilarity: number
): [Embedding, Embedding] => {
  const vec1 = new Array(1536).fill(1 / Math.sqrt(1536)); // Normalized unit vector

  // Create vec2 as a mix of vec1 and a perpendicular vector
  const perpendicular = new Array(1536).fill(0).map(() => Math.random() - 0.5);

  const vec2 = vec1.map(
    (v1, i) => targetSimilarity * v1 + (1 - targetSimilarity) * perpendicular[i]
  );

  // Normalize vec2
  const magnitude = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  const normalizedVec2 = vec2.map((val) => val / magnitude);

  return [vec1, normalizedVec2];
};

/**
 * Mock Anthropic API embedding response
 */
export const mockAnthropicEmbeddingResponse = (
  embedding: Embedding = mockEmbedding1536()
) => ({
  object: 'embedding',
  data: [
    {
      object: 'embedding',
      embedding,
      index: 0,
    },
  ],
  model: 'text-embedding-3-small',
  usage: {
    prompt_tokens: 8,
    total_tokens: 8,
  },
});

/**
 * Mock search results with embeddings
 */
export const mockSearchResults: SearchResult[] = [
  {
    source: {
      id: '1',
      user_id: 'user-1',
      title: 'AI Safety Research',
      content_type: 'text',
      original_content: 'Research on AI alignment and safety...',
      url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    summary: {
      id: 'summary-1',
      source_id: '1',
      summary_text: 'Overview of AI safety research...',
      key_actions: ['Review safety protocols'],
      key_topics: ['AI safety', 'alignment'],
      word_count: 150,
      embedding: mockEmbeddingFromSeed(42),
      created_at: new Date().toISOString(),
    },
    relevance_score: 0.89,
    match_type: 'semantic',
    matched_content: 'Research on AI alignment and safety...',
  },
  {
    source: {
      id: '2',
      user_id: 'user-1',
      title: 'ML Ethics Guide',
      content_type: 'text',
      original_content: 'Ethical considerations in machine learning...',
      url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    summary: {
      id: 'summary-2',
      source_id: '2',
      summary_text: 'Ethics in ML development...',
      key_actions: ['Implement ethical guidelines'],
      key_topics: ['ethics', 'machine learning'],
      word_count: 120,
      embedding: mockEmbeddingFromSeed(100),
      created_at: new Date().toISOString(),
    },
    relevance_score: 0.76,
    match_type: 'hybrid',
    matched_content: 'Ethical considerations in machine learning...',
  },
];

/**
 * Mock summaries for backfill testing
 */
export const mockSummariesForBackfill = (count: number, withEmbedding = false) =>
  new Array(count).fill(0).map((_, i) => ({
    id: `summary-${i + 1}`,
    source_id: `source-${i + 1}`,
    summary_text: `This is summary ${i + 1} about various topics.`,
    key_actions: [`Action ${i + 1}`],
    key_topics: [`Topic ${i + 1}`],
    word_count: 100 + i * 10,
    embedding: withEmbedding ? mockEmbeddingFromSeed(i) : null,
    created_at: new Date().toISOString(),
  }));
