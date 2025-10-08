# Repository Separation Guide

This guide walks you through separating the Python FastAPI backend into its own repository.

## Why Separate?

✅ **Backend is a standalone knowledge API** for RAG agents (not just UI support)
✅ **Independent deployment**: Railway (backend) vs Vercel (frontend)
✅ **Zero code sharing**: Python vs TypeScript
✅ **Better discoverability**: Developers can find and integrate the API
✅ **Cleaner development**: Backend devs don't need Node, frontend devs don't need Python

---

## Step-by-Step Instructions

### Phase 1: Create New Repository on GitHub

1. **Go to GitHub** and create a new repository:
   - Name: `recall-notebook-api` (recommended) or `recall-knowledge-api`
   - Description: "FastAPI backend for Recall Notebook - AI-powered knowledge management API for RAG agents"
   - Visibility: Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license (we'll move existing files)

2. **Copy the repository URL** (you'll need it in the next step)
   - Example: `https://github.com/yourusername/recall-notebook-api.git`

---

### Phase 2: Extract Backend with Git History

Open a terminal and run these commands:

```bash
# Navigate to your current project
cd C:\Users\pradord\Documents\Projects\recall-notebook

# Create a new branch with only backend history
git subtree split -P backend -b backend-only

# Create a new directory for the API repo
cd ..
git clone https://github.com/yourusername/recall-notebook-api.git
cd recall-notebook-api

# Pull the backend history
git pull ../recall-notebook backend-only

# Remove the temporary branch from original repo
cd ../recall-notebook
git branch -D backend-only
```

**What this does:**
- Extracts `backend/` directory with full git history
- New repo will have commits like "feat(backend): migrate API to Python"
- Preserves authorship and timestamps

---

### Phase 3: Clean Up Backend Repository

```bash
cd ../recall-notebook-api

# Move everything from backend/ to root
# (Files are already in root after git subtree split)

# Verify structure
ls -la
# Should see: app/, docs/, migrations/, tests/, pyproject.toml, etc.

# Remove migration summary (no longer needed in standalone repo)
rm MIGRATION_SUMMARY.md

# Commit the cleanup
git add .
git commit -m "chore: Clean up for standalone repository

- Remove migration summary (no longer needed)
- Backend is now standalone API repository"

# Push to GitHub
git push origin main
```

---

### Phase 4: Update Backend README

The backend README needs to be API-focused (not monorepo-focused). I'll update this file in the next step.

---

### Phase 5: Update Railway Deployment

1. **Go to Railway dashboard**
2. **Disconnect** the current deployment (if connected to recall-notebook)
3. **Create new project** or **update existing**:
   - Repository: `recall-notebook-api`
   - Root directory: `.` (root, not `backend/`)
   - Build command: `poetry install`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Set environment variables** (same as before):
   ```
   SUPABASE_URL=xxx
   SUPABASE_KEY=xxx
   SUPABASE_SERVICE_KEY=xxx
   ANTHROPIC_API_KEY=xxx
   GOOGLE_GEMINI_API_KEY=xxx
   OPENAI_API_KEY=xxx
   JWT_SECRET=xxx
   WEBHOOK_SECRET=xxx
   REDIS_URL=xxx
   ENVIRONMENT=production
   ```

5. **Deploy** and verify health check: `https://your-app.railway.app/health`

---

### Phase 6: Run Database Migration (Webhooks)

In Supabase SQL Editor, run:

```sql
-- Run migrations/001_webhooks.sql
-- (Copy contents from recall-notebook-api/migrations/001_webhooks.sql)
```

---

### Phase 7: Update Frontend to Reference New API

In `recall-notebook` repo:

1. **Update environment variables** (if needed):
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=https://your-app.railway.app
   # or for local development:
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. **Update README.md** to link to API repo:
   ```markdown
   ## Backend API

   This frontend uses the [Recall Notebook API](https://github.com/yourusername/recall-notebook-api)
   for knowledge management and RAG functionality.

   - **API Documentation**: See [Agent API Guide](https://github.com/yourusername/recall-notebook-api/blob/main/docs/AGENT_API_GUIDE.md)
   - **API Version**: 1.1.0
   - **Deployment**: Railway

   For local development, run the backend API separately (see API repo README).
   ```

---

### Phase 8: Clean Up Original Repository

In `recall-notebook` repo:

```bash
cd C:\Users\pradord\Documents\Projects\recall-notebook

# Remove backend directory (it's now in separate repo)
rm -rf backend/

# Commit the removal
git add .
git commit -m "refactor: Move backend to separate repository

Backend API is now maintained at:
https://github.com/yourusername/recall-notebook-api

This repo now contains only the Next.js frontend UI."

# Push to GitHub
git push origin main
```

---

### Phase 9: Verify Everything Works

**Backend API:**
1. Visit `https://your-app.railway.app/docs`
2. Verify API documentation loads
3. Test health check: `https://your-app.railway.app/health`

**Frontend UI:**
1. Deploy frontend to Vercel (should auto-deploy on push)
2. Verify UI connects to backend API
3. Test creating a source, searching, etc.

**Agent Integration:**
1. Clone `recall-notebook-api` in a separate directory
2. Follow AGENT_API_GUIDE.md to test integration
3. Verify batch operations and webhooks work

---

## Post-Separation Directory Structure

### recall-notebook (Frontend)
```
recall-notebook/
├── src/
├── public/
├── docs/
├── package.json
├── next.config.ts
├── vercel.json
└── README.md  (UI-focused, links to API)
```

### recall-notebook-api (Backend)
```
recall-notebook-api/
├── app/
│   ├── api/v1/
│   ├── models/
│   ├── services/
│   └── main.py
├── migrations/
├── docs/
│   ├── AGENT_API_GUIDE.md
│   ├── CHANGELOG.md
│   └── examples/
├── tests/
├── pyproject.toml
├── Procfile
├── railway.toml
└── README.md  (API-focused)
```

---

## Benefits Achieved

✅ **Independent Deployment**
- Backend: Railway
- Frontend: Vercel
- Deploy independently without affecting each other

✅ **Cleaner Development**
- Backend devs: `git clone recall-notebook-api`
- Frontend devs: `git clone recall-notebook`
- No mixed tooling

✅ **Better Discoverability**
- Developers searching for "RAG knowledge API" find `recall-notebook-api`
- Clear API documentation and examples

✅ **API Versioning**
- CHANGELOG.md tracks versions
- Can maintain v1 while developing v2
- Breaking changes managed through versions

---

## Troubleshooting

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check Railway deployment is healthy
- Verify CORS is configured in backend (should allow frontend origin)

### Git subtree split fails
- Make sure you're in the root of `recall-notebook` repo
- Ensure `backend/` directory exists
- Try: `git subtree split -P backend/ -b backend-only` (with trailing slash)

### Railway deployment fails
- Verify `Procfile` and `railway.toml` are in repo root
- Check build logs for Python/Poetry errors
- Ensure all environment variables are set

---

## Need Help?

1. Check API documentation: `recall-notebook-api/docs/AGENT_API_GUIDE.md`
2. Check deployment guide: `recall-notebook-api/DEPLOYMENT.md`
3. Review CHANGELOG: `recall-notebook-api/docs/CHANGELOG.md`

---

## Next Steps After Separation

1. ✅ Test API endpoints with Postman or curl
2. ✅ Register a webhook to test real-time events
3. ✅ Try batch operations (embeddings, sources)
4. ✅ Build a RAG agent using the API (see examples/)
5. ✅ Consider open-sourcing the API if helpful to others!

---

**Congratulations!** You now have a clean separation with a professional API repository. 🎉
