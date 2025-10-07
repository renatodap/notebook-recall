# API Validation Progress Report

## Summary
**Total API Routes**: 76
**Routes with Full Validation**: 17 (22%)
**Routes Needing Validation**: 59 (78%)

## Validation Standard Checklist
For each route, the following must be implemented:
- ✅ Zod schema validation for all inputs (body, params, query)
- ✅ Custom error classes (AuthenticationError, ValidationError, NotFoundError, etc.)
- ✅ Explicit return types (`: Promise<NextResponse>`)
- ✅ Remove `as any` and `as never` type assertions
- ✅ User-friendly error messages
- ✅ Proper auth checks with custom errors
- ✅ handleAPIError() for consistent error responses

---

## ✅ COMPLETED Routes (17 total)

### Core Content Routes (4)
1. **`/api/sources` (GET, POST)** - Full validation with GetSourcesQuerySchema, createSourceSchema
2. **`/api/sources/[id]` (GET, DELETE)** - ResourceIdParamSchema, custom errors
3. **`/api/summarize` (POST)** - SummarizeRequestSchema
4. **`/api/export` (GET)** - ExportSourcesQuerySchema, validateSourceIds helper

### AI Generation Routes (5)
5. **`/api/synthesis/generate` (POST)** - generateSynthesisSchema
6. **`/api/synthesis/[id]` (GET, DELETE)** - ResourceIdParamSchema, custom errors
7. **`/api/publishing/generate-blog` (POST)** - generateBlogPostSchema
8. **`/api/publishing/generate-newsletter` (POST)** - GenerateNewsletterRequestSchema
9. **`/api/publishing/generate-paper` (POST)** - GeneratePaperRequestSchema

### AI Analysis Routes (3)
10. **`/api/connections/discover` (POST)** - DiscoverConnectionsSchema
11. **`/api/contradictions/detect` (POST)** - DetectContradictionsSchema
12. **`/api/research-assistant/chat` (POST)** - Chat request schema

### Q&A and Collections (4)
13. **`/api/qa/ask` (POST)** - Question schema
14. **`/api/collections` (GET, POST)** - createCollectionSchema
15. **`/api/annotations` (POST)** - createAnnotationSchema
16. **`/api/annotations/[id]` (GET, PATCH, DELETE)** - UpdateAnnotationSchema, ResourceIdParamSchema
17. **`/api/research-questions/[id]` (PATCH, DELETE)** - UpdateResearchQuestionSchema, ResourceIdParamSchema

---

## ⏳ IN PROGRESS / PENDING Routes (59 total)

### High Priority - User Input & AI (15 routes)

#### Publishing Routes (4)
- [ ] `/api/publishing/[id]` (GET, PUT, DELETE) - Needs ResourceIdParamSchema, PUT body validation
- [ ] `/api/publishing/generate-presentation` (POST) - Has GeneratePresentationSchema
- [ ] `/api/publishing/generate-book-outline` (POST) - Has GenerateBookOutlineSchema
- [ ] `/api/publishing` (GET) - Query params validation

#### Workspace & Collaboration (4)
- [ ] `/api/workspaces` (GET, POST) - Has CreateWorkspaceSchema
- [ ] `/api/workspaces/[id]` (GET, PATCH, DELETE) - Needs UpdateWorkspaceSchema
- [ ] `/api/workspaces/[id]/members` (GET, POST, DELETE) - Has InviteMemberSchema
- [ ] `/api/collections/[id]/collaborate` (POST) - Has AddCollaboratorSchema

#### Content Processing (4)
- [ ] `/api/process-image` (POST) - **MISSING AUTH**, needs validation
- [ ] `/api/process-pdf` (POST) - Already has rate limiting, needs Zod
- [ ] `/api/fetch-url` (POST) - Already has validation ✅
- [ ] `/api/voice/upload` (POST) - Needs validation

#### Research & Analysis (3)
- [ ] `/api/research-questions` (GET, POST) - Has CreateResearchQuestionSchema
- [ ] `/api/concepts/extract` (POST) - Has ExtractConceptsSchema
- [ ] `/api/concepts/source/[id]` (GET) - Needs ResourceIdParamSchema

### Medium Priority - Data Management (20 routes)

#### Collections (Already validated ✅)
- [x] `/api/collections/[id]` (GET, PUT, DELETE) - DONE ✅
- [x] `/api/collections/[id]/sources` (POST, DELETE) - DONE ✅

#### Sources & Citations (6)
- [ ] `/api/citations/fetch` (POST) - Has fetchCitationSchema
- [ ] `/api/citations/export-citations` (POST) - Has ExportCitationsSchema
- [ ] `/api/citations/source/[id]` (GET) - Needs ResourceIdParamSchema
- [ ] `/api/connections/source/[id]` (GET) - Needs ResourceIdParamSchema
- [ ] `/api/contradictions/source/[id]` (GET) - Needs ResourceIdParamSchema
- [ ] `/api/methodology/extract` (POST) - Needs validation

#### Export & Import (3)
- [ ] `/api/export/document` (POST) - Has ExportDocumentSchema
- [ ] `/api/import/references` (POST) - Has ImportReferencesSchema
- [ ] `/api/recommendations` (GET) - Query params validation

#### Bulk Operations (Already validated ✅)
- [x] `/api/bulk/delete` (POST) - DONE ✅
- [x] `/api/bulk/tag` (POST) - DONE ✅
- [ ] `/api/batch/operations` (POST) - Needs validation

#### Social & Sharing (4)
- [ ] `/api/sharing` (POST, GET, DELETE) - Has CreateShareLinkSchema
- [ ] `/api/social/follow` (POST) - Has FollowUserSchema
- [ ] `/api/social/interactions` (POST) - Has CreateInteractionSchema
- [ ] `/api/profiles` (GET, PUT) - Needs validation
- [ ] `/api/profiles/[userId]` (GET) - Needs UserIdParamSchema

#### Tags & Metadata (2)
- [ ] `/api/tags` (GET) - READ ONLY ✅
- [ ] `/api/pins` (GET, POST, DELETE) - Needs validation

### Lower Priority - System & Utilities (15 routes)

#### Search (3)
- [x] `/api/search` (POST) - DONE ✅
- [ ] `/api/search/enhanced` (POST) - Has EnhancedSearchSchema
- [ ] `/api/search/parse` (POST) - Needs validation

#### Literature Review (2)
- [ ] `/api/literature-review/generate` (POST) - Needs validation
- [ ] `/api/literature-review/auto-generate` (POST) - Needs validation

#### Analytics & Dashboard (3)
- [ ] `/api/analytics/dashboard` (GET) - Query params validation
- [ ] `/api/graph/data` (GET) - Query params validation
- [ ] `/api/timeline` (GET) - Query params validation

#### Onboarding & Demo (2)
- [ ] `/api/onboarding/seed-demo` (POST) - Needs validation
- [ ] `/api/quick-wins` (POST) - Has quickWinsPostSchema

#### Embeddings & Background (3)
- [ ] `/api/embeddings/generate` (POST) - Needs validation
- [ ] `/api/embeddings/backfill` (POST) - Needs validation
- [ ] `/api/chunks/backfill` (POST) - Needs validation

#### Digest & Email (2)
- [ ] `/api/digest/generate` (POST) - Needs validation
- [ ] `/api/email-capture` (POST) - Needs validation

#### Utilities (3)
- [ ] `/api/feedback` (POST) - Needs validation (basic check exists)
- [ ] `/api/writing-assistant/improve` (POST) - Has ImproveTextSchema
- [ ] `/api/analysis/gaps` (POST) - Needs validation
- [ ] `/api/youtube/transcript` (GET) - Query params validation

---

## Implementation Strategy

### Phase 1: High Priority Routes (15 routes) - Est. 3-4 hours
Focus on routes handling user input and AI operations:
1. Publishing routes (4)
2. Workspace routes (4)
3. Content processing (4)
4. Research routes (3)

### Phase 2: Medium Priority Routes (20 routes) - Est. 4-5 hours
Data management and bulk operations:
1. Citations and sources (6)
2. Export/import (3)
3. Social and sharing (4)
4. Batch operations (1)
5. Tags and metadata (2)
6. Profiles (4)

### Phase 3: Lower Priority Routes (15 routes) - Est. 2-3 hours
System utilities and background tasks:
1. Search variants (2)
2. Literature review (2)
3. Analytics (3)
4. Onboarding (2)
5. Embeddings (3)
6. Utilities (3)

### Phase 4: Final Verification - Est. 1 hour
- Run full build
- Verify all routes compile
- Test sample requests
- Update documentation

**Total Estimated Time**: 10-13 hours of focused work

---

## Validation Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema, [YourSchema] } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

export async function VERB(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Validate ID params (if applicable)
    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid ID format')
    }
    const { id } = validation.data

    // 2. Auth check
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new AuthenticationError('Please sign in')
    }

    // 3. Validate request body (if applicable)
    const body = await request.json()
    const bodyValidation = YourSchema.safeParse(body)
    if (!bodyValidation.success) {
      throw new ValidationError(bodyValidation.error.issues[0].message)
    }
    const validatedData = bodyValidation.data

    // 4. Business logic
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Resource not found or access denied')
    }

    // 5. Return response
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Route error:', error)
    return handleAPIError(error)
  }
}
```

---

## Notes
- All schemas are defined in `src/lib/validation/schemas.ts`
- Custom errors are in `src/lib/errors/custom-errors.ts`
- Type definitions are in `src/types/api.ts` and `src/types/supabase-helpers.ts`
- Build currently passing with 0 errors (only ESLint warnings for unused imports)
