# Database Schema Design

## Overview
This document outlines the database schema for the Recall Notebook application using Supabase (PostgreSQL).

## Tables

### 1. sources
Stores all user-uploaded content (text, URLs, PDFs)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | uuid | NOT NULL, FOREIGN KEY → auth.users(id) | Owner of the source |
| title | text | NOT NULL | User-provided or auto-generated title |
| content_type | content_type_enum | NOT NULL | Type of content (text/url/pdf/note) |
| original_content | text | NOT NULL | Raw content text |
| url | text | NULLABLE | Original URL if content_type is 'url' |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_sources_user_id` ON user_id
- `idx_sources_content_type` ON content_type
- `idx_sources_created_at` ON created_at DESC

**Triggers:**
- Update `updated_at` on row modification

### 2. summaries
Stores AI-generated summaries and embeddings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| source_id | uuid | NOT NULL, FOREIGN KEY → sources(id) ON DELETE CASCADE | Associated source |
| summary_text | text | NOT NULL | AI-generated summary |
| key_actions | text[] | DEFAULT '{}' | Extracted action items |
| key_topics | text[] | DEFAULT '{}' | Extracted topics/tags |
| word_count | integer | NOT NULL | Word count of summary |
| embedding | vector(1536) | NULLABLE | Vector embedding for semantic search |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_summaries_source_id` ON source_id
- `idx_summaries_embedding` using ivfflat (embedding vector_cosine_ops) WITH (lists = 100)

**Note:** Requires `pgvector` extension

### 3. tags
Stores user-defined and auto-generated tags

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| source_id | uuid | NOT NULL, FOREIGN KEY → sources(id) ON DELETE CASCADE | Associated source |
| tag_name | text | NOT NULL | Tag name (lowercase) |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_tags_source_id` ON source_id
- `idx_tags_tag_name` ON tag_name
- UNIQUE constraint on (source_id, tag_name)

## Enums

### content_type_enum
```sql
CREATE TYPE content_type AS ENUM ('text', 'url', 'pdf', 'note');
```

## Database Functions

### match_summaries
Vector similarity search function for semantic search

```sql
CREATE OR REPLACE FUNCTION match_summaries(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  summary_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.source_id,
    s.summary_text,
    1 - (s.embedding <=> query_embedding) as similarity
  FROM summaries s
  WHERE s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Row Level Security (RLS) Policies

### sources table
```sql
-- Enable RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Users can view their own sources
CREATE POLICY "Users can view own sources"
  ON sources FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sources
CREATE POLICY "Users can insert own sources"
  ON sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sources
CREATE POLICY "Users can update own sources"
  ON sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sources
CREATE POLICY "Users can delete own sources"
  ON sources FOR DELETE
  USING (auth.uid() = user_id);
```

### summaries table
```sql
-- Enable RLS
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Users can view summaries of their sources
CREATE POLICY "Users can view own summaries"
  ON summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Users can insert summaries for their sources
CREATE POLICY "Users can insert own summaries"
  ON summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Users can update summaries of their sources
CREATE POLICY "Users can update own summaries"
  ON summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Users can delete summaries of their sources
CREATE POLICY "Users can delete own summaries"
  ON summaries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = summaries.source_id
      AND sources.user_id = auth.uid()
    )
  );
```

### tags table
```sql
-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Users can view tags of their sources
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Users can insert tags for their sources
CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );

-- Users can delete tags of their sources
CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sources
      WHERE sources.id = tags.source_id
      AND sources.user_id = auth.uid()
    )
  );
```

## Extensions Required

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
```

## Triggers

### Update updated_at timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Migration Strategy

1. Create extensions
2. Create enums
3. Create tables in order (sources → summaries → tags)
4. Create indexes
5. Create functions
6. Create triggers
7. Enable RLS and create policies

## Data Integrity

- Cascading deletes: Deleting a source deletes all related summaries and tags
- Unique constraints prevent duplicate tags on the same source
- NOT NULL constraints ensure data completeness
- Foreign key constraints maintain referential integrity

## Performance Considerations

- Indexes on frequently queried columns (user_id, created_at)
- Vector index (ivfflat) for fast similarity search
- Proper query patterns to leverage indexes
- Consider partitioning for large datasets (future optimization)

## Security Considerations

- RLS policies ensure data isolation between users
- Service role key only used server-side for admin operations
- All user operations go through RLS policies
- Sensitive data should be encrypted at rest (Supabase default)
