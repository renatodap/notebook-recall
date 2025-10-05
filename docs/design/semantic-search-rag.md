# Feature 1: Semantic Search RAG (Retrieval-Augmented Generation)

## Overview
Replace naive keyword matching with semantic vector similarity search using embeddings and pgvector.

## Problem Statement
Current implementation:
- Uses regex keyword matching (`/summarize|source|recent/i`)
- Always retrieves last 10 sources regardless of relevance
- No semantic understanding of query context
- Low precision in source retrieval

## Solution Design

### Architecture
1. **Embedding Generation**
   - Use OpenAI's text-embedding-3-small model (1536 dimensions)
   - Generate embeddings for all source content on creation/update
   - Store embeddings in Supabase using pgvector extension

2. **Vector Storage**
   - Add `source_embeddings` table with pgvector column
   - Create HNSW index for fast similarity search
   - Store metadata: source_id, embedding_vector, chunk_id

3. **Retrieval Process**
   - Convert user query to embedding
   - Perform cosine similarity search in pgvector
   - Return top-k most relevant sources (configurable, default k=5)
   - Include similarity scores for transparency

### Database Schema
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Source embeddings table
CREATE TABLE source_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  chunk_id INTEGER DEFAULT 0,
  embedding vector(1536),
  content_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, chunk_id)
);

-- Create HNSW index for fast similarity search
CREATE INDEX source_embeddings_vector_idx
  ON source_embeddings
  USING hnsw (embedding vector_cosine_ops);
```

### API Endpoints
- `POST /api/embeddings/generate` - Generate embedding for source
- `POST /api/embeddings/search` - Semantic search query

### Integration Points
- Hook into source creation/update to auto-generate embeddings
- Modify chat route to use semantic search instead of keyword matching
- Add fallback to keyword matching if embeddings unavailable

## Success Criteria
1. All sources have embeddings generated within 30s of creation
2. Semantic search returns relevant results with >0.7 similarity score
3. Query response time <500ms for embedding search
4. Backward compatible with sources without embeddings

## Testing Strategy
1. Unit tests for embedding generation
2. Integration tests for similarity search
3. Performance tests for large datasets (1000+ sources)
4. A/B test: semantic vs keyword matching accuracy
