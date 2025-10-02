# How to See the New PARA Dashboard UI

## After Login

1. **Log in** to your account at `/login`
2. **Navigate to** `/para` route

You can access it by:
- Typing the URL directly: `https://your-app.vercel.app/para`
- Clicking the PARA link in your navigation menu (if available)

## What You'll See

**The new Ideal PARA Dashboard includes:**

✅ **Horizontal navigation bar** at the top
- 🎯 Projects (Indigo)
- 🌳 Areas (Green)
- 💎 Resources (Purple)
- 📦 Archive (Gray)
- Quick action buttons: 🔍 Search, 🕸️ Graph

✅ **Left sidebar** with:
- Semantic search input (debounced)
- Tag filtering (multi-select checkboxes)
- Clear filters button

✅ **Main content area** with:
- Enhanced knowledge cards showing:
  - Content type icons (📝 📄 🔗 📋 🖼️)
  - AI-generated summaries
  - Key topics (auto-tagged)
  - Key actions extracted by AI
  - Pin button (📍) - hover to see
  - Link button (🔗) - hover to see
  - Metadata (word count, tags, connections)
- Grid/List view toggle
- Sort options (Recent, Relevant, Alphabetical)

✅ **Spotlight command palette**
- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- Universal search with real-time results
- Quick actions (Add source, Search, Graph, PARA)
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)

✅ **Knowledge graph** (optional)
- Click "Graph" button to toggle
- Interactive canvas visualization
- Click nodes to navigate to sources
- Color-coded by PARA category

## Navigation Structure

```
After Login → Dashboard shows:
├── /dashboard    (Default: Shows all sources with filters)
├── /para         (NEW IDEAL DASHBOARD - GO HERE!)
├── /search       (Semantic search page)
├── /graph        (Knowledge graph page)
└── /add          (Add new source)
```

## If You Don't See It

**Common issues:**

1. **Wrong route**: Make sure you're at `/para` not `/dashboard`
2. **Cache**: Hard refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **Build not deployed**: Check Vercel deployment status

## Default Landing After Login

Currently, logging in takes you to `/dashboard` (the sources list).

To see the **new PARA dashboard**, manually navigate to `/para` or update your app's default route.

### To Make `/para` the Default Landing Page

Edit your middleware or login redirect:

```typescript
// Example: In your login handler or middleware
if (user) {
  redirect('/para') // Instead of '/dashboard'
}
```

## Testing Checklist

After navigating to `/para`, verify:

- [ ] Horizontal PARA tabs are visible and clickable
- [ ] Clicking tabs switches categories
- [ ] Sources load with AI summaries and tags
- [ ] Hovering over cards shows quick action buttons
- [ ] Pin button (📍) works when clicked
- [ ] Search input filters sources in real-time
- [ ] Tag checkboxes filter sources correctly
- [ ] Press Cmd+K or Ctrl+K opens Spotlight
- [ ] Graph toggle button shows/hides visualization
- [ ] Grid/List view toggle works
- [ ] Sort dropdown changes order

## Quick Demo Flow

1. Log in
2. Navigate to `/para`
3. Click "Projects" tab
4. Hover over a source card → see quick actions
5. Click 📍 to pin (should stay pinned on refresh)
6. Type in search box → sources filter
7. Check a tag → sources filter by tag
8. Press Cmd+K → Spotlight opens
9. Type to search → see results
10. Click "Graph" → see connections

---

**Status**: ✅ Deployed and ready at `/para` route

**Commit**: `82f795d` - IdealPARADashboard activated

Navigate to `/para` to see it! 🚀
