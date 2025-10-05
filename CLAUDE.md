# Production-Level Development Standards

This document defines the mandatory standards for all production-level code in this project. Claude Code must follow these standards for every feature, component, and deployment.

---

## Core Principle
**Production-level means the code is ready to be used by real users, withstand scrutiny from other developers, pass legal requirements, and operate reliably at scale.**

---

## 1. Development Process (TDD + UI Verification)

All features **MUST** follow this 7-step sequence:

### Step 1: Feature Design
- Create `docs/design/{feature}.md` with:
  - User stories
  - Functional requirements
  - Technical approach
  - API contracts
  - Data models
  - Edge cases

### Step 2: Test Design
- Create `docs/testing/{feature}_test.md` with:
  - Test scenarios (happy path, edge cases, errors)
  - Expected inputs/outputs
  - Mock data structures
  - Coverage targets (≥80%)

### Step 3: Code Design
- Define TypeScript interfaces/types first
- Create API contracts
- Define component props
- Plan state management

### Step 4: Test Implementation
- Write tests **BEFORE** implementation
- Unit tests for logic
- Integration tests for API routes
- E2E tests for critical flows
- Accessibility tests

### Step 5: Feature Implementation
- Implement until all tests pass
- Follow code quality standards (Section 2)
- Handle all error cases
- Add proper logging

### Step 6: Validation
- Verify ≥80% code coverage
- Run all linters (ESLint, TypeScript)
- Manual testing across devices
- Performance testing

### Step 7: UI Verification (MANDATORY)
Every single aspect must be accessible and functional through UI:

#### 7a. Verify All Buttons Created
- [ ] Every action has a corresponding button/link
- [ ] No orphaned functionality
- [ ] All buttons are properly labeled

#### 7b. Verify All Pages Accessible
- [ ] All routes are linked from navigation or other pages
- [ ] No dead-end pages
- [ ] Back/forward navigation works
- [ ] Breadcrumbs where appropriate

#### 7c. Verify Button Feedback
- [ ] Loading states (spinners, skeleton screens)
- [ ] Success confirmations (toasts, modals)
- [ ] Error messages (user-friendly, actionable)
- [ ] Disabled states when action unavailable
- [ ] Hover states clearly indicate clickability

#### 7d. Verify Button Visibility
- [ ] Sufficient contrast (WCAG AA: 4.5:1 for text, 3:1 for UI)
- [ ] Clear visual hierarchy (primary, secondary, tertiary)
- [ ] Adequate size (minimum 44x44px touch target)
- [ ] Consistent styling across app
- [ ] Clear focus indicators for keyboard navigation

#### 7e. Verify Style Best Practices
- [ ] Responsive on mobile, tablet, desktop
- [ ] Consistent spacing (use design tokens)
- [ ] Professional typography hierarchy
- [ ] Color system follows brand guidelines
- [ ] Smooth transitions and animations
- [ ] Dark mode support (if applicable)
- [ ] No layout shifts or jank

---

## 2. Code Quality Standards

### TypeScript
```typescript
// ✅ REQUIRED
- Strict mode enabled in tsconfig.json
- No 'any' types (use 'unknown' if necessary)
- Explicit return types on functions
- Interfaces for all data structures
- Zod schemas for runtime validation

// ❌ FORBIDDEN
- Type assertions without validation
- Ignoring TypeScript errors with @ts-ignore
- Implicit any
- Unused variables/imports
```

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── search/            # Search page
│   ├── source/[id]/       # Source detail page
│   ├── synthesis/[id]/    # Synthesis report page
│   ├── graph/             # Knowledge graph page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── auth/             # Auth-related components
│   ├── tags/             # Tag components
│   ├── academic/         # Academic features (citations)
│   ├── ai/               # AI features (connections, contradictions)
│   ├── publishing/       # Publishing features
│   ├── visualization/    # Data visualization
│   └── social/           # Social features
├── lib/                   # Utilities and services
│   ├── supabase/         # Supabase clients (server, client, middleware)
│   ├── auth/             # Auth utilities
│   ├── claude/           # Claude API integration
│   ├── content/          # Content processing (URL, PDF)
│   ├── embeddings/       # Vector embeddings
│   ├── tags/             # Tag utilities
│   ├── export/           # Export functionality
│   ├── citations/        # Citation formatters
│   ├── connections/      # AI connection discovery
│   ├── concepts/         # Concept extraction
│   ├── synthesis/        # Report generation
│   ├── publishing/       # Publishing generators
│   ├── contradictions/   # Contradiction detection
│   ├── analysis/         # Gap analysis
│   ├── academic/         # Academic utilities
│   ├── import/           # Reference parsers
│   └── pdf/              # PDF processing
├── types/                 # TypeScript type definitions
├── __tests__/            # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── e2e/             # End-to-end tests
│   └── helpers/         # Test fixtures and helpers
└── middleware.ts         # Next.js middleware
```

### Naming Conventions
- **Files**: `kebab-case.tsx`, `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase` (prefix interfaces with `I` only if necessary)
- **API Routes**: `kebab-case/route.ts`

### Code Organization
```typescript
// Component structure (top to bottom)
1. Imports (external, then internal)
2. Type definitions
3. Constants
4. Main component function
5. Helper functions (or extract to utils/)
6. Exports

// Example:
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createSupabaseClient } from '@/lib/supabase/client';

interface SourceCardProps {
  source: Source;
  onDelete: (id: string) => void;
}

const MAX_SUMMARY_LENGTH = 200;

export function SourceCard({ source, onDelete }: SourceCardProps) {
  // Implementation
}

function truncateSummary(text: string): string {
  // Keep small, or move to lib/utils
}
```

---

## 3. Security Standards

### Environment Variables
```typescript
// ✅ REQUIRED
- All secrets in .env.local (NEVER commit)
- Validate env vars on startup with Zod
- Prefix client vars with NEXT_PUBLIC_
- Document all vars in .env.example

// Required environment variables for Recall Notebook:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API Security
```typescript
// ✅ REQUIRED
- Rate limiting on all AI API routes
- Input validation with Zod
- Sanitize user inputs (especially for URL fetching)
- Row-level security (RLS) in Supabase
- Authentication middleware for protected routes
- CORS configuration for API routes
- Security headers (Next.js config)

// Example auth check:
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Protected logic
}
```

### Data Handling
- Never log sensitive data (API keys, user credentials)
- Sanitize error messages before showing to users
- Use HTTPS only (enforce in production)
- Implement CSRF protection for forms
- All database queries use RLS policies
- Validate file uploads (PDFs, images)
- Sanitize HTML from URL content (use Cheerio safely)

---

## 4. Legal & Compliance

### Required Pages
1. **Privacy Policy** (`/privacy`)
   - Data collection practices
   - Supabase data storage
   - AI processing (Claude, Groq, OpenRouter)
   - Vector embeddings storage
   - User rights (GDPR, CCPA)
   - Contact information

2. **Terms of Service** (`/terms`)
   - Acceptable use policy
   - Intellectual property rights
   - Disclaimer about AI-generated content
   - Data retention policies
   - Limitation of liability
   - Governing law

3. **Cookie Consent** (if using analytics)
   - Clear opt-in/opt-out
   - Granular controls (necessary, analytics, marketing)

### AI Content Disclaimer
```typescript
// Required on all AI-generated content (summaries, syntheses, reports)
"⚠️ AI-Generated Content: This content is created by AI and should
be reviewed for accuracy. Verify important facts and citations before
using in academic or professional contexts."
```

### Attribution
- Credit AI models used: "Powered by Anthropic Claude, Groq, OpenRouter"
- Link to open-source libraries in footer
- Include copyright notice: `© 2025 Recall Notebook`

---

## 5. UI/UX Standards

### Responsive Design
```css
/* Mobile-first breakpoints */
sm: 640px   /* Tablet */
md: 768px   /* Small laptop */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Accessibility (WCAG 2.1 Level AA)
```typescript
// ✅ REQUIRED
- Semantic HTML (header, nav, main, footer, article)
- ARIA labels for interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus visible indicators
- Alt text for all images
- Color contrast ratios (4.5:1 text, 3:1 UI)
- Screen reader testing

// Example:
<button
  aria-label="Delete source"
  aria-describedby="delete-warning"
  disabled={isDeleting}
  className="focus:ring-2 focus:ring-offset-2"
>
  {isDeleting ? 'Deleting...' : 'Delete'}
</button>
```

### Loading States
```typescript
// Required for all async operations:
1. Skeleton screens (page loads, source lists)
2. Spinners (button actions, API calls)
3. Progress indicators (PDF processing, AI generation)
4. Optimistic UI updates where possible

// Example:
{isLoading ? (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-3/4" />
    <div className="h-24 bg-gray-200 rounded" />
  </div>
) : (
  <SourceCard source={source} />
)}
```

### Error Handling
```typescript
// User-facing errors must be:
- Clear and actionable
- Non-technical language
- Suggest next steps
- Offer retry/fallback options

// Examples:
"Unable to process PDF. Please ensure the file is a valid PDF and try again."
"Failed to generate summary. This might be due to high API demand. Please try again in a few seconds."
"Search failed. Please check your internet connection and try again."

// NOT: "Error 500: Internal Server Error"
// NOT: "Failed to fetch embeddings from OpenAI"
```

### Feedback Mechanisms
- Success: Green toast notification (3-5 seconds)
- Error: Red toast with retry option (dismissible)
- Info: Blue toast (dismissible)
- Loading: Spinner + descriptive text ("Processing PDF...", "Generating summary...")

---

## 6. Performance Standards

### Metrics (Lighthouse)
- Performance: ≥90
- Accessibility: 100
- Best Practices: 100
- SEO: ≥90

### Optimization Checklist
- [ ] Images: Next.js Image component, WebP format
- [ ] Fonts: Font subsetting, preload critical fonts
- [ ] Code splitting: Dynamic imports for heavy components (Knowledge Graph, PDF viewer)
- [ ] Bundle size: Monitor with `@next/bundle-analyzer`
- [ ] Caching: Proper cache headers (static assets: 1 year)
- [ ] Lazy loading: Below-the-fold content
- [ ] Database queries: Use indexes on user_id, source_id, embeddings
- [ ] Vector search: Optimize pgvector queries with HNSW index

```typescript
// Example lazy loading:
import dynamic from 'next/dynamic';

const KnowledgeGraphClient = dynamic(
  () => import('@/components/visualization/KnowledgeGraphClient'),
  {
    loading: () => <div>Loading graph...</div>,
    ssr: false, // Client-only for D3.js
  }
);
```

---

## 7. Testing Standards

### Test Coverage
- Minimum 80% overall coverage
- 100% coverage for critical paths (auth, AI API calls, search)
- Unit tests for all utility functions
- Integration tests for API routes
- E2E tests for user flows (login, create source, search)

### Testing Tools
```json
{
  "unit": "Jest + React Testing Library",
  "integration": "Jest + Supabase test client",
  "e2e": "Jest (or Playwright)",
  "accessibility": "@testing-library/jest-dom"
}
```

### Test Structure
```typescript
// describe blocks for each function/component
// it/test blocks for each scenario

describe('generateSummary', () => {
  it('should generate summary with valid content', async () => {
    const result = await generateSummary('Test content', 'user-id');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('keyActions');
    expect(result).toHaveProperty('topics');
  });

  it('should throw error with empty content', async () => {
    await expect(generateSummary('', 'user-id'))
      .rejects.toThrow('Content cannot be empty');
  });

  it('should handle API failures gracefully', async () => {
    // Mock API failure
    // Test error handling
  });
});
```

### Test Commands
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## 8. Documentation Standards

### README.md (Required Sections)
1. ✅ Project overview and features
2. ✅ Tech stack
3. ✅ Prerequisites (Node version, API keys)
4. ✅ Installation steps
5. ✅ Environment variables (.env.example reference)
6. ✅ Development commands
7. ✅ Testing commands
8. ✅ Deployment guide
9. Contributing guidelines
10. License

### Code Comments
```typescript
// ✅ Good comments (explain WHY)
// Using client-side embeddings to reduce API costs and latency
const embeddings = await generateLocalEmbeddings(text);

// Using Groq for simple summaries due to cost ($0.05/M vs Claude $3/M)
const summary = await generateGroqSummary(content);

// ❌ Bad comments (explain WHAT - code should be self-documenting)
// Loop through sources
for (const source of sources) { }

// JSDoc for public functions:
/**
 * Generates AI summary for content using cost-optimized routing
 * @param content - Text content to summarize
 * @param userId - User ID for tracking
 * @param complexity - 'simple' uses Groq, 'complex' uses Claude
 * @returns Promise resolving to summary with key actions and topics
 * @throws {ValidationError} If content is empty or invalid
 */
export async function generateSummary(
  content: string,
  userId: string,
  complexity: 'simple' | 'complex' = 'simple'
): Promise<Summary> {
  // Implementation
}
```

### API Documentation
- Document all endpoints in `docs/api/README.md`
- Include request/response examples
- List all error codes and meanings
- Provide curl examples

---

## 9. Error Handling & Logging

### Error Handling Levels
```typescript
// 1. Try-catch at API route level
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = await generateSummary(body.content, user.id);
    return Response.json(result);
  } catch (error) {
    console.error('Summary generation failed:', error);

    if (error instanceof ValidationError) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof APIError) {
      return Response.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 2. Custom error classes
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class APIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'APIError';
  }
}

// 3. Error boundaries in React
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>Refresh</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### Logging Strategy
```typescript
// Development: Console logs
// Production: Structured logging (Vercel Analytics, Sentry)

const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, error: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      ...meta
    }));
  },
  apiCall: (provider: string, model: string, tokens: number, cost: number) => {
    console.log(JSON.stringify({
      level: 'info',
      type: 'api_call',
      provider,
      model,
      tokens,
      cost
    }));
  }
};
```

---

## 10. SEO Standards

### Meta Tags (Every Page)
```typescript
// app/layout.tsx or page.tsx
export const metadata: Metadata = {
  title: 'Recall Notebook - AI-Powered Knowledge Management',
  description: 'Intelligent note-taking with AI summaries, semantic search, and knowledge graphs. Save articles, PDFs, and notes with automatic organization.',
  keywords: ['knowledge management', 'AI notes', 'semantic search', 'RAG', 'second brain'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'Recall Notebook',
    description: 'AI-powered knowledge management system',
    url: 'https://yourdomain.com',
    siteName: 'Recall Notebook',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recall Notebook',
    description: 'AI-powered knowledge management',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Structured Data (JSON-LD)
```typescript
// For homepage
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Recall Notebook",
  "description": "AI-powered knowledge management system",
  "url": "https://yourdomain.com",
  "applicationCategory": "ProductivityApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

---

## 11. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Lighthouse scores meet targets
- [ ] No console errors or warnings
- [ ] Environment variables documented
- [ ] .env.example up to date
- [ ] README.md complete
- [ ] Legal pages (privacy, terms) finalized
- [ ] Supabase RLS policies verified
- [ ] Database migrations tested
- [ ] API rate limiting configured
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (if desired)

### Supabase Setup
```bash
# Database migrations
supabase db push

# Verify RLS policies
- All tables have RLS enabled
- user_id policies on sources, collections, etc.
- Auth policies for public access

# Storage buckets (if using)
- PDFs bucket with proper policies
- Images bucket with proper policies
```

### Vercel Deployment
```bash
# Production build test
npm run build
npm run start

# Environment variables in Vercel dashboard:
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ANTHROPIC_API_KEY=xxx
GROQ_API_KEY=xxx
OPENROUTER_API_KEY=xxx
OPENAI_API_KEY=xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Deployment settings:
- Build command: npm run build
- Output directory: .next
- Install command: npm install
- Node version: 20.x
```

### Post-Deployment
- [ ] Verify all pages load correctly
- [ ] Test auth flow (signup, login, logout)
- [ ] Test source creation (text, URL, PDF)
- [ ] Test search functionality
- [ ] Verify AI API calls work
- [ ] Check mobile responsiveness
- [ ] Test error scenarios
- [ ] Monitor error tracking dashboard
- [ ] Monitor API usage and costs
- [ ] Set up uptime monitoring

---

## 12. Git & Version Control

### Commit Messages
```
Format: <type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting, missing semicolons
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

Examples:
feat(api): add semantic search endpoint
fix(ui): resolve PDF viewer rendering issue
docs(readme): update setup instructions
refactor(lib): optimize embeddings generation
test(auth): add login flow tests
```

### Branch Strategy
```
main        - Production-ready code
develop     - Integration branch
feature/*   - New features
fix/*       - Bug fixes
hotfix/*    - Urgent production fixes
```

---

## 13. Code Review Checklist

Before merging any PR, verify:
- [ ] All tests pass
- [ ] Code coverage ≥80%
- [ ] No TypeScript errors
- [ ] ESLint pass
- [ ] Manual testing completed
- [ ] Accessibility verified
- [ ] Responsive design checked
- [ ] Error handling tested
- [ ] Loading states work
- [ ] Documentation updated
- [ ] No sensitive data exposed
- [ ] Performance acceptable
- [ ] RLS policies secure
- [ ] API costs considered

---

## 14. AI API Cost Optimization

### Cost-Aware Routing Strategy
```typescript
// Use cheapest model for each task
const AI_ROUTING = {
  // Simple tasks: Groq ($0.05-0.10/M tokens)
  simple_summary: 'groq/llama3-70b',
  tag_extraction: 'groq/llama3-70b',
  title_generation: 'groq/llama3-70b',

  // Medium tasks: OpenRouter ($0.50-1.00/M tokens)
  semantic_search: 'openrouter/meta-llama/llama-3.1-70b',
  connections: 'openrouter/meta-llama/llama-3.1-70b',

  // Complex tasks: Claude ($3-15/M tokens)
  synthesis_report: 'anthropic/claude-3-5-sonnet',
  contradictions: 'anthropic/claude-3-5-sonnet',
  academic_writing: 'anthropic/claude-3-5-sonnet',

  // Embeddings: OpenAI ($0.13/M tokens)
  embeddings: 'openai/text-embedding-3-small'
};
```

### Cost Monitoring
- Log all API calls with costs
- Set up alerts for unusual spending
- Review cost reports monthly
- Optimize prompts for token efficiency

---

## 15. Database Best Practices

### Supabase Patterns
```sql
-- Always use RLS policies
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own sources"
ON sources FOR SELECT
USING (auth.uid() = user_id);

-- Use indexes for common queries
CREATE INDEX idx_sources_user_id ON sources(user_id);
CREATE INDEX idx_sources_created_at ON sources(created_at DESC);

-- Use pgvector HNSW index for fast similarity search
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);

-- Use transactions for multi-table operations
BEGIN;
INSERT INTO sources (...) VALUES (...);
INSERT INTO embeddings (...) VALUES (...);
COMMIT;
```

### Data Migration
- Test migrations locally first
- Use Supabase migration files
- Never delete data without backup
- Provide rollback scripts

---

## 16. Continuous Improvement

### Regular Audits
- Weekly: Lighthouse scores, error logs
- Monthly: Dependency updates (`npm audit`), cost review
- Quarterly: Security review, performance optimization

### User Feedback Loop
- Error tracking → Identify common failures
- Analytics → Understand user behavior
- User testing → Validate UX decisions
- Feature requests → Prioritize roadmap

---

## Summary: Production-Level Definition

Code is production-level when:
1. ✅ All 7 TDD steps completed
2. ✅ All UI elements verified (7a-7e)
3. ✅ Security standards met (RLS, auth, input validation)
4. ✅ Legal requirements satisfied
5. ✅ Accessibility compliant (WCAG AA)
6. ✅ Performance targets achieved (Lighthouse ≥90)
7. ✅ Test coverage ≥80%
8. ✅ Documentation complete
9. ✅ Error handling comprehensive
10. ✅ AI costs optimized
11. ✅ Database queries secure and efficient
12. ✅ Ready for real users without shame

**If you can proudly share it with the world, it's production-level.**

---

## Quick Reference: Daily Checklist

When implementing any feature:
- [ ] Create design doc in `docs/design/`
- [ ] Create test plan in `docs/testing/`
- [ ] Write tests first
- [ ] Implement feature
- [ ] Verify all buttons/UI work
- [ ] Check responsive design
- [ ] Test error scenarios
- [ ] Verify accessibility
- [ ] Test with real API calls
- [ ] Review API costs
- [ ] Verify RLS policies
- [ ] Update documentation
- [ ] Code review (self or peer)
- [ ] Deploy to staging
- [ ] Final production check

---

## Project-Specific Patterns

### Supabase Client Usage
```typescript
// Server components: use server client
import { createServerClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createServerClient();
  const { data } = await supabase.from('sources').select('*');
  return <div>{/* ... */}</div>;
}

// Client components: use client
'use client';
import { createBrowserClient } from '@/lib/supabase/client';

export function Component() {
  const supabase = createBrowserClient();
  // ...
}

// API routes: use server client
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  // ...
}
```

### AI API Calls
```typescript
// Always handle errors and retries
import { anthropic } from '@/lib/claude/utils';

async function callAI(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Vector Search Pattern
```typescript
// Generate embedding → Search → Return results
const embedding = await generateEmbedding(query);
const { data } = await supabase.rpc('search_embeddings', {
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 10
});
```

---

**Remember: Users don't see your code, they experience your UI. Make every interaction delightful, clear, and professional.**
