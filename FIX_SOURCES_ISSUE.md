# 🔧 FIX: Dashboard Shows 0 Sources & Collections 404 Error

## ❌ Root Cause Identified

**CRITICAL ISSUE**: Your Supabase database does **NOT** have the required tables (`sources`, `summaries`, `tags`, `collections`)!

The database schema you provided shows tables for a completely different app (activities, meal_logs, workouts, etc.), which suggests:
1. You're connected to the **wrong Supabase project**, OR
2. You haven't run the migrations to create the necessary tables

## 🔍 What I Found

### Current Database Has:
- `activities`, `meal_logs`, `body_measurements`, `workouts` (fitness tracking app)
- No `sources`, `summaries`, or `tags` tables

### What Recall Notebook Needs:
- `sources` - stores your content (articles, PDFs, notes)
- `summaries` - stores AI-generated summaries
- `tags` - stores tags for organization
- `collections` - stores collections to organize sources
- `collection_sources` - links sources to collections

## ✅ THE FIX

### Step 1: Verify Your Supabase Project

1. Check your `.env.local` file
2. Verify `NEXT_PUBLIC_SUPABASE_URL` points to the correct project
3. Make sure it's the **recall-notebook** project, not a fitness app project

**To check:**
```bash
# Open your .env.local and look for:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
```

### Step 2: Run the Migrations to Create Tables

I've created TWO migration files:
1. **`supabase/migrations/0001_setup_sources_tables.sql`** - Creates sources, summaries, tags
2. **`supabase/migrations/0002_setup_collections.sql`** - Creates collections, collection_sources

#### Option A: Using Supabase Dashboard (Easiest)

**Run Migration 1: Sources Tables**
1. Go to https://app.supabase.com
2. Select your **recall-notebook** project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open `supabase/migrations/0001_setup_sources_tables.sql`
6. Copy the ENTIRE contents
7. Paste into the SQL Editor
8. Click **RUN** (or press Ctrl/Cmd + Enter)
9. You should see: ✅ "Success. No rows returned"

**Run Migration 2: Collections Tables**
1. Click **New query** again
2. Open `supabase/migrations/0002_setup_collections.sql`
3. Copy the ENTIRE contents
4. Paste into the SQL Editor
5. Click **RUN**
6. You should see: ✅ "Success. No rows returned"

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you don't have it
npm install -g supabase

# Login
npx supabase login

# Link your project (you'll need your project ref)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
npx supabase db push
```

### Step 3: Verify Tables Were Created

Run this in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sources', 'summaries', 'tags', 'collections', 'collection_sources');

-- Should return 5 rows: sources, summaries, tags, collections, collection_sources
```

### Step 4: Verify RLS Policies

Run this in Supabase SQL Editor:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sources', 'summaries', 'tags', 'collections', 'collection_sources');

-- All 5 tables should have rowsecurity = true
```

### Step 5: Test Creating a Source

1. Go to http://localhost:3000/add
2. Paste some text (e.g., "This is a test note about AI and machine learning")
3. Click **Add to Library**
4. Check the browser console (F12) for any errors
5. You should see the success message and redirect to /dashboard
6. Dashboard should now show 1 source

### Step 6: Test Creating a Collection

1. Go to http://localhost:3000/collections
2. Click **New Collection**
3. Enter a name (e.g., "AI Research")
4. Click **Create Collection**
5. You should be redirected to /collections
6. Your new collection should appear

## 🐛 Debugging Tips

### If You Still See 0 Sources:

1. **Check Browser Console (F12)**
   - Look for red errors
   - Check Network tab for failed API calls
   - Look for 401 (auth error) or 500 (server error)

2. **Check Server Logs**
   ```bash
   npm run dev
   ```
   - Look for errors when creating a source
   - I've added detailed error logging to help identify issues

3. **Verify Authentication**
   - Make sure you're logged in
   - Try logging out and back in
   - Check cookies in DevTools

4. **Check API Response**
   - Open DevTools → Network tab
   - Create a source
   - Look for POST to `/api/sources`
   - Click on it → Response tab
   - Check for error messages

### Common Error Messages:

| Error | Cause | Fix |
|-------|-------|-----|
| `relation "sources" does not exist` | Tables not created | Run Step 2 migration |
| `new row violates row-level security policy` | RLS blocking insert | Check you're authenticated as the user |
| `undefined reading 'embedding'` | Embedding generation failed | Check OPENAI_API_KEY in .env.local |
| `Failed to create source: permission denied` | RLS policies not correct | Re-run migration Step 2 |

## 📝 What I Changed in Your Code

1. **Improved error handling in API route** (`src/app/api/sources/route.ts`)
   - Now logs detailed error info
   - Returns actual error messages instead of generic "Failed to create source"

2. **Improved error display in UI** (`src/app/add/page.tsx`)
   - Now shows the actual error from the API
   - Logs errors to console for debugging

3. **Created migration files**:
   - `0001_setup_sources_tables.sql` - Creates `sources`, `summaries`, `tags` tables with RLS
   - `0002_setup_collections.sql` - Creates `collections`, `collection_sources` tables with RLS
   - Enables RLS (Row-Level Security)
   - Creates policies so users only see their own data
   - Adds indexes for performance
   - Enables pgvector extension for semantic search

4. **Created /collections/new page** (`src/app/collections/new/page.tsx`)
   - Form to create new collections
   - Name, description, and public/private toggle
   - Proper error handling and loading states

## ✅ Success Criteria

After following these steps, you should:
- ✅ See all 5 tables in Supabase Dashboard → Database → Tables
- ✅ Be able to create a source via /add page
- ✅ See sources on /dashboard
- ✅ Be able to create a collection via /collections/new
- ✅ See collections on /collections page
- ✅ Search working on /search page
- ✅ No errors in browser console
- ✅ No 404 errors when navigating

## 🆘 Still Not Working?

If you've followed all steps and it's still not working:

1. **Share the error message from:**
   - Browser console (F12)
   - Network tab → POST /api/sources → Response
   - Terminal where `npm run dev` is running

2. **Run this diagnostic query:**
   ```sql
   -- In Supabase SQL Editor
   SELECT
     t.table_name,
     t.table_type,
     c.column_name,
     c.data_type,
     rls.rowsecurity
   FROM information_schema.tables t
   LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
   LEFT JOIN pg_tables rls ON t.table_name = rls.tablename
   WHERE t.table_schema = 'public'
     AND t.table_name IN ('sources', 'summaries', 'tags')
   ORDER BY t.table_name, c.ordinal_position;
   ```

3. **Check if you're on the right project:**
   - What's your Supabase project URL?
   - Does the project name match "recall-notebook"?

---

**Next Steps:** Run Step 2 (the migration) and let me know if you see any errors!
