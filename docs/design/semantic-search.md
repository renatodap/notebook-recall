# Semantic Search Feature Design

## Overview
Implement true semantic search using vector embeddings to find conceptually similar content, not just keyword matches.

## Current State
- Database has `embedding vector(1536)` column in summaries table
- Database has `match_summaries()` function for similarity search
- Search API route exists but only does keyword matching
- No embeddings are being generated or stored

## Requirements

### Functional Requirements
1. Generate embeddings for all new summaries automatically
2. Backfill embeddings for existing summaries (migration)
3. Search using vector similarity when query is semantic
4. Fall back to keyword search if no embeddings available
5. Return results ranked by relevance score
6. Support hybrid search (semantic + keyword combined)

### Non-Functional Requirements
1. Search latency < 500ms for typical queries
2. Embedding generation < 2s per summary
3. Support 10,000+ sources without performance degradation
4. Graceful degradation if embedding service unavailable

## Architecture

### Embedding Generation

**When to Generate:**
- On summary creation (in `/api/sources` POST)
- Batch job for backfilling existing summaries
- On summary re-generation

**What to Embed:**
- Summary text (primary)
- Key topics combined (secondary weight)
- Title (tertiary weight)

**Embedding Provider:**
Use Claude's embedding capability via Anthropic API:
- Model: `text-embedding-3-small` or equivalent
- Dimension: 1536 (matches database schema)
- Normalize vectors for cosine similarity

### Search Flow

```
User Query
    ↓
Generate Query Embedding
    ↓
Vector Similarity Search (match_summaries function)
    ↓
Filter by threshold (>0.7 similarity)
    ↓
Combine with keyword results (hybrid)
    ↓
Rank by combined score
    ↓
Return top N results
```

### Hybrid Search Algorithm

```typescript
semanticScore = vectorSimilarity(queryEmbedding, summaryEmbedding)
keywordScore = keywordMatch(query, summary)

// Weighted combination
finalScore = (0.7 * semanticScore) + (0.3 * keywordScore)

// Or use RRF (Reciprocal Rank Fusion)
```

## API Design

### New Endpoint: POST /api/embeddings/generate

Generate embedding for text.

**Request:**
```json
{
  "text": "content to embed",
  "type": "summary" | "query"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, ...], // 1536 dimensions
  "model": "text-embedding-3-small",
  "tokens": 150
}
```

### Modified Endpoint: POST /api/search

Enhanced with semantic search.

**Request:**
```json
{
  "query": "natural language query",
  "mode": "semantic" | "keyword" | "hybrid",
  "limit": 20,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "results": [
    {
      "source": {...},
      "summary": {...},
      "relevance_score": 0.89,
      "match_type": "semantic" | "keyword" | "hybrid",
      "matched_content": "highlighted snippet"
    }
  ],
  "total": 42,
  "search_mode": "hybrid"
}
```

### New Endpoint: POST /api/embeddings/backfill

Admin endpoint to backfill embeddings for existing summaries.

**Request:**
```json
{
  "batch_size": 10,
  "dry_run": false
}
```

**Response:**
```json
{
  "processed": 156,
  "failed": 2,
  "skipped": 0,
  "duration_ms": 45000
}
```

## Database Changes

### No Schema Changes Needed
- `summaries.embedding` column already exists
- `match_summaries()` function already exists
- Just need to populate the data

### Index Optimization
Already exists:
```sql
CREATE INDEX idx_summaries_embedding
ON summaries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

May need to tune `lists` parameter based on data size:
- < 1000 summaries: lists = 100
- 1000-10000: lists = 200
- > 10000: lists = 500

## Implementation Files

```
src/lib/embeddings/
├── client.ts           # Embedding generation client
├── utils.ts            # Vector operations, similarity
└── backfill.ts         # Batch processing script

src/app/api/embeddings/
├── generate/route.ts   # Generate embedding endpoint
└── backfill/route.ts   # Backfill endpoint

src/app/api/search/
└── route.ts            # Enhanced with semantic search

src/__tests__/unit/
└── embeddings.test.ts  # Embedding tests

src/__tests__/integration/
└── semantic-search.test.ts  # E2E search tests
```

## User Experience

### Search Bar Enhancement

**Auto-detect query intent:**
- "summarize recent articles" → semantic
- "machine learning papers" → semantic
- "url:example.com" → keyword
- "tag:ai" → filter

**Visual feedback:**
```
[Search: "concepts similar to AI safety"]
🔍 Semantic search • 12 results • 0.3s
```

### Results Display

Show match type and relevance:
```
📄 AI Safety Research Overview
   Relevance: 89% (semantic match)
   "...discusses alignment and safety concerns..."

📄 Machine Learning Ethics Guide
   Relevance: 76% (hybrid match)
   "...ethical considerations in AI development..."
```

## Error Handling

### Embedding Generation Failures
- Retry with exponential backoff (3 attempts)
- If all fail, save summary without embedding
- Log to monitoring service
- Background job can retry later

### Search Failures
- Fall back to keyword search
- Show warning: "Semantic search unavailable, showing keyword results"
- Continue working, don't block user

### Rate Limiting
- Anthropic API has rate limits
- Implement client-side queueing
- Batch embeddings when possible
- Cache query embeddings (TTL: 1 hour)

## Performance Optimization

### Caching Strategy
1. **Query Embeddings**: Cache for 1 hour
2. **Summary Embeddings**: Permanent (in database)
3. **Search Results**: Cache for 5 minutes per query

### Batching
- Generate embeddings in batches of 10
- Backfill in background job
- Use worker/queue for async processing

### Monitoring
- Track embedding generation time
- Track search latency
- Alert if >10% failures
- Dashboard for vector index health

## Security Considerations

1. **API Key Protection**: Embedding API key server-side only
2. **Rate Limiting**: Prevent abuse of embedding generation
3. **Input Validation**: Limit text length (max 8000 chars)
4. **User Isolation**: RLS policies ensure users only search their data

## Testing Strategy

### Unit Tests
- Embedding generation
- Vector similarity calculation
- Hybrid score computation
- Error handling

### Integration Tests
- Full search flow with embeddings
- Backfill process
- Fallback to keyword search

### Performance Tests
- Search latency with 10k+ sources
- Embedding generation throughput
- Concurrent search requests

## Rollout Plan

### Phase 1: Infrastructure
- Implement embedding generation
- Add API endpoints
- Unit tests

### Phase 2: Backfill
- Generate embeddings for existing summaries
- Monitor for failures
- Verify data quality

### Phase 3: Search Enhancement
- Integrate semantic search into UI
- A/B test semantic vs keyword
- Collect user feedback

### Phase 4: Optimization
- Tune similarity thresholds
- Optimize hybrid algorithm
- Add advanced features

## Success Metrics

- **Accuracy**: Semantic results rated better than keyword (user survey)
- **Performance**: <500ms p95 search latency
- **Coverage**: >95% of summaries have embeddings
- **Adoption**: >70% of searches use semantic mode
- **Reliability**: <1% embedding generation failures

## Future Enhancements

- Multi-modal embeddings (text + images)
- Custom embedding models (fine-tuned)
- Clustering/topic modeling
- Semantic recommendations
- "More like this" feature
