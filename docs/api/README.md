# Recall Notebook API Documentation

Complete API reference for all endpoints in the Recall Notebook backend.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

All protected endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

Get your token from Supabase Auth after login/signup.

## Rate Limiting

All endpoints are rate limited to prevent abuse:

| Endpoint Type | Limit |
|--------------|-------|
| Simple AI (summaries, tags) | 20 req/min |
| Complex AI (synthesis, contradictions) | 5 req/min |
| Search | 60 req/min |
| Content Fetch (URL, PDF) | 30 req/min |
| Embeddings | 10 req/min |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry (on 429 responses)

---

## Table of Contents

1. [Sources](#sources)
2. [Search](#search)
3. [Embeddings](#embeddings)
4. [AI Features](#ai-features)
   - [Summarization](#summarization)
   - [Synthesis](#synthesis)
   - [Connections](#connections)
   - [Contradictions](#contradictions)
   - [Concepts](#concepts)
   - [Gap Analysis](#gap-analysis)
5. [Citations](#citations)
6. [Collections](#collections)
7. [Tags](#tags)
8. [Export](#export)
9. [Publishing](#publishing)
10. [Analytics](#analytics)
11. [Admin](#admin)

---

## Sources

### Create Source

**POST** `/api/sources`

Create a new source with AI-generated summary.

**Auth Required:** Yes
**Rate Limit:** 20 req/min

**Request Body:**
```json
{
  "title": "Optional title",
  "content_type": "text" | "url" | "pdf" | "note" | "image",
  "original_content": "Content to process",
  "url": "https://example.com/article" (optional),
  "summary_text": "AI-generated summary",
  "key_actions": ["Action 1", "Action 2"],
  "key_topics": ["topic1", "topic2"],
  "word_count": 1500
}
```

**Response 201:**
```json
{
  "source": {
    "id": "uuid",
    "title": "Source title",
    "content_type": "text",
    "original_content": "Full text...",
    "url": null,
    "created_at": "2025-01-05T12:00:00Z",
    "updated_at": "2025-01-05T12:00:00Z",
    "user_id": "user-uuid"
  },
  "summary": {
    "id": "uuid",
    "source_id": "source-uuid",
    "summary_text": "AI summary...",
    "key_actions": ["Action 1"],
    "key_topics": ["AI", "ML"],
    "word_count": 1500,
    "created_at": "2025-01-05T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid request body
- `401` - Unauthorized
- `429` - Rate limit exceeded
- `500` - Server error

---

### List Sources

**GET** `/api/sources`

Get paginated list of user's sources.

**Auth Required:** Yes

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Results per page
- `contentType` (string) - Filter by content type
- `sort` (string, default: "created_at") - Sort field
- `order` (string, default: "desc") - Sort order (asc/desc)

**Response 200:**
```json
{
  "data": [...sources...],
  "total": 142,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

---

### Get Source

**GET** `/api/sources/[id]`

Get single source with summary and tags.

**Auth Required:** Yes

**Response 200:**
```json
{
  "id": "uuid",
  "title": "Source title",
  "content_type": "text",
  "original_content": "Full content...",
  "summary": { ... },
  "tags": [
    { "id": "uuid", "tag_name": "AI", "created_at": "..." }
  ],
  "created_at": "2025-01-05T12:00:00Z"
}
```

**Errors:**
- `404` - Source not found
- `403` - Not authorized to view this source

---

### Delete Source

**DELETE** `/api/sources/[id]`

Delete a source and all related data (cascades to summaries, tags, embeddings).

**Auth Required:** Yes

**Response 200:**
```json
{
  "message": "Source deleted successfully"
}
```

---

## Search

### Semantic Search

**POST** `/api/search`

Search sources using semantic similarity or keyword matching.

**Auth Required:** Yes
**Rate Limit:** 60 req/min

**Request Body:**
```json
{
  "query": "machine learning ethics",
  "mode": "semantic" | "keyword" | "hybrid",
  "limit": 20,
  "threshold": 0.7,
  "contentType": "text" | "url" | "pdf" (optional)
}
```

**Response 200:**
```json
{
  "results": [
    {
      "source": { ...source object... },
      "summary": { ...summary object... },
      "relevance_score": 0.92,
      "match_type": "semantic" | "keyword" | "hybrid"
    }
  ],
  "total": 15,
  "search_mode": "semantic",
  "query": "machine learning ethics"
}
```

---

## Embeddings

### Generate Embedding

**POST** `/api/embeddings/generate`

Generate vector embedding for text.

**Auth Required:** Yes
**Rate Limit:** 10 req/min

**Request Body:**
```json
{
  "text": "Text to embed",
  "type": "summary" | "chunk" | "query"
}
```

**Response 200:**
```json
{
  "embedding": [0.123, 0.456, ...],  // 1536 dimensions
  "dimensions": 1536,
  "model": "text-embedding-3-small",
  "tokens": 15
}
```

---

### Backfill Embeddings (Admin)

**POST** `/api/embeddings/backfill`

Generate embeddings for existing sources missing them.

**Auth Required:** Yes (Admin only)
**Rate Limit:** N/A (admin endpoint)

**Request Body:**
```json
{
  "batch_size": 10,
  "dry_run": false
}
```

**Response 200:**
```json
{
  "total": 50,
  "processed": 50,
  "successes": 48,
  "failures": [
    { "sourceId": "uuid", "error": "API error" }
  ]
}
```

**Errors:**
- `403` - Forbidden (admin access required)

---

## AI Features

### Summarization

**POST** `/api/summarize`

Generate AI summary for content.

**Auth Required:** Yes
**Rate Limit:** 20 req/min

**Request Body:**
```json
{
  "content": "Long text to summarize...",
  "content_type": "text" | "url" | "pdf"
}
```

**Response 200:**
```json
{
  "summary": "Concise summary of the content...",
  "keyActions": ["Action 1", "Action 2"],
  "topics": ["AI", "Ethics", "Machine Learning"],
  "wordCount": 1500
}
```

---

### Synthesis

**POST** `/api/synthesis/generate`

Generate comprehensive synthesis report from multiple sources.

**Auth Required:** Yes
**Rate Limit:** 5 req/min (complex AI)

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2", "uuid3"],
  "title": "AI Ethics Review",
  "focusAreas": ["Safety", "Bias", "Transparency"]
}
```

**Response 200:**
```json
{
  "id": "synthesis-uuid",
  "title": "AI Ethics Review",
  "content": "# Executive Summary\n\n...",
  "sources_used": ["uuid1", "uuid2"],
  "created_at": "2025-01-05T12:00:00Z"
}
```

---

### Discover Connections

**POST** `/api/connections/discover`

Find semantic connections between sources.

**Auth Required:** Yes
**Rate Limit:** 5 req/min

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2", "uuid3"],
  "minSimilarity": 0.7
}
```

**Response 200:**
```json
{
  "connections": [
    {
      "source1_id": "uuid1",
      "source2_id": "uuid2",
      "similarity": 0.85,
      "shared_concepts": ["AI safety", "alignment"],
      "relationship_type": "supports" | "contradicts" | "builds_upon"
    }
  ]
}
```

---

### Detect Contradictions

**POST** `/api/contradictions/detect`

Find contradictions between sources.

**Auth Required:** Yes
**Rate Limit:** 5 req/min

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2"]
}
```

**Response 200:**
```json
{
  "contradictions": [
    {
      "source1_id": "uuid1",
      "source2_id": "uuid2",
      "claim1": "AI will revolutionize healthcare",
      "claim2": "AI in healthcare is overhyped",
      "severity": "high" | "medium" | "low",
      "explanation": "These sources make conflicting claims about..."
    }
  ]
}
```

---

### Extract Concepts

**POST** `/api/concepts/extract`

Extract key concepts from content.

**Auth Required:** Yes
**Rate Limit:** 20 req/min

**Request Body:**
```json
{
  "sourceId": "uuid"
}
```

**Response 200:**
```json
{
  "concepts": [
    {
      "name": "Machine Learning",
      "category": "technology",
      "mentions": 15,
      "related_concepts": ["AI", "Neural Networks"]
    }
  ]
}
```

---

### Gap Analysis

**POST** `/api/analysis/gaps`

Identify knowledge gaps in your sources.

**Auth Required:** Yes
**Rate Limit:** 5 req/min

**Request Body:**
```json
{
  "topic": "AI Ethics",
  "sourceIds": ["uuid1", "uuid2"]
}
```

**Response 200:**
```json
{
  "gaps": [
    {
      "area": "Regulatory Frameworks",
      "severity": "high",
      "explanation": "Your sources lack coverage of EU AI Act...",
      "suggested_resources": [
        "https://example.com/eu-ai-act"
      ]
    }
  ],
  "coverage_score": 0.65
}
```

---

## Citations

### Fetch Citation Metadata

**POST** `/api/citations/fetch`

Fetch citation metadata from DOI, URL, or other identifiers.

**Auth Required:** Yes
**Rate Limit:** 30 req/min

**Request Body:**
```json
{
  "identifier": "10.1038/s41586-021-03819-2",
  "type": "doi" | "url" | "arxiv" | "pmid"
}
```

**Response 200:**
```json
{
  "citation": {
    "authors": ["Author 1", "Author 2"],
    "title": "Paper Title",
    "year": 2021,
    "journal": "Nature",
    "doi": "10.1038/s41586-021-03819-2",
    "url": "https://doi.org/...",
    "bibtex": "@article{...}",
    "apa": "Author 1, Author 2 (2021). Paper Title..."
  }
}
```

---

### Export Citations

**POST** `/api/citations/export-citations`

Export citations in various formats.

**Auth Required:** Yes

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2"],
  "format": "bibtex" | "ris" | "apa" | "mla" | "chicago"
}
```

**Response 200:**
```json
{
  "citations": "formatted citation text...",
  "format": "bibtex",
  "count": 5
}
```

---

## Collections

### Create Collection

**POST** `/api/collections`

Create a collection to organize sources.

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "AI Research Papers",
  "description": "Collection of papers on AI safety",
  "is_public": false
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "AI Research Papers",
  "description": "...",
  "is_public": false,
  "created_at": "2025-01-05T12:00:00Z"
}
```

---

### Add Sources to Collection

**POST** `/api/collections/[id]/sources`

Add sources to a collection.

**Auth Required:** Yes

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2"]
}
```

**Response 200:**
```json
{
  "added": 2,
  "collection_id": "uuid"
}
```

---

## Tags

### Get All Tags

**GET** `/api/tags`

Get all unique tags for the user with counts.

**Auth Required:** Yes

**Response 200:**
```json
{
  "tags": [
    {
      "tag_name": "AI",
      "count": 42,
      "sources": ["uuid1", "uuid2", ...]
    }
  ],
  "total": 25
}
```

---

## Export

### Export to Markdown

**POST** `/api/export`

Export sources to Markdown format.

**Auth Required:** Yes

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2"],
  "format": "markdown",
  "includeMetadata": true
}
```

**Response 200:**
```json
{
  "content": "# Source 1\n\n...",
  "filename": "export-2025-01-05.md"
}
```

---

### Export to Document (DOCX)

**POST** `/api/export/document`

Export to Microsoft Word format.

**Auth Required:** Yes

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2"],
  "title": "My Research",
  "includeTableOfContents": true
}
```

**Response 200:**
- Binary file download (application/vnd.openxmlformats-officedocument.wordprocessingml.document)

---

## Publishing

### Generate Blog Post

**POST** `/api/publishing/blog`

Generate blog post from sources.

**Auth Required:** Yes
**Rate Limit:** 5 req/min

**Request Body:**
```json
{
  "sourceIds": ["uuid1", "uuid2"],
  "tone": "professional" | "casual" | "academic",
  "length": "short" | "medium" | "long"
}
```

**Response 200:**
```json
{
  "title": "Understanding AI Ethics",
  "content": "Blog post content in Markdown...",
  "metadata": {
    "wordCount": 1200,
    "readingTime": "5 min"
  }
}
```

---

## Analytics

### Get Dashboard Analytics

**GET** `/api/analytics/dashboard`

Get overview analytics for dashboard.

**Auth Required:** Yes

**Response 200:**
```json
{
  "totalSources": 142,
  "sourcesByType": {
    "text": 50,
    "url": 60,
    "pdf": 32
  },
  "recentActivity": [
    {
      "type": "source_created",
      "timestamp": "2025-01-05T12:00:00Z",
      "metadata": {...}
    }
  ],
  "topTags": [
    { "tag": "AI", "count": 42 }
  ]
}
```

---

## Admin

### Backfill Embeddings

See [Embeddings > Backfill](#backfill-embeddings-admin)

---

## Error Responses

All endpoints may return these standard error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "details": { ...validation errors... }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 42 seconds.",
  "retryAfter": 42
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again."
}
```

---

## Webhooks (Future)

Webhook endpoints for external integrations (Strava, Garmin, etc.) will be documented here.

---

## Changelog

### 2025-01-05
- Initial API documentation created
- All 86 endpoints documented

---

## Support

For API support, please:
- Check this documentation
- Review example requests in docs/api/examples/
- Open an issue on GitHub
- Contact support at support@recallnotebook.com
