# Phase 2: Time-to-Value Acceleration

## Goal
Get users from signup to first insight in **< 3 minutes** with a guided onboarding flow that delivers immediate value.

---

## The 3-Minute Success Story

**Minute 0:00** - User signs up
**Minute 0:30** - Welcome screen explains value
**Minute 1:00** - Demo data seeded (3 sample sources with summaries)
**Minute 1:30** - User performs first search query and finds results
**Minute 2:30** - Success screen celebrates first insight
**Minute 3:00** - User lands on dashboard ready to add their own content

---

## Onboarding Flow Design

### Step 1: Welcome (30 seconds)
**Goal**: Orient user, set expectations

```
┌─────────────────────────────────────────────┐
│  ✨ Welcome to Recall Notebook              │
│                                             │
│  You're 3 minutes away from your first     │
│  AI-powered insight.                        │
│                                             │
│  Here's what we'll do:                      │
│  1. Add sample knowledge to explore         │
│  2. Try your first search                   │
│  3. See AI at work                          │
│                                             │
│         [Let's Go →]  [Skip Tutorial]       │
└─────────────────────────────────────────────┘
```

**UI Components**:
- Large Sparkles icon
- Clear timeline (1-2-3 steps)
- Primary CTA: "Let's Go"
- Secondary: "Skip Tutorial" (goes to dashboard)
- Progress indicator: Step 1 of 4

---

### Step 2: Demo Data (30 seconds)
**Goal**: Instant content without friction

```
┌─────────────────────────────────────────────┐
│  📚 Setting up your knowledge base...       │
│                                             │
│  We're adding 3 sample articles:           │
│  ✓ "Introduction to AI" (Technology)       │
│  ✓ "Productivity Habits" (Self-Improvement)│
│  ✓ "Climate Change Overview" (Science)     │
│                                             │
│  [▓▓▓▓▓▓▓▓░░] 80%                          │
│                                             │
│  Each comes with an AI summary so you can  │
│  search immediately.                        │
└─────────────────────────────────────────────┘
```

**Backend**: Seed 3 sources with pre-generated summaries and embeddings
- Source 1: Tech article (500 words)
- Source 2: Productivity article (500 words)
- Source 3: Science article (500 words)

**Auto-advances** when seeding complete (no button needed)

---

### Step 3: First Query (60 seconds)
**Goal**: User experiences semantic search

```
┌─────────────────────────────────────────────┐
│  🔍 Try your first search                   │
│                                             │
│  Ask a question in plain English:           │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ What are good productivity habits?    │ │
│  └───────────────────────────────────────┘ │
│                 [Search]                    │
│                                             │
│  💡 Suggested searches:                     │
│  • "How does AI work?"                      │
│  • "Climate change impacts"                 │
│  • "Time management tips"                   │
│                                             │
│         [Try It →]  [← Back]                │
└─────────────────────────────────────────────┘
```

**Smart behavior**:
- Pre-filled with example query
- Suggested searches clickable (1-click)
- Real semantic search on demo data
- Shows 1-2 relevant results with AI summaries

---

### Step 4: Success (30 seconds)
**Goal**: Celebrate, guide next steps

```
┌─────────────────────────────────────────────┐
│  🎉 You did it!                             │
│                                             │
│  You just experienced AI-powered search.    │
│  Here's what happened:                      │
│                                             │
│  ✓ Found 2 sources matching your question  │
│  ✓ AI summarized key points                │
│  ✓ All in < 3 seconds                       │
│                                             │
│  Ready to add your own content?             │
│                                             │
│  [Add My First Source]  [Explore Demo Data] │
└─────────────────────────────────────────────┘
```

**Next actions**:
- Primary CTA: "Add My First Source" → `/add` page
- Secondary: "Explore Demo Data" → Dashboard with demo sources
- Confetti animation or subtle celebration

---

## Quick Wins Tracker

Track and celebrate user milestones:

```typescript
interface QuickWin {
  id: string
  title: string
  description: string
  completed: boolean
  completedAt?: Date
  order: number
}

const QUICK_WINS = [
  {
    id: 'first_source',
    title: 'Add your first source',
    description: 'Capture your first piece of knowledge',
    order: 1
  },
  {
    id: 'first_search',
    title: 'Perform a search',
    description: 'Find something with natural language',
    order: 2
  },
  {
    id: 'five_sources',
    title: 'Collect 5 sources',
    description: 'Build your knowledge base',
    order: 3
  },
  {
    id: 'first_synthesis',
    title: 'Generate a synthesis report',
    description: 'See AI connect ideas across sources',
    order: 4
  },
  {
    id: 'first_collection',
    title: 'Create a collection',
    description: 'Organize related sources together',
    order: 5
  }
]
```

**Display**:
- Progress bar: "3 of 5 milestones completed"
- Checklist in dashboard sidebar or collapsible panel
- Toast notifications when milestones achieved
- Subtle animations (check mark, confetti)

---

## Smart Content Ingestion

### Auto-Detection Logic

```typescript
function detectContentType(input: string): ContentType {
  // URL detection
  if (/^https?:\/\/.+/.test(input)) {
    return 'url'
  }

  // File upload
  if (input instanceof File) {
    if (input.type === 'application/pdf') return 'pdf'
    if (input.type.startsWith('image/')) return 'image'
  }

  // Long-form text
  if (input.length > 200) {
    return 'text'
  }

  // Short note
  return 'note'
}
```

**UI Feedback**:
- As user types, show detected type
- Suggest title based on content
- Show appropriate form fields

Example:
```
┌─────────────────────────────────────────────┐
│  Paste content or URL:                      │
│  ┌───────────────────────────────────────┐ │
│  │ https://example.com/article           │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ✨ Detected: URL                           │
│  💡 Suggested title: "Article - Example"   │
│                                             │
│  [Process with AI]                          │
└─────────────────────────────────────────────┘
```

---

## Contextual Empty States

### Dashboard (0 sources)
```tsx
<EmptyState
  icon={<FileText className="h-16 w-16" />}
  title="Your knowledge base is empty"
  description="Add your first source to get started. Try pasting a URL, uploading a PDF, or writing a note."
  primaryAction={{
    label: "Add Your First Source",
    href: "/add"
  }}
  secondaryAction={{
    label: "See How It Works",
    onClick: () => startOnboarding()
  }}
/>
```

### Search (no results)
```tsx
<EmptyState
  icon={<Search className="h-16 w-16" />}
  title="No results found"
  description="Try a different search term, or add more sources to your knowledge base."
  primaryAction={{
    label: "Add More Sources",
    href: "/add"
  }}
  suggestions={[
    "Use simpler keywords",
    "Try synonyms or related terms",
    "Check for typos"
  ]}
/>
```

### Collections (no collections)
```tsx
<EmptyState
  icon={<FolderOpen className="h-16 w-16" />}
  title="No collections yet"
  description="Collections help you organize related sources together."
  primaryAction={{
    label: "Create Your First Collection",
    href: "/collections/new"
  }}
/>
```

---

## Implementation Checklist

### Backend
- [ ] Demo data seeding API (`/api/onboarding/seed-demo`)
- [ ] Quick wins tracking table (`user_quick_wins`)
- [ ] Quick wins API endpoints (GET, POST)
- [ ] Content type detection utility
- [ ] Auto-title generation from content

### Frontend
- [ ] Onboarding page (`/onboarding`)
- [ ] 4-step flow components (Welcome, Demo, Search, Success)
- [ ] Progress indicator component
- [ ] Quick wins tracker component
- [ ] Smart content ingestion in `/add` page
- [ ] Contextual empty states for all pages
- [ ] Celebration animations (confetti, check marks)

### UX
- [ ] Smooth transitions between steps
- [ ] Loading states for demo data seeding
- [ ] Error handling (what if seeding fails?)
- [ ] Skip tutorial option
- [ ] Progress persistence (if user closes browser)

### Testing
- [ ] E2E onboarding flow (Playwright)
- [ ] Quick wins tracking accuracy
- [ ] Content type detection edge cases
- [ ] Empty state display logic

---

## Success Metrics

**Primary**: Time to first insight
- Target: < 3 minutes from signup
- Measure: Analytics event tracking

**Secondary**:
- Onboarding completion rate (target: >80%)
- Quick wins completion rate (target: >60% complete 3+ wins)
- Demo data retention (do users keep or delete demo sources?)

**User Feedback**:
- "Was the onboarding helpful?" (thumbs up/down)
- "What would make this better?" (optional text)

---

## Edge Cases

1. **User already has sources**: Skip onboarding, show dashboard
2. **User skips tutorial**: Mark as skipped, don't show again
3. **Demo seeding fails**: Show error, offer retry
4. **User closes browser mid-onboarding**: Resume from last step
5. **User wants to restart onboarding**: Settings > "Restart Tutorial"

---

## Next Phase Preview

**Phase 3**: Calm & Adaptive Interfaces
- Skeleton loaders
- Micro-interactions
- Progressive disclosure
- Contextual help tooltips
