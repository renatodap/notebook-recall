# Recall Notebook ↔ Persimmon Labs Integration - COMPLETE ✅

## Overview

This integration allows Persimmon Labs (brandkit_generator) to fetch knowledge from Recall Notebook collections via API key authentication. Users can now enhance their brand generation with real business knowledge stored in their Recall Notebook.

---

## What Was Implemented

### 1. API Key Authentication System ✅

**Files Created/Modified:**
- `src/lib/api-auth.ts` - Authentication middleware supporting both session and API key auth
- `src/app/api/api-keys/route.ts` - API key management endpoints (GET, POST)
- `src/app/api/api-keys/[id]/route.ts` - API key deletion endpoint (DELETE)
- `supabase/migrations/20250107_api_keys.sql` - Database schema for API keys

**Features:**
- API key generation with `rn_` prefix (32 hex characters)
- SHA-256 hashing for secure storage (never stores plain text)
- Optional expiration dates
- Last used timestamp tracking
- Active/inactive status
- Row Level Security (RLS) policies

### 2. Collection API Endpoints with API Key Support ✅

**Modified Endpoints:**

#### `GET /api/collections`
- Lists all collections for authenticated user
- Supports both session and API key authentication
- Returns collection with source counts

#### `GET /api/collections/:id`
- Get single collection with full details
- Includes nested sources with summaries and tags
- Checks access permissions (owner or public)

#### `GET /api/collections/:id/sources`
- **NEW ENDPOINT**
- Lists all sources in a collection
- Returns full source data with summaries and tags
- Respects RLS and access permissions

#### `POST /api/collections/:id/search`
- **NEW ENDPOINT**
- Semantic search within collection sources
- Uses pgvector for similarity search
- Fallback to recent summaries if vector search unavailable
- Returns relevance scores

**Files Modified:**
- `src/app/api/collections/route.ts`
- `src/app/api/collections/[id]/route.ts`
- `src/app/api/collections/[id]/sources/route.ts` (added GET method)
- `src/app/api/collections/[id]/search/route.ts` (NEW FILE)

### 3. API Key Management UI ✅

**File Modified:**
- `src/app/settings/page.tsx`

**Features:**
- Create new API keys with friendly names
- Optional expiration (1-365 days)
- View all existing keys (masked, showing only prefix)
- Copy newly created keys to clipboard
- Delete/revoke keys
- View last used timestamp
- Expiration warnings

**UI Sections Added:**
- 🔑 API Keys section in settings
- Create new key dialog
- Key list with metadata
- "What are API keys used for?" info box

---

## Database Migration Required ⚠️

**File:** `supabase/migrations/20250107_api_keys.sql`

**What it creates:**
1. `api_keys` table with columns:
   - `id` (UUID, primary key)
   - `user_id` (UUID, references auth.users)
   - `key_hash` (TEXT, SHA-256 hash, unique)
   - `key_prefix` (TEXT, first 12 chars for display)
   - `name` (TEXT, user-friendly name)
   - `last_used_at` (TIMESTAMPTZ, nullable)
   - `expires_at` (TIMESTAMPTZ, nullable)
   - `is_active` (BOOLEAN, default true)
   - `permissions` (JSONB, default read-only)
   - `created_at` (TIMESTAMPTZ, default NOW)
   - `updated_at` (TIMESTAMPTZ, default NOW)

2. Indexes for performance:
   - `idx_api_keys_user_id`
   - `idx_api_keys_key_hash` (partial, only active keys)
   - `idx_api_keys_expires_at` (partial, only active keys)

3. RLS Policies:
   - Users can view own API keys
   - Users can insert own API keys
   - Users can update own API keys
   - Users can delete own API keys

4. Cleanup function:
   - `cleanup_expired_api_keys()` - Marks expired keys as inactive

### How to Run Migration:

#### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy entire contents of `supabase/migrations/20250107_api_keys.sql`
5. Paste into editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify success message

#### Option 2: Supabase CLI

```bash
cd recall-notebook
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Verification:

After running, verify with:

```sql
-- Check table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'api_keys';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'api_keys';

-- Check policies exist
SELECT policyname
FROM pg_policies
WHERE tablename = 'api_keys';
```

---

## Testing the Integration

### 1. Generate API Key in Recall Notebook

1. Navigate to Settings: https://notebook-recall.vercel.app/settings
2. Scroll to **🔑 API Keys** section
3. Click **+ Create New API Key**
4. Enter name: "Persimmon Labs Integration"
5. Leave expiration empty (or set to 365 days)
6. Click **Create Key**
7. **IMPORTANT:** Copy the key immediately (starts with `rn_`)

### 2. Test API Key with cURL

```bash
# Get all collections
curl -X GET "https://notebook-recall.vercel.app/api/collections" \
  -H "Authorization: Bearer rn_YOUR_API_KEY_HERE"

# Get specific collection
curl -X GET "https://notebook-recall.vercel.app/api/collections/COLLECTION_ID" \
  -H "Authorization: Bearer rn_YOUR_API_KEY_HERE"

# Get collection sources
curl -X GET "https://notebook-recall.vercel.app/api/collections/COLLECTION_ID/sources" \
  -H "Authorization: Bearer rn_YOUR_API_KEY_HERE"

# Semantic search
curl -X POST "https://notebook-recall.vercel.app/api/collections/COLLECTION_ID/search" \
  -H "Authorization: Bearer rn_YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"query": "business strategy", "max_results": 10}'
```

### 3. Test Full Integration with Persimmon Labs

#### Prerequisites:
- Persimmon Labs integration is already implemented (completed in Phase 1)
- User has Recall Notebook API key

#### Steps:

1. **In Persimmon Labs:**
   - Go to Settings or Business Management
   - Find "Recall Notebook Integration" section
   - Enter your Recall Notebook API key (`rn_...`)
   - Click "Save" or "Connect"

2. **Link Collection to Business:**
   - Go to your business details page
   - Click "Link Knowledge Base" or similar button
   - Select collection from dropdown (fetched via API)
   - Click "Link Collection"

3. **Generate Brand Kit:**
   - Create or edit a business
   - Generate brand kit
   - The system will automatically:
     - Fetch knowledge from linked collections
     - Build context from sources and summaries
     - Enhance AI prompts with business knowledge
     - Generate smarter brand assets

4. **Verify Knowledge is Being Used:**
   - Check generated brand kit for context-aware content
   - Logo concepts should reflect business specifics
   - Color palette should align with industry/brand
   - Taglines should incorporate business insights

---

## API Response Formats

### All Collections
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Business Research",
      "description": "Market analysis and competitor research",
      "is_public": false,
      "collection_type": "reading_list",
      "source_count": 15,
      "created_at": "2025-01-07T10:00:00Z"
    }
  ]
}
```

### Collection Details
```json
{
  "collection": {
    "id": "uuid",
    "name": "My Business Research",
    "description": "Market analysis",
    "sources": [
      {
        "id": "uuid",
        "title": "Industry Report 2024",
        "content_type": "pdf",
        "summaries": [
          { "summary_text": "Key insights..." }
        ],
        "tags": [
          { "tag_name": "market-analysis" }
        ],
        "note": "Important for Q2 strategy",
        "added_at": "2025-01-05T14:30:00Z"
      }
    ]
  }
}
```

### Search Results
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "The market shows strong growth...",
      "content_type": "summary",
      "source_id": "uuid",
      "source_title": "Industry Report 2024",
      "relevance_score": 0.87
    }
  ]
}
```

---

## Security Considerations

### ✅ Implemented:
1. **API Key Hashing:** Keys are hashed with SHA-256, never stored in plain text
2. **Prefix Display:** Only first 12 characters shown in UI
3. **RLS Policies:** Users can only access their own keys
4. **Service Role Isolation:** API key validation uses service role client to bypass RLS safely
5. **Rate Limiting:** All endpoints have rate limiting (SEARCH or DATA_MODIFICATION limits)
6. **Expiration Support:** Keys can auto-expire
7. **Revocation:** Users can delete keys anytime
8. **Last Used Tracking:** Monitor suspicious activity

### 🔒 Best Practices:
- Never commit API keys to git
- Rotate keys periodically
- Use expiration dates for temporary integrations
- Delete keys when integration is disconnected
- Monitor last_used_at for suspicious activity

---

## Troubleshooting

### API Key Not Working

**Symptoms:** 401 Unauthorized when using API key

**Solutions:**
1. Check key format starts with `rn_`
2. Verify key is active: `SELECT is_active FROM api_keys WHERE key_prefix = 'rn_...'`
3. Check expiration: `SELECT expires_at FROM api_keys WHERE key_prefix = 'rn_...'`
4. Ensure using `Bearer` auth: `Authorization: Bearer rn_...`

### Migration Fails

**Error: "relation api_keys already exists"**
- Migration already applied, skip it

**Error: "permission denied"**
- Run as database owner or admin
- In Supabase dashboard, you should have full permissions

### Rate Limiting Issues

**Error: "Too many requests"**
- Wait for rate limit to reset (shown in error message)
- Increase rate limits in `src/lib/rate-limiter.ts` if needed

### Collection Not Found

**Error: 404 Collection not found**
- Verify collection ID is correct
- Check collection belongs to API key owner
- If public collection, verify `is_public = true`

---

## Next Steps

### For User:

1. **Run Migration:**
   - Apply `20250107_api_keys.sql` to Supabase database
   - Verify table exists and RLS is enabled

2. **Test API Key Generation:**
   - Go to Recall Notebook settings
   - Create test API key
   - Copy and save securely

3. **Test API Endpoints:**
   - Use cURL or Postman to test all endpoints
   - Verify authentication works
   - Check rate limiting

4. **Test Full Integration:**
   - Generate API key in Recall Notebook
   - Enter key in Persimmon Labs
   - Link collection to business
   - Generate brand kit with knowledge

5. **Deploy to Production:**
   - Push recall-notebook changes to Vercel
   - Verify environment variables are set
   - Test in production environment

### Optional Enhancements:

1. **Add API Usage Analytics:**
   - Track API calls per key
   - Monitor bandwidth usage
   - Alert on unusual patterns

2. **Add Webhook Support:**
   - Notify Persimmon when collections update
   - Real-time knowledge sync

3. **Add Permissions Granularity:**
   - Read-only vs read-write keys
   - Collection-specific keys
   - Scoped permissions

4. **Add API Documentation:**
   - OpenAPI/Swagger spec
   - Interactive API explorer
   - Code examples in multiple languages

---

## Files Changed Summary

### Recall Notebook (8 files):

**New Files:**
1. `src/lib/api-auth.ts` - Authentication middleware
2. `src/app/api/api-keys/route.ts` - Key management
3. `src/app/api/api-keys/[id]/route.ts` - Key deletion
4. `src/app/api/collections/[id]/search/route.ts` - Semantic search
5. `supabase/migrations/20250107_api_keys.sql` - Database schema

**Modified Files:**
1. `src/app/api/collections/route.ts` - Added API key auth
2. `src/app/api/collections/[id]/route.ts` - Added API key auth
3. `src/app/api/collections/[id]/sources/route.ts` - Added GET method + API key auth
4. `src/app/settings/page.tsx` - Added API key management UI

### Persimmon Labs (Already completed in Phase 1):

**New Files:**
- Database schema with 3 tables
- Type definitions
- 3 service layers
- 4 API routes
- 2 UI components

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Persimmon Labs                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  User enters Recall Notebook API key                  │  │
│  │  (Settings or Business Management)                    │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API key stored encrypted in Supabase                 │  │
│  │  (recall_api_keys table)                              │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  User links Recall collection to Business             │  │
│  │  (business_collections table)                         │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  On brand kit generation:                             │  │
│  │  1. Fetch API key from database                       │  │
│  │  2. Call Recall Notebook API with Bearer token        │  │
│  │  3. Get collection sources & summaries                │  │
│  │  4. Build knowledge context                           │  │
│  │  5. Enhance AI prompts with knowledge                 │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ HTTPS + Bearer Token
                        │ Authorization: Bearer rn_xxx...
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Recall Notebook                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Authentication Middleware                        │  │
│  │  (api-auth.ts)                                        │  │
│  │  - Extracts Bearer token                              │  │
│  │  - Hashes with SHA-256                                │  │
│  │  - Queries api_keys table (service role)             │  │
│  │  - Verifies active & not expired                      │  │
│  │  - Returns userId                                     │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Endpoints (with RLS)                             │  │
│  │  - GET /api/collections                               │  │
│  │  - GET /api/collections/:id                           │  │
│  │  - GET /api/collections/:id/sources                   │  │
│  │  - POST /api/collections/:id/search                   │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Supabase Database                                    │  │
│  │  - collections (with RLS)                             │  │
│  │  - sources (with RLS)                                 │  │
│  │  - summaries (with vector embeddings)                │  │
│  │  - tags                                               │  │
│  │  - api_keys (hashed, with RLS)                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Criteria ✅

- [x] API key generation with secure hashing
- [x] API key management UI in settings
- [x] GET /api/collections with API key auth
- [x] GET /api/collections/:id with API key auth
- [x] GET /api/collections/:id/sources (NEW)
- [x] POST /api/collections/:id/search (NEW)
- [x] Database migration created
- [x] RLS policies implemented
- [x] Rate limiting on all endpoints
- [x] Error handling comprehensive
- [x] Documentation complete

---

## Contact & Support

If issues arise:
1. Check this documentation first
2. Review error messages in console
3. Verify environment variables
4. Check Supabase logs
5. Test API endpoints with cURL

---

**Integration Status:** ✅ COMPLETE - Ready for deployment and testing

**Last Updated:** 2025-01-07
**Version:** 1.0.0
