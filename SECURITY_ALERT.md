# 🚨 CRITICAL SECURITY ALERT

## Your API Keys Were Exposed on GitHub!

Your credentials were committed to GitHub for approximately **1 minute** before being removed.

## ⚠️ IMMEDIATE ACTION REQUIRED

### 1. Rotate Supabase Keys

**Go to Supabase Dashboard:**
https://supabase.com/dashboard/project/ptdphysuhuqplisuhnqa/settings/api

**Click "Reset" on both:**
- ✅ `anon` / `public` key
- ✅ `service_role` key

**Update `.env.local` with new keys**

### 2. Rotate Anthropic API Key

**Go to Anthropic Console:**
https://console.anthropic.com/settings/keys

**Steps:**
1. Delete the exposed key: `sk-ant-api03-wobq7...`
2. Create a new API key
3. Update `.env.local` with new key

### 3. Check for Unauthorized Access

**Supabase:**
- Go to Logs: https://supabase.com/dashboard/project/ptdphysuhuqplisuhnqa/logs
- Look for suspicious activity in the last hour

**Anthropic:**
- Check usage: https://console.anthropic.com/settings/usage
- Look for unexpected API calls

### 4. Fix Vercel Deployment

Your Vercel deployment at `notebook-recall.vercel.app` is showing a 404 error because it doesn't have the correct environment variables.

**Fix it:**
1. Go to: https://vercel.com/renatodaps-projects/notebook-recall/settings/environment-variables
2. Delete ALL existing environment variables
3. Add NEW variables with your ROTATED keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ANTHROPIC_API_KEY
   NEXT_PUBLIC_APP_URL (set to your Vercel domain)
   ```
4. Redeploy: https://vercel.com/renatodaps-projects/notebook-recall

## What Happened?

1. ✅ Your credentials were in `.env.example` (should only have placeholders)
2. ❌ These were committed and pushed to public GitHub repo
3. ✅ I detected this and removed them immediately
4. ✅ Git history was rewritten (force pushed)

## Current Status

✅ **GitHub is now clean** - no credentials in repo
✅ **`.env.local` is ignored** - your local keys are safe
❌ **Old keys are COMPROMISED** - must be rotated
❌ **Vercel deployment broken** - needs new env vars

## Why You Must Rotate

Even though the keys were only exposed for ~1 minute:
- GitHub's public API could have been scraped
- Bad actors monitor for exposed secrets
- Better safe than sorry - rotation is quick and easy

## Checklist

- [ ] Rotate Supabase anon key
- [ ] Rotate Supabase service_role key
- [ ] Rotate Anthropic API key
- [ ] Update `.env.local` with new keys
- [ ] Add new keys to Vercel
- [ ] Redeploy on Vercel
- [ ] Verify no unauthorized Supabase/Anthropic usage
- [ ] Test local app with new keys
- [ ] Delete this file once complete

## Questions?

If you see suspicious activity or need help rotating keys, let me know immediately.

---

**Take these steps NOW before continuing with development.** 🔒
