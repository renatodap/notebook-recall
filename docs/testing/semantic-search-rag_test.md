# Test Design: Semantic Search RAG

## Test Coverage Requirements
Target: ≥80% code coverage

## Unit Tests

### 1. Embedding Generation (`lib/embeddings/generator.test.ts`)
```typescript
describe('EmbeddingGenerator', () => {
  test('should generate embedding for text', async () => {
    const embedding = await generateEmbedding('test content')
    expect(embedding).toHaveLength(1536)
    expect(embedding[0]).toBeTypeOf('number')
  })

  test('should handle empty text', async () => {
    await expect(generateEmbedding('')).rejects.toThrow()
  })

  test('should handle very long text (>8000 tokens)', async () => {
    const longText = 'word '.repeat(10000)
    const embedding = await generateEmbedding(longText)
    expect(embedding).toHaveLength(1536)
  })

  test('should cache identical inputs', async () => {
    const text = 'identical content'
    const emb1 = await generateEmbedding(text)
    const emb2 = await generateEmbedding(text)
    expect(emb1).toEqual(emb2)
  })
})
```

### 2. Vector Search (`lib/embeddings/search.test.ts`)
```typescript
describe('SemanticSearch', () => {
  test('should find similar sources', async () => {
    const results = await semanticSearch(userId, 'machine learning algorithms')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('source_id')
    expect(results[0]).toHaveProperty('similarity')
    expect(results[0].similarity).toBeGreaterThan(0.7)
  })

  test('should return empty array for no matches', async () => {
    const results = await semanticSearch(userId, 'totally unrelated query xyz123')
    expect(results).toEqual([])
  })

  test('should respect top-k limit', async () => {
    const results = await semanticSearch(userId, 'test', { limit: 3 })
    expect(results.length).toBeLessThanOrEqual(3)
  })

  test('should filter by similarity threshold', async () => {
    const results = await semanticSearch(userId, 'test', { threshold: 0.8 })
    results.forEach(r => expect(r.similarity).toBeGreaterThanOrEqual(0.8))
  })
})
```

## Integration Tests

### 3. End-to-End Chat with Semantic Search
```typescript
describe('Chat with Semantic Search', () => {
  test('should retrieve relevant sources for query', async () => {
    // Setup: Create sources with embeddings
    const source1 = await createSource({ title: 'Neural Networks', content: '...' })
    const source2 = await createSource({ title: 'Cooking Recipes', content: '...' })

    // Test: Query about ML should retrieve source1, not source2
    const response = await POST('/api/research-assistant/chat', {
      message: 'Tell me about deep learning'
    })

    expect(response.sources_used).toContain(source1.id)
    expect(response.sources_used).not.toContain(source2.id)
  })
})
```

## Performance Tests

### 4. Load Testing
```typescript
describe('Semantic Search Performance', () => {
  test('should handle 1000+ sources efficiently', async () => {
    const start = Date.now()
    const results = await semanticSearch(userId, 'test query')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(500) // <500ms
  })
})
```

## UI Tests

### 5. User Interface Verification
- [ ] Similarity scores displayed in chat UI
- [ ] "Sources Used" section shows relevance indicators
- [ ] Settings page has semantic search toggle
- [ ] Loading state during embedding generation
- [ ] Error handling for API failures
