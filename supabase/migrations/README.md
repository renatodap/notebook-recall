# Database Migrations

## Current Migration to Run

**File:** `20250102000000_add_vector_search.sql`

**Status:** ✅ SAFE to run on existing schema

### What This Migration Does:

1. **Enables pgvector extension** - Required for semantic search
2. **Adds `match_summaries` function** - Critical fix that adds `p_user_id` parameter for user isolation
3. **Adds ON DELETE CASCADE** - Ensures related records are deleted when source is deleted
4. **Adds unique constraint to tags** - Prevents duplicate tags on same source
5. **Creates indexes** - Improves query performance
6. **Creates vector index** - Enables fast similarity search (only if embeddings exist)
7. **Enables Row Level Security** - Ensures users only see their own data
8. **Creates RLS policies** - Enforces user isolation at database level

### How to Run:

#### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Click **SQL Editor** in sidebar
3. Create new query
4. Copy entire contents of `20250102000000_add_vector_search.sql`
5. Paste into editor
6. Click **Run**
7. Check for success message (should see "Success. No rows returned")

#### Option 2: Supabase CLI

```bash
cd recall-notebook
npx supabase db push
```

### Verification:

After running, verify with these queries:

```sql
-- 1. Check pgvector is enabled
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
-- Expected: 1 row with 'vector'

-- 2. Check match_summaries function exists with 4 parameters
SELECT p.proname, p.pronargs
FROM pg_proc p
WHERE p.proname = 'match_summaries';
-- Expected: 1 row with proname='match_summaries', pronargs=4

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sources', 'summaries', 'tags');
-- Expected: 3 rows, all with rowsecurity=true

-- 4. Check unique constraint on tags
SELECT conname
FROM pg_constraint
WHERE conname = 'tags_source_id_tag_name_key';
-- Expected: 1 row

-- 5. Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sources', 'summaries', 'tags')
ORDER BY indexname;
-- Expected: Multiple rows including idx_summaries_embedding (if you have embeddings)
```

### What If Migration Fails?

**Error: "relation X already exists"**
- This shouldn't happen with this migration (we use IF NOT EXISTS)
- If it does, the migration is already applied

**Error: "extension vector does not exist"**
- Enable pgvector in Supabase dashboard: Database → Extensions → Enable "vector"
- Re-run migration

**Error: "constraint X already exists"**
- Good! This means constraint is already in place
- Migration will skip it and continue

**Error: "permission denied"**
- Ensure you're running as database owner
- In Supabase, you should have full permissions

### Old Migration File

`20250101000000_initial_schema.sql` - This was for creating schema from scratch. **Do NOT run this if you have existing tables.** Use the new migration instead.

---

## After Migration Checklist:

- [ ] Migration ran without errors
- [ ] Verification queries all return expected results
- [ ] `match_summaries` function has 4 parameters (not 3)
- [ ] RLS is enabled on all 3 tables
- [ ] Vector index exists (or will be created when first embedding is added)

Once all checkboxes are ✅, you're ready to deploy!
