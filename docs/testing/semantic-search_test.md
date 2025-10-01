# Semantic Search Testing Strategy

## Test Coverage Goals
- Unit Tests: ≥90% coverage
- Integration Tests: All API endpoints
- E2E Tests: Complete search flow

## Unit Tests

### File: `src/__tests__/unit/embeddings-client.test.ts`

#### Embedding Generation

**Test: generateEmbedding() creates valid embedding**
- Setup: Mock Anthropic API response
- Action: Call `generateEmbedding("test text")`
- Assert: Returns array of 1536 numbers
- Assert: All values between -1 and 1

**Test: generateEmbedding() handles API errors**
- Setup: Mock API to return error
- Action: Call `generateEmbedding("test")`
- Assert: Throws appropriate error
- Assert: Error message is user-friendly

**Test: generateEmbedding() retries on transient failures**
- Setup: Mock API to fail twice, succeed third time
- Action: Call `generateEmbedding("test")`
- Assert: Makes 3 API calls
- Assert: Eventually succeeds

**Test: generateEmbedding() validates input length**
- Setup: Create very long text (>8000 chars)
- Action: Call `generateEmbedding(longText)`
- Assert: Throws validation error
- Assert: Error indicates max length

**Test: generateEmbedding() normalizes vectors**
- Setup: Mock API response with unnormalized vector
- Action: Call `generateEmbedding("test")`
- Assert: Returned vector is normalized
- Assert: Magnitude ≈ 1.0

#### Batch Embedding Generation

**Test: generateEmbeddings() processes batch**
- Setup: Array of 5 texts
- Action: Call `generateEmbeddings(texts)`
- Assert: Returns 5 embeddings
- Assert: All embeddings valid

**Test: generateEmbeddings() handles partial failures**
- Setup: Mock API to fail on 3rd item
- Action: Call `generateEmbeddings([text1, text2, text3])`
- Assert: Returns embeddings for successful items
- Assert: Returns error for failed item

**Test: generateEmbeddings() respects rate limits**
- Setup: Mock rate-limited API
- Action: Call `generateEmbeddings(manyTexts)`
- Assert: Implements exponential backoff
- Assert: Eventually completes

### File: `src/__tests__/unit/embeddings-utils.test.ts`

#### Vector Operations

**Test: cosineSimilarity() calculates correctly**
- Setup: Two known vectors
- Action: Call `cosineSimilarity(vec1, vec2)`
- Assert: Returns correct similarity score
- Assert: Score between 0 and 1

**Test: cosineSimilarity() handles identical vectors**
- Setup: Same vector twice
- Action: Call `cosineSimilarity(vec, vec)`
- Assert: Returns 1.0 (exact match)

**Test: cosineSimilarity() handles orthogonal vectors**
- Setup: Perpendicular vectors
- Action: Call `cosineSimilarity(vec1, vec2)`
- Assert: Returns ~0.0

**Test: cosineSimilarity() validates dimensions**
- Setup: Vectors of different dimensions
- Action: Call `cosineSimilarity(vec1536, vec512)`
- Assert: Throws error
- Assert: Error message indicates dimension mismatch

**Test: normalizeVector() normalizes correctly**
- Setup: Unnormalized vector
- Action: Call `normalizeVector(vector)`
- Assert: Returned vector has magnitude 1.0
- Assert: Direction preserved

#### Hybrid Search Scoring

**Test: calculateHybridScore() combines scores**
- Setup: semantic=0.8, keyword=0.6
- Action: Call `calculateHybridScore(0.8, 0.6, weights)`
- Assert: Returns weighted average
- Assert: Score between 0 and 1

**Test: calculateHybridScore() handles missing semantic**
- Setup: semantic=null, keyword=0.7
- Action: Call `calculateHybridScore(null, 0.7)`
- Assert: Returns keyword score only
- Assert: No errors thrown

**Test: calculateHybridScore() handles missing keyword**
- Setup: semantic=0.9, keyword=null
- Action: Call `calculateHybridScore(0.9, null)`
- Assert: Returns semantic score only

**Test: calculateHybridScore() validates weights**
- Setup: weights that don't sum to 1.0
- Action: Call `calculateHybridScore(0.8, 0.6, {semantic: 0.8, keyword: 0.8})`
- Assert: Throws validation error

### File: `src/__tests__/unit/backfill.test.ts`

#### Backfill Process

**Test: backfillEmbeddings() processes all summaries**
- Setup: Mock 10 summaries without embeddings
- Action: Call `backfillEmbeddings()`
- Assert: Generates embeddings for all 10
- Assert: Updates database correctly

**Test: backfillEmbeddings() skips existing**
- Setup: 5 summaries with embeddings, 5 without
- Action: Call `backfillEmbeddings()`
- Assert: Only processes 5 without embeddings
- Assert: Doesn't overwrite existing

**Test: backfillEmbeddings() handles failures gracefully**
- Setup: Mock API to fail on 3rd summary
- Action: Call `backfillEmbeddings()`
- Assert: Continues with remaining summaries
- Assert: Returns failure count

**Test: backfillEmbeddings() respects batch size**
- Setup: 100 summaries, batch_size=10
- Action: Call `backfillEmbeddings({batch_size: 10})`
- Assert: Makes 10 batches of 10
- Assert: Doesn't overwhelm API

**Test: backfillEmbeddings() supports dry run**
- Setup: 10 summaries without embeddings
- Action: Call `backfillEmbeddings({dry_run: true})`
- Assert: Returns what would be processed
- Assert: Doesn't modify database

## Integration Tests

### File: `src/__tests__/integration/embeddings-api.test.ts`

#### POST /api/embeddings/generate

**Test: Generates embedding for text**
- Action: POST with valid text
- Assert: Returns 200
- Assert: Response has embedding array
- Assert: Embedding has 1536 dimensions

**Test: Validates input**
- Action: POST with empty text
- Assert: Returns 400
- Assert: Error message indicates missing text

**Test: Handles long text**
- Action: POST with 10,000 char text
- Assert: Returns 400
- Assert: Error indicates max length

**Test: Requires authentication**
- Action: POST without auth token
- Assert: Returns 401

#### POST /api/embeddings/backfill

**Test: Backfills embeddings (admin only)**
- Setup: Create summaries without embeddings
- Action: POST to backfill endpoint
- Assert: Returns 200
- Assert: Summaries now have embeddings

**Test: Returns progress report**
- Setup: Mix of summaries with/without embeddings
- Action: POST to backfill endpoint
- Assert: Response shows processed count
- Assert: Response shows skipped count

**Test: Supports dry run**
- Setup: Summaries without embeddings
- Action: POST with {dry_run: true}
- Assert: No embeddings created
- Assert: Returns what would be processed

### File: `src/__tests__/integration/semantic-search-api.test.ts`

#### POST /api/search (Enhanced)

**Test: Semantic search finds similar content**
- Setup: Create sources about "AI safety"
- Action: POST search with query "artificial intelligence alignment"
- Assert: Returns AI safety sources
- Assert: Relevance scores high
- Assert: match_type is "semantic"

**Test: Keyword search still works**
- Setup: Create source with unique keyword
- Action: POST search with {mode: "keyword"}
- Assert: Finds exact keyword matches
- Assert: match_type is "keyword"

**Test: Hybrid search combines both**
- Setup: Sources with semantic + keyword matches
- Action: POST search with {mode: "hybrid"}
- Assert: Returns both types
- Assert: Correctly ranks results

**Test: Falls back when no embeddings**
- Setup: Sources without embeddings
- Action: POST search query
- Assert: Returns keyword results
- Assert: Warning about fallback

**Test: Respects similarity threshold**
- Setup: Sources with varying similarity
- Action: POST search with {threshold: 0.8}
- Assert: Only returns results >0.8 similarity
- Assert: Filters out low-similarity results

**Test: Handles empty results**
- Setup: Database with unrelated content
- Action: POST search with very specific query
- Assert: Returns empty results array
- Assert: No errors

## End-to-End Tests

### File: `src/__tests__/e2e/semantic-search.test.ts`

#### Complete Search Flow

**Test: User creates source and can semantically search it**
- Action: Sign up, create source about "machine learning"
- Action: Wait for embedding generation
- Action: Search for "artificial intelligence algorithms"
- Assert: Original source appears in results
- Assert: High relevance score

**Test: Search works immediately after creation**
- Action: Create source
- Action: Immediately search for related terms
- Assert: Source appears (embedding generated synchronously)

**Test: Search persists across sessions**
- Action: Create source, logout
- Action: Login, search for related content
- Assert: Source still findable
- Assert: Embeddings persisted

**Test: Search respects user isolation**
- Action: User A creates source
- Action: User B searches for same terms
- Assert: User B doesn't see User A's source
- Assert: RLS policies working

## Performance Tests

### File: `src/__tests__/performance/search-latency.test.ts`

**Test: Search completes in <500ms**
- Setup: Database with 1000 sources
- Action: Execute semantic search
- Assert: p95 latency <500ms
- Assert: p99 latency <1000ms

**Test: Embedding generation <2s**
- Setup: Standard summary text (~500 words)
- Action: Generate embedding
- Assert: Completes in <2s

**Test: Backfill processes 100 summaries <60s**
- Setup: 100 summaries without embeddings
- Action: Run backfill
- Assert: Completes in <60s
- Assert: All embeddings generated

## Mock Data

### Embedding Fixtures

```typescript
export const mockEmbedding1536 = new Array(1536).fill(0).map(() =>
  (Math.random() * 2) - 1
)

export const mockSimilarEmbeddings = {
  query: [0.1, 0.2, 0.3, ...],
  match: [0.11, 0.19, 0.31, ...],  // Cosine similarity ~0.95
  noMatch: [-0.8, 0.1, -0.2, ...], // Cosine similarity ~0.2
}

export const mockSearchResults = [
  {
    source: { id: '1', title: 'AI Safety', ... },
    summary: { summary_text: '...', ... },
    relevance_score: 0.89,
    match_type: 'semantic',
  },
  {
    source: { id: '2', title: 'ML Ethics', ... },
    summary: { summary_text: '...', ... },
    relevance_score: 0.76,
    match_type: 'hybrid',
  },
]
```

### API Response Mocks

```typescript
export const mockAnthropicEmbeddingResponse = {
  object: 'embedding',
  data: [
    {
      object: 'embedding',
      embedding: mockEmbedding1536,
      index: 0,
    },
  ],
  model: 'text-embedding-3-small',
  usage: {
    prompt_tokens: 8,
    total_tokens: 8,
  },
}
```

## Test Utilities

### Helper Functions

```typescript
// Create source with embedding
export async function createSourceWithEmbedding(data): Promise<Source>

// Generate test embedding
export function generateTestEmbedding(seed?: number): number[]

// Assert embeddings similar
export function expectSimilarEmbeddings(emb1, emb2, threshold = 0.9)

// Assert search results ordered by relevance
export function expectOrderedByRelevance(results)
```

## Coverage Requirements

### Minimum Coverage by File

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| embeddings/client.ts | 85% | 80% | 90% | 85% |
| embeddings/utils.ts | 95% | 90% | 100% | 95% |
| embeddings/backfill.ts | 80% | 75% | 85% | 80% |
| api/embeddings/*/route.ts | 80% | 75% | 80% | 80% |
| api/search/route.ts (updated) | 85% | 80% | 85% | 85% |

### Overall Target
- **Total Coverage: ≥80%** across all semantic search code
- All critical paths tested
- All error conditions tested
- All edge cases covered

## Test Execution

### Run All Tests
```bash
npm test -- semantic-search
npm test -- embeddings
```

### Run Integration Tests Only
```bash
npm test -- --testPathPattern=integration
```

### Coverage Report
```bash
npm run test:coverage -- --collectCoverageFrom="src/lib/embeddings/**" --collectCoverageFrom="src/app/api/embeddings/**"
```

## Continuous Integration

### Pre-commit Hooks
- Run unit tests
- Check coverage thresholds
- Lint code

### CI Pipeline
- Run all tests
- Generate coverage report
- Fail if coverage <80%
- Performance regression tests
