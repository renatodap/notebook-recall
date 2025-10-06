# UX Modernization Plan: 2026 AI SaaS Standards

**Goal:** Transform Recall Notebook into an invisible, anticipatory, and trustworthy AI SaaS that delivers value in minutes while feeling calm and consistent.

**Philosophy:** Beautiful because it's legible and hierarchical. Compelling because it proactively helps at the exact right moment. Trusted because AI is transparent and controllable.

---

## Current State Analysis

### ✅ **Strengths**
- Clean, minimal foundation (Tailwind, consistent spacing)
- AI disclaimers present on generated content
- Multiple AI providers for cost optimization
- Semantic search with powerful backend
- Row-level security and privacy-first architecture

### ⚠️ **Friction Points Identified**
1. **Time-to-value:** No guided first-run experience
2. **Cognitive load:** 34 pages, unclear entry points for new users
3. **Proactive value:** Dashboard shows sources but doesn't anticipate needs
4. **AI transparency:** Disclaimers are visible but feel "bolted on" vs. integrated
5. **Visual hierarchy:** Functional but not compelling
6. **Personalization:** Generic experience for all users
7. **Flow disruption:** No inline tooltips, progressive disclosure, or smart defaults

---

## Vision: The 3-Minute Success Story

**New user lands → sees sample data → performs ONE high-value action → gets tangible result → understands the product**

Example flow:
1. **T+0:00** - Sign up, see pre-populated "AI Research" collection with 3 sample sources
2. **T+0:30** - Inline prompt: "Ask a question about these sources" (conversational entry point)
3. **T+1:00** - Get AI synthesis with visible sources cited
4. **T+1:30** - See "Export this" button → generate blog post
5. **T+2:30** - See exportable Markdown/DOCX → **Success state achieved**
6. **T+3:00** - Checklist appears: "✅ Found insights, ✅ Exported content. Next: Add your own sources"

---

## Phase 1: Foundational UX (Week 1-2)

### 1.1 Visual Hierarchy Overhaul

**Objective:** Make every page scannable in 2 seconds

**Actions:**
- [ ] **Typography system** (3 tiers only)
  - Display: `text-4xl font-bold` (page titles)
  - Heading: `text-xl font-semibold` (sections)
  - Body: `text-base` (content) + `text-sm text-gray-600` (meta)

- [ ] **Spacing system** (8px grid, ruthlessly applied)
  - Page padding: `p-8`
  - Section gaps: `space-y-6`
  - Card padding: `p-6`
  - Button padding: `px-4 py-2`

- [ ] **Color system** (minimal palette)
  ```
  Primary action: Indigo-600 (trust, calm)
  Secondary action: Gray-200
  Success: Green-50 bg + Green-600 text
  Warning: Yellow-50 bg + Yellow-800 text (AI disclaimers)
  Error: Red-50 bg + Red-600 text
  Neutral: Gray-50 backgrounds, Gray-900 text
  ```

- [ ] **Contrast enforcement**
  - All body text: 4.5:1 minimum (WCAG AA)
  - All buttons: 3:1 minimum
  - Remove low-contrast grays (300, 400)

**Implementation:**
```tsx
// New design tokens file
// src/lib/design-tokens.ts
export const spacing = {
  page: 'p-8',
  section: 'space-y-6',
  card: 'p-6',
  inline: 'space-x-3',
} as const

export const typography = {
  display: 'text-4xl font-bold text-gray-900',
  heading: 'text-xl font-semibold text-gray-900',
  body: 'text-base text-gray-700',
  meta: 'text-sm text-gray-600',
} as const

export const colors = {
  primaryAction: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondaryAction: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
} as const
```

---

### 1.2 Declutter + Focus

**Objective:** Reduce cognitive load by 50%

**Actions:**
- [ ] **Homepage simplification**
  - Remove feature grid → Single hero CTA: "Start organizing your knowledge"
  - Add one line: "AI-powered summaries and search for everything you save"
  - Show 3-second demo GIF/video (add source → see summary → search)

- [ ] **Dashboard redesign**
  - **Current:** List of all sources
  - **New:** Personalized dashboard
    - Top: "Welcome back, [name]. You have 3 new insights ready."
    - Quick actions: Add source (prominent), Search (secondary)
    - Smart sections (progressive disclosure):
      - "Recently added" (3 sources)
      - "Suggested connections" (AI-powered, if >5 sources)
      - "Unread summaries" (if any)
      - "Collections" (collapsed by default, expand on click)

- [ ] **Navigation consolidation**
  - **Remove from primary nav:** Analytics, Publishing, Tools, Timeline, Methodology, Literature Review
  - **Keep in primary nav:** Dashboard, Search, Add Source, Collections
  - **Move to secondary:** Everything else → Settings dropdown or contextual menus

**File changes:**
- `src/app/page.tsx` - Simplify hero
- `src/app/dashboard/page.tsx` - Personalized dashboard
- `src/components/MobileNav.tsx` - Reduce nav items

---

### 1.3 AI Transparency (Integrated, Not Bolted)

**Objective:** Make AI feel trustworthy, not scary

**Actions:**
- [ ] **Inline AI attribution** (replace warning boxes)
  ```tsx
  // OLD (feels like a warning):
  <AIDisclaimer variant="compact" />

  // NEW (feels like helpful context):
  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
    <SparklesIcon className="w-4 h-4 text-indigo-500" />
    <span>AI-generated by Claude • <button className="underline">How this works</button></span>
  </div>
  ```

- [ ] **Citation visibility**
  - Summary cards show "Based on 1,247 words from your saved article"
  - Synthesis reports show source chips inline (clickable)
  - Contradictions show side-by-side quotes with highlights

- [ ] **AI confidence indicators**
  ```tsx
  // High confidence
  <div className="flex items-center gap-1">
    <CheckCircle className="text-green-500" />
    <span className="text-xs text-gray-600">High confidence</span>
  </div>

  // Medium confidence
  <div className="flex items-center gap-1">
    <AlertCircle className="text-yellow-500" />
    <span className="text-xs text-gray-600">Verify key facts</span>
  </div>
  ```

**New component:**
```tsx
// src/components/ai/AIAttribution.tsx
export function AIAttribution({
  provider = 'Claude',
  confidence = 'high',
  sourceCount = 1
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <div className="flex items-center gap-1.5">
        <SparklesIcon className="w-4 h-4 text-indigo-500" />
        <span>AI-generated by {provider}</span>
      </div>
      {sourceCount > 0 && (
        <span className="text-gray-400">•</span>
        <span>{sourceCount} source{sourceCount > 1 ? 's' : ''}</span>
      )}
      <ConfidenceBadge level={confidence} />
    </div>
  )
}
```

---

## Phase 2: Time-to-Value Acceleration (Week 3)

### 2.1 First-Run Experience (3-Minute Win)

**Objective:** New user sees value in <3 minutes without reading docs

**Implementation:**

**File:** `src/app/onboarding/page.tsx` (new)

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SAMPLE_SOURCES = [
  {
    title: "AI Safety Research Overview",
    content: "Sample content about AI alignment...",
    type: "article"
  },
  // 2 more samples
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-3xl mx-auto pt-20 px-6">
        {step === 1 && (
          <WelcomeStep
            onNext={() => setStep(2)}
            onSkip={() => router.push('/dashboard')}
          />
        )}
        {step === 2 && (
          <DemoDataStep
            sources={SAMPLE_SOURCES}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <FirstQueryStep
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <SuccessStep
            onComplete={() => router.push('/dashboard')}
          />
        )}
      </div>

      {/* Progress dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <ProgressDots current={step} total={4} />
      </div>
    </div>
  )
}

function WelcomeStep({ onNext, onSkip }) {
  return (
    <div className="text-center space-y-6">
      <h1 className="text-5xl font-bold text-gray-900">
        Welcome to Recall Notebook
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Let's take 3 minutes to show you how AI can help you organize and connect your knowledge.
      </p>
      <div className="flex gap-4 justify-center pt-8">
        <Button onClick={onNext} size="lg">
          Show me (3 min)
        </Button>
        <Button onClick={onSkip} variant="ghost">
          I'll explore on my own
        </Button>
      </div>
    </div>
  )
}

function DemoDataStep({ sources, onNext }) {
  const [loading, setLoading] = useState(false)

  const handleLoadSamples = async () => {
    setLoading(true)
    // Create sample sources
    await fetch('/api/onboarding/sample-data', { method: 'POST' })
    setLoading(false)
    onNext()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 text-center">
        Here's what Recall Notebook does
      </h2>
      <p className="text-gray-600 text-center max-w-xl mx-auto">
        We'll add 3 sample research articles so you can see AI summaries, semantic search, and synthesis in action.
      </p>

      <div className="grid gap-4 mt-8">
        {sources.map((source, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 flex items-center gap-4">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h3 className="font-semibold">{source.title}</h3>
              <p className="text-sm text-gray-600">{source.type}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={handleLoadSamples} loading={loading} size="lg">
          Add sample sources
        </Button>
      </div>
    </div>
  )
}

function FirstQueryStep({ onNext }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const suggestedQueries = [
    "What are the main AI safety concerns?",
    "Summarize the key arguments",
    "What solutions are proposed?"
  ]

  const handleSearch = async (q: string) => {
    setLoading(true)
    const res = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: q, mode: 'semantic' })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 text-center">
        Now ask a question
      </h2>
      <p className="text-gray-600 text-center">
        Semantic search finds answers across all your sources, even if they don't use the exact words.
      </p>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="Ask anything about your sources..."
          className="text-lg"
        />

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Try:</span>
          {suggestedQueries.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuery(q)
                handleSearch(q)
              }}
              className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState />}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Found {result.total} relevant sources</h3>
              <p className="text-green-800">
                {result.results[0]?.summary?.summary_text?.slice(0, 200)}...
              </p>
              <Button onClick={onNext} className="mt-4">
                That's cool! What else?
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SuccessStep({ onComplete }) {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <h2 className="text-4xl font-bold text-gray-900">
        You're ready! 🎉
      </h2>

      <p className="text-xl text-gray-600 max-w-xl mx-auto">
        In 3 minutes, you've seen AI summaries, semantic search, and how Recall Notebook connects your knowledge.
      </p>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 max-w-md mx-auto text-left">
        <h3 className="font-semibold text-indigo-900 mb-3">What you can do now:</h3>
        <ul className="space-y-2 text-indigo-800">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            <span>Add your own sources (text, URLs, PDFs)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            <span>Search across everything with natural language</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            <span>Generate synthesis reports from multiple sources</span>
          </li>
        </ul>
      </div>

      <Button onClick={onComplete} size="lg" className="mt-8">
        Go to my dashboard
      </Button>
    </div>
  )
}
```

**Backend endpoint:**
```ts
// src/app/api/onboarding/sample-data/route.ts
export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const SAMPLES = [
    { title: "AI Safety Research", content: "...", type: "text" },
    { title: "Machine Learning Ethics", content: "...", type: "text" },
    { title: "Neural Network Basics", content: "...", type: "text" },
  ]

  for (const sample of SAMPLES) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`
      },
      body: JSON.stringify({
        ...sample,
        content_type: sample.type,
        original_content: sample.content,
        // AI summary will be generated automatically
      })
    })
  }

  return Response.json({ success: true, samplesAdded: 3 })
}
```

---

### 2.2 Smart Defaults + Auto-Fill

**Objective:** Reduce clicks and typing by 70%

**Actions:**
- [ ] **Add Source flow**
  - Detect content type automatically (URL vs text vs PDF)
  - Auto-generate title from first line or URL title
  - Pre-fill tags from AI topic extraction
  - Show inline: "We'll generate a summary automatically"

- [ ] **Search**
  - Remember last search mode (semantic/keyword/hybrid)
  - Pre-populate search with "Ask me anything" placeholder examples
  - Auto-suggest queries based on recent sources

- [ ] **Collections**
  - Auto-suggest collection name from sources ("AI Research" if all sources contain "AI")
  - One-click "Create collection from selected sources"

**Implementation:**
```tsx
// src/components/ContentIngestion.tsx (enhanced)
export function SmartContentIngestion() {
  const [content, setContent] = useState('')
  const [detectedType, setDetectedType] = useState<'url' | 'text' | 'pdf' | null>(null)
  const [suggestedTitle, setSuggestedTitle] = useState('')

  useEffect(() => {
    // Auto-detect type
    if (content.startsWith('http')) {
      setDetectedType('url')
      // Extract domain as suggested title
      const url = new URL(content)
      setSuggestedTitle(url.hostname)
    } else if (content.length > 0) {
      setDetectedType('text')
      // Use first line as suggested title
      setSuggestedTitle(content.split('\n')[0].slice(0, 60))
    }
  }, [content])

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste a URL, drop a PDF, or paste text..."
        className="min-h-[120px]"
      />

      {detectedType && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <SparklesIcon className="w-4 h-4 text-indigo-500" />
          <span>
            Detected: {detectedType === 'url' ? 'Article link' : 'Text note'}
            {suggestedTitle && ` • Suggested title: "${suggestedTitle}"`}
          </span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!content}
        className="w-full"
      >
        Add source & generate AI summary
      </Button>

      <p className="text-xs text-gray-500 text-center">
        We'll automatically extract key topics, generate a summary, and make it searchable
      </p>
    </div>
  )
}
```

---

### 2.3 Proactive Prompts (Fogg Behavior Model)

**Objective:** Surface next-best actions at high-motivation moments

**Implementation:**

**Motivation Spark** (user has 0-2 sources):
```tsx
// Show on dashboard after first source added
<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
  <h3 className="font-semibold text-indigo-900 mb-2">
    Great start! Add 2 more sources to unlock AI connections
  </h3>
  <p className="text-sm text-indigo-700 mb-4">
    When you have 3+ sources on a topic, we can find surprising connections and contradictions.
  </p>
  <Button size="sm" variant="secondary">Add another source</Button>
</div>
```

**Facilitator** (user searches but no results):
```tsx
// Show when search returns 0 results
<div className="text-center py-12">
  <MagnifyingGlass className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
  <p className="text-gray-600 mb-6">
    Try a different search term, or add more sources to search through.
  </p>
  <div className="flex gap-3 justify-center">
    <Button onClick={() => setMode('keyword')}>Try keyword search instead</Button>
    <Button variant="secondary" onClick={() => router.push('/add')}>
      Add more sources
    </Button>
  </div>
</div>
```

**Signal** (user has 5+ sources, hasn't tried synthesis):
```tsx
// Show as dismissible card on dashboard
<div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 relative">
  <button
    onClick={handleDismiss}
    className="absolute top-4 right-4 text-white/80 hover:text-white"
  >
    <XIcon className="w-5 h-5" />
  </button>

  <h3 className="text-xl font-semibold mb-2">
    Ready for something powerful?
  </h3>
  <p className="mb-4 text-indigo-100">
    You have {sourceCount} sources. Generate a synthesis report to see connections and insights across all of them.
  </p>
  <Button variant="white" onClick={() => router.push('/synthesis')}>
    Generate synthesis report
  </Button>
</div>
```

**File:** `src/components/ProactivePrompts.tsx`
```tsx
export function ProactivePrompts({ sourceCount, hasUsedSynthesis, recentSearchFailed }) {
  // Fogg Model: Only show ONE prompt at a time, at the right moment

  if (sourceCount === 1) {
    return <MotivationSpark />
  }

  if (recentSearchFailed) {
    return <SearchFacilitator />
  }

  if (sourceCount >= 5 && !hasUsedSynthesis) {
    return <SynthesisSignal sourceCount={sourceCount} />
  }

  return null // No prompt = calm UI
}
```

---

## Phase 3: Calm & Adaptive Interfaces (Week 4)

### 3.1 Micro-interactions (Calm, Not Flashy)

**Objective:** Reassure without distracting

**Actions:**
- [ ] **Button states** (subtle, purposeful)
  ```tsx
  // Before: instant transition
  <button className="bg-indigo-600 hover:bg-indigo-700">

  // After: smooth, calm transition
  <button className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150">
  ```

- [ ] **Loading states** (informative, not anxious)
  ```tsx
  // Bad: generic spinner
  <Spinner />

  // Good: contextual progress
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <SpinnerIcon className="w-4 h-4 animate-spin" />
      <span>Reading article...</span>
    </div>
    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-600 animate-pulse w-2/3" />
    </div>
  </div>
  ```

- [ ] **Success confirmations** (toast, not modal)
  ```tsx
  // src/lib/toast-config.ts
  import toast from 'react-hot-toast'

  export const successToast = (message: string) => {
    toast.success(message, {
      duration: 3000,
      className: 'bg-green-50 text-green-900 border border-green-200',
      icon: '✓',
    })
  }
  ```

- [ ] **Skeleton screens** (predictable shapes)
  ```tsx
  // src/components/ui/SkeletonSourceCard.tsx
  export function SkeletonSourceCard() {
    return (
      <div className="bg-white border rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    )
  }
  ```

---

### 3.2 Ambient Personalization

**Objective:** Adapt without asking

**Actions:**
- [ ] **Auto dark mode** (respect system preference)
  ```tsx
  // tailwind.config.js
  module.exports = {
    darkMode: 'class', // or 'media' for automatic
    // ...
  }

  // src/app/layout.tsx
  export default function RootLayout({ children }) {
    return (
      <html lang="en" className="dark:bg-gray-900">
        <body className="dark:text-gray-100">
          {children}
        </body>
      </html>
    )
  }
  ```

- [ ] **Density preferences** (auto-detect screen size)
  ```tsx
  // Compact on mobile, comfortable on desktop
  <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  ```

- [ ] **Persistent search mode**
  ```tsx
  // Remember user's preferred search mode
  const [searchMode, setSearchMode] = useLocalStorage('search-mode', 'semantic')
  ```

- [ ] **Smart dashboard sections**
  ```tsx
  // Show "Recent" if user visits daily, "This week" if weekly
  const timeframe = userVisitFrequency === 'daily' ? 'today' : 'week'

  <h2>Recently added ({timeframe})</h2>
  ```

---

### 3.3 Progressive Disclosure

**Objective:** Simple first, powerful when needed

**Actions:**
- [ ] **Search modes** (default to semantic, show advanced on expand)
  ```tsx
  <div className="space-y-4">
    <Input placeholder="Search across all your sources..." />

    <button
      onClick={() => setShowAdvanced(!showAdvanced)}
      className="text-sm text-gray-600 hover:text-gray-900"
    >
      {showAdvanced ? 'Hide' : 'Show'} advanced options
    </button>

    {showAdvanced && (
      <div className="space-y-3 pl-4 border-l-2 border-gray-200">
        <RadioGroup value={mode} onChange={setMode}>
          <Radio value="semantic">Semantic (recommended)</Radio>
          <Radio value="keyword">Keyword (exact matches)</Radio>
          <Radio value="hybrid">Hybrid (both)</Radio>
        </RadioGroup>
        <Input label="Similarity threshold" type="range" />
      </div>
    )}
  </div>
  ```

- [ ] **Synthesis options**
  ```tsx
  // Simple by default
  <Button onClick={generateSynthesis}>Generate synthesis report</Button>

  // Advanced on toggle
  {showOptions && (
    <div>
      <Select label="Focus area" options={['Safety', 'Ethics', 'Implementation']} />
      <Select label="Tone" options={['Academic', 'Professional', 'Casual']} />
      <Input label="Length" type="range" min="500" max="3000" />
    </div>
  )}
  ```

---

## Phase 4: Conversational UI (Week 5)

### 4.1 Conversational Entry Points

**Objective:** Let users express intent in natural language

**Implementation:**

**File:** `src/components/ConversationalSearch.tsx`
```tsx
export function ConversationalSearch() {
  const [input, setInput] = useState('')
  const [intent, setIntent] = useState<'search' | 'synthesize' | 'export' | null>(null)

  const detectIntent = async (query: string) => {
    // Simple keyword matching (or use AI in future)
    if (query.match(/summarize|synthesis|combine|merge/i)) {
      setIntent('synthesize')
    } else if (query.match(/export|download|save as/i)) {
      setIntent('export')
    } else {
      setIntent('search')
    }
  }

  return (
    <div className="relative">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => detectIntent(input)}
        placeholder="Ask me anything... (e.g., 'Find sources about AI safety' or 'Synthesize my ML notes')"
        className="text-lg pr-12"
      />

      {intent && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <IntentBadge intent={intent} />
        </div>
      )}

      {intent === 'synthesize' && (
        <div className="mt-2 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800">
          I'll generate a synthesis report from your sources. Continue?
          <Button size="sm" className="ml-3">Yes, synthesize</Button>
        </div>
      )}
    </div>
  )
}
```

---

### 4.2 Inline Actions (Reduce Navigation)

**Objective:** Do everything from where you are

**Actions:**
- [ ] **Source cards** → Add inline actions
  ```tsx
  <SourceCard>
    {/* Existing content */}

    <div className="flex gap-2 mt-4 pt-4 border-t">
      <button className="text-sm text-gray-600 hover:text-indigo-600">
        Add to collection
      </button>
      <button className="text-sm text-gray-600 hover:text-indigo-600">
        Find similar
      </button>
      <button className="text-sm text-gray-600 hover:text-indigo-600">
        Export
      </button>
    </div>
  </SourceCard>
  ```

- [ ] **Search results** → Act immediately
  ```tsx
  <SearchResult>
    {/* Summary preview */}

    <div className="flex gap-2 mt-3">
      <Button size="sm" variant="ghost" onClick={() => addToWorkspace(source)}>
        Add to synthesis
      </Button>
      <Button size="sm" variant="ghost">View full source</Button>
    </div>
  </SearchResult>
  ```

---

## Phase 5: Trust & Control (Week 6)

### 5.1 AI Undo & Preview

**Objective:** Let users fix AI mistakes without fear

**Actions:**
- [ ] **Editable summaries**
  ```tsx
  <div className="relative group">
    <p className="text-gray-700">{summary}</p>
    <button
      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={() => setEditing(true)}
    >
      <PencilIcon className="w-4 h-4" />
    </button>

    {editing && (
      <div>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    )}
  </div>
  ```

- [ ] **Synthesis preview** (before committing)
  ```tsx
  <Button onClick={handlePreviewSynthesis}>Preview synthesis</Button>

  {preview && (
    <Modal>
      <h2>Synthesis Preview</h2>
      <div className="prose">
        {preview.content}
      </div>
      <div className="flex gap-3 mt-6">
        <Button onClick={handleAccept}>Accept & save</Button>
        <Button variant="secondary" onClick={handleRegenerate}>
          Regenerate with different settings
        </Button>
      </div>
    </Modal>
  )}
  ```

- [ ] **AI action history** (undo stack)
  ```tsx
  // Track all AI operations
  const [aiHistory, setAiHistory] = useState<AIAction[]>([])

  <button onClick={handleUndo} disabled={aiHistory.length === 0}>
    <UndoIcon /> Undo last AI action
  </button>
  ```

---

### 5.2 Explainability

**Objective:** Show why AI made a decision

**Actions:**
- [ ] **"Why this result?" links**
  ```tsx
  <SearchResult>
    {/* Result content */}

    <button
      onClick={() => setShowExplanation(!showExplanation)}
      className="text-xs text-gray-500 hover:text-gray-700"
    >
      Why is this relevant? (87% match)
    </button>

    {showExplanation && (
      <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
        This source matches your query because:
        <ul className="list-disc list-inside mt-2">
          <li>Contains similar concepts: "AI safety", "alignment"</li>
          <li>Written by cited author in your other sources</li>
          <li>Published in same timeframe as your query context</li>
        </ul>
      </div>
    )}
  </SearchResult>
  ```

- [ ] **Synthesis source attribution**
  ```tsx
  <div className="prose">
    <p>
      AI safety research emphasizes alignment challenges
      <sup className="cursor-pointer text-indigo-600 hover:underline" onClick={() => showSource(1)}>
        [1]
      </sup>
      while recent work focuses on scalable oversight
      <sup className="cursor-pointer text-indigo-600 hover:underline" onClick={() => showSource(2)}>
        [2]
      </sup>
      .
    </p>
  </div>

  <div className="mt-6 space-y-2">
    <h3 className="text-sm font-semibold text-gray-700">Sources cited:</h3>
    {sources.map((source, i) => (
      <div key={i} className="flex items-start gap-2 text-sm">
        <span className="text-gray-500">[{i + 1}]</span>
        <a href={`/source/${source.id}`} className="text-indigo-600 hover:underline">
          {source.title}
        </a>
      </div>
    ))}
  </div>
  ```

---

## Phase 6: Measurement (Ongoing)

### 6.1 Instrumentation

**Add tracking for:**
- Time-to-first-value (onboarding completion time)
- Time-to-second-value (first real source added after onboarding)
- Search success rate (results found / searches)
- Feature adoption (% users who tried synthesis, connections, export)
- AI trust indicators (% summaries edited, % synthesis reports accepted)

**Implementation:**
```tsx
// src/lib/analytics.ts
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  // PostHog, Amplitude, or simple API logging
  console.log('[Analytics]', event, properties)

  // Example: track to your API
  fetch('/api/analytics/events', {
    method: 'POST',
    body: JSON.stringify({ event, properties, timestamp: Date.now() })
  })
}

// Usage:
trackEvent('onboarding_completed', { duration_seconds: 180 })
trackEvent('search_performed', { mode: 'semantic', results_found: 5 })
trackEvent('synthesis_accepted', { source_count: 8, edit_made: false })
```

---

### 6.2 Success Metrics (2026 Benchmarks)

**Track these KPIs:**
- **Time-to-first-value:** <3 minutes (onboarding completion)
- **Activation rate:** >60% complete onboarding
- **Search success:** >80% of searches return >3 results
- **AI trust:** >70% of AI outputs accepted without edits
- **Retention:** >40% weekly active users (WAU)
- **Cognitive load reduction:** <5 clicks to complete core workflows

---

## Implementation Priority

### **Sprint 1 (Week 1): Foundation**
1. Visual hierarchy overhaul (typography, spacing, colors)
2. Navigation declutter (remove 6 nav items, consolidate)
3. AI attribution redesign (SparklesIcon + inline context)

### **Sprint 2 (Week 2-3): Time-to-Value**
4. First-run experience (4-step onboarding)
5. Sample data endpoint
6. Smart defaults (auto-detect, auto-fill, suggestions)

### **Sprint 3 (Week 4): Calm UI**
7. Micro-interactions (transitions, toasts, skeletons)
8. Proactive prompts (Fogg Model implementation)
9. Progressive disclosure (advanced options hidden by default)

### **Sprint 4 (Week 5): Conversational**
10. Conversational search input
11. Inline actions (reduce navigation)

### **Sprint 5 (Week 6): Trust**
12. Editable AI outputs
13. Synthesis preview before save
14. Explainability ("Why this result?")

### **Sprint 6 (Ongoing): Measure**
15. Analytics instrumentation
16. A/B testing framework
17. Weekly iteration based on metrics

---

## Before/After Examples

### Dashboard

**BEFORE:**
```
┌────────────────────────────────────┐
│ Sources                            │
│ All your captured knowledge        │
├────────────────────────────────────┤
│ [Source 1]                         │
│ [Source 2]                         │
│ [Source 3]                         │
│ ...                                │
└────────────────────────────────────┘
```

**AFTER:**
```
┌────────────────────────────────────┐
│ Welcome back, David                │
│ 3 new insights ready to explore    │
├────────────────────────────────────┤
│ ✨ Ask anything across your 42     │
│    sources: [________________]     │
├────────────────────────────────────┤
│ Recently added (today) ▼           │
│ [Source 1 with inline actions]     │
│ [Source 2 with inline actions]     │
│                                    │
│ Suggested for you ▼                │
│ 💡 "AI safety" + "ethics" found    │
│    in 8 sources. Generate report?  │
└────────────────────────────────────┘
```

---

### AI Summary Card

**BEFORE:**
```
┌────────────────────────────────────┐
│ ⚠️ AI-Generated Content            │
│ This content was created by AI...  │
│ Verify important facts...          │
├────────────────────────────────────┤
│ Summary: Lorem ipsum dolor sit...  │
│                                    │
│ Key Actions:                       │
│ • Action 1                         │
│ • Action 2                         │
└────────────────────────────────────┘
```

**AFTER:**
```
┌────────────────────────────────────┐
│ Summary: Lorem ipsum dolor sit...  │
│                                    │
│ Key Actions:                       │
│ • Action 1                         │
│ • Action 2                         │
├────────────────────────────────────┤
│ ✨ AI by Claude • 1 source         │
│ ✓ High confidence  [Edit] [Why?]   │
└────────────────────────────────────┘
```

---

## Design System Checklist

Before shipping any component, verify:

- [ ] **Hierarchy:** Can user scan and understand in 2 seconds?
- [ ] **Contrast:** WCAG AA (4.5:1 text, 3:1 UI)?
- [ ] **Spacing:** 8px grid enforced?
- [ ] **Motion:** Transitions <150ms, purposeful not decorative?
- [ ] **Accessibility:** Keyboard nav, screen reader tested?
- [ ] **Mobile:** Touch targets ≥44px, readable on 375px width?
- [ ] **States:** Loading, error, empty, success all designed?
- [ ] **AI transparency:** Attribution visible, confidence shown?
- [ ] **User control:** Can user edit, undo, or preview AI outputs?
- [ ] **Fogg Model:** Is there motivation + ability + prompt for this action?

---

## Next Steps

1. **Review this plan** - Validate priorities with product vision
2. **Design in Figma** - Create mockups for Phase 1 (Sprint 1-2)
3. **Implement incrementally** - Ship Phase 1 in Week 1, get feedback
4. **Measure ruthlessly** - Track time-to-value from day 1
5. **Iterate weekly** - A/B test prompts, flows, and UI patterns

**Goal:** Ship Phase 1 (Foundation + Time-to-Value) in 2 weeks. Users should feel the difference immediately: calmer, faster, more trustworthy.

---

**Remember:** Beautiful UI in 2026 = invisible friction. Every pixel should either reduce cognitive load or deliver value. If it doesn't, delete it. 🔥
