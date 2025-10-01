# Fix Vercel 404 Error

## Problem
Your Vercel deployment shows 404 because it's trying to build without environment variables, causing the build to fail.

## Solution

### Step 1: Add Environment Variables to Vercel

1. Go to: https://vercel.com/renatodaps-projects/notebook-recall/settings/environment-variables

2. Add these variables for **Production, Preview, and Development**:

```
NEXT_PUBLIC_SUPABASE_URL
(your Supabase project URL)

NEXT_PUBLIC_SUPABASE_ANON_KEY
(your NEW rotated anon key)

SUPABASE_SERVICE_ROLE_KEY
(your NEW rotated service role key)

ANTHROPIC_API_KEY
(your NEW rotated Anthropic key)

NEXT_PUBLIC_APP_URL
https://notebook-recall.vercel.app
```

### Step 2: Redeploy

After adding all env vars:

**Option A: Through Dashboard**
1. Go to: https://vercel.com/renatodaps-projects/notebook-recall/deployments
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Check "Use existing build cache" (optional)
5. Click "Redeploy"

**Option B: Push to GitHub**
```bash
cd recall-notebook
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

### Step 3: Monitor Build

1. Watch the build logs: https://vercel.com/renatodaps-projects/notebook-recall
2. Look for "Build Logs" tab
3. Verify it completes successfully
4. Visit https://notebook-recall.vercel.app

## Expected Result

✅ Build completes successfully
✅ Website loads (landing page)
✅ Can navigate to /login and /signup
✅ Authentication works
✅ Dashboard loads after login

## If Still Getting 404

### Check Build Logs for:
- Missing environment variables errors
- TypeScript compilation errors
- Database connection errors during build

### Common Issues:

**"Missing NEXT_PUBLIC_SUPABASE_URL"**
→ Env vars not added or not selected for the right environments

**"Error occurred prerendering page"**
→ This is expected for /dashboard - it should be dynamic
→ Check if `export const dynamic = 'force-dynamic'` is in dashboard/page.tsx

**Build succeeds but 404 on all routes**
→ May need to adjust output configuration

## Alternative: Disable Problematic Pages Temporarily

If you just want to get it working quickly, we can make all pages client-side:

```bash
# I can modify the pages to be fully client-rendered if needed
```

## What You Should See

When working correctly:
- https://notebook-recall.vercel.app → Landing page with "Get Started" button
- https://notebook-recall.vercel.app/login → Login form
- https://notebook-recall.vercel.app/signup → Signup form

---

**Let me know what you see in the Vercel build logs and I can help debug further!**
