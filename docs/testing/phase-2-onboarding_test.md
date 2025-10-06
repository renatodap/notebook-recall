# Phase 2: Onboarding & Quick Wins - Test Plan

**Test Plan Version**: 1.0
**Created**: 2025-01-06
**Coverage Target**: ≥80%
**Status**: Implementation Required

---

## 1. Test Scope

This test plan covers all Phase 2 functionality:
- Demo data generation and seeding
- Quick wins tracking system
- Onboarding flow (4 steps)
- API endpoints with validation and rate limiting
- UI components (QuickWinsTracker)

---

## 2. Unit Tests

### 2.1 `src/lib/onboarding/demo-data.ts`

**Test File**: `src/__tests__/unit/demo-data.test.ts`

#### Test Cases:

| Test ID | Scenario | Input | Expected Output | Priority |
|---------|----------|-------|-----------------|----------|
| DD-01 | Get all demo sources | None | Returns array of 3 DemoSource objects | High |
| DD-02 | Get demo source by index | index: 0 | Returns first DemoSource | High |
| DD-03 | Get demo source by invalid index | index: 999 | Returns null | Medium |
| DD-04 | Get demo source count | None | Returns 3 | Low |
| DD-05 | Verify AI disclaimers | None | All summaries contain AI disclaimer text | High |
| DD-06 | Validate demo source structure | None | All sources have required fields (title, content_type, original_content, summary) | High |
| DD-07 | Validate summary structure | None | All summaries have summary_text, key_actions, key_topics, word_count | High |
| DD-08 | Verify content types | None | All demo sources have content_type: 'text' | Medium |

**Mock Data**: None required (pure functions)

**Coverage Target**: 100%

---

### 2.2 `src/lib/onboarding/quick-wins.ts`

**Test File**: `src/__tests__/unit/quick-wins.test.ts`

#### Test Cases:

| Test ID | Scenario | Input | Expected Output | Priority |
|---------|----------|-------|-----------------|----------|
| QW-01 | Verify QUICK_WINS array length | None | Returns 6 items | High |
| QW-02 | Verify quick win IDs are unique | None | All IDs are unique | High |
| QW-03 | Verify quick win structure | None | All items have id, title, description, icon, order | High |
| QW-04 | Verify ordering | None | Items ordered by 'order' field (0-5) | Medium |
| QW-05 | Verify valid win IDs | None | IDs match expected values (onboarding_started, first_source, etc.) | High |

**Coverage Target**: 100%

---

### 2.3 `src/lib/validation/schemas.ts`

**Test File**: `src/__tests__/unit/validation-schemas.test.ts`

#### Test Cases:

| Test ID | Scenario | Input | Expected Output | Priority |
|---------|----------|-------|-----------------|----------|
| VS-01 | Valid quick win POST | `{ winId: 'first_source' }` | Validation passes | High |
| VS-02 | Invalid quick win ID | `{ winId: 'invalid_win' }` | Validation fails with error | High |
| VS-03 | Missing winId | `{}` | Validation fails | High |
| VS-04 | Empty winId | `{ winId: '' }` | Validation fails | High |
| VS-05 | Valid search request | `{ query: 'test', mode: 'semantic', limit: 10 }` | Validation passes | High |
| VS-06 | Search with empty query | `{ query: '' }` | Validation fails | High |
| VS-07 | Search with too many results | `{ query: 'test', limit: 1000 }` | Validation fails (max 100) | Medium |

**Coverage Target**: 100%

---

## 3. Integration Tests

### 3.1 `GET /api/quick-wins`

**Test File**: `src/__tests__/integration/quick-wins-get.test.ts`

#### Test Cases:

| Test ID | Scenario | Setup | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| QWG-01 | Get wins for authenticated user | User logged in, no wins | Returns empty array | High |
| QWG-02 | Get wins with completed milestones | User has 2 completed wins | Returns array with 2 items | High |
| QWG-03 | Unauthorized request | No auth token | Returns 401 Unauthorized | High |
| QWG-04 | Database error | Mock database failure | Returns 500 with error message | Medium |
| QWG-05 | RLS enforcement | User A tries to access User B's wins | Returns only User A's wins | High |

**Mock Setup**:
- Authenticated user ID
- Supabase mock returning test data
- Database error simulation

**Coverage Target**: ≥80%

---

### 3.2 `POST /api/quick-wins`

**Test File**: `src/__tests__/integration/quick-wins-post.test.ts`

#### Test Cases:

| Test ID | Scenario | Setup | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| QWP-01 | Mark first win as completed | Valid winId: 'first_source' | Returns success with win object | High |
| QWP-02 | Update existing win | Win already exists | Updates completed_at timestamp | High |
| QWP-03 | Invalid winId | winId: 'invalid_win' | Returns 400 with validation error | High |
| QWP-04 | Missing winId | No winId in body | Returns 400 with error | High |
| QWP-05 | Unauthorized request | No auth token | Returns 401 | High |
| QWP-06 | Rate limit exceeded | 11 requests in 1 minute | Returns 429 Too Many Requests | High |
| QWP-07 | Database error | Mock database failure | Returns 500 with user-friendly message | Medium |

**Mock Setup**:
- Authenticated user
- Rate limit store mock
- Supabase upsert mock
- Error simulation

**Coverage Target**: ≥80%

---

### 3.3 `POST /api/onboarding/seed-demo`

**Test File**: `src/__tests__/integration/seed-demo.test.ts`

#### Test Cases:

| Test ID | Scenario | Setup | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| SD-01 | Seed demo for new user | User has 0 sources | Creates 3 sources with summaries, embeddings, tags | High |
| SD-02 | Skip for existing user | User already has sources | Returns success with skipped: true | High |
| SD-03 | Partial failure - source creation | 2/3 sources created | Returns partial success with errors array | Medium |
| SD-04 | Partial failure - summary | Source created but summary fails | Returns success, logs error | Medium |
| SD-05 | Partial failure - embedding | Source/summary created, embedding fails | Returns success, logs error | Medium |
| SD-06 | Complete failure | All sources fail | Returns 500 error | High |
| SD-07 | Unauthorized request | No auth token | Returns 401 | High |
| SD-08 | Rate limit exceeded | 4 requests in 1 hour | Returns 429 | High |
| SD-09 | Mark onboarding_started | Successful seeding | Creates 'onboarding_started' quick win | High |
| SD-10 | Database error on check | Check for existing sources fails | Returns 500 with message | Medium |

**Mock Setup**:
- Authenticated user
- Supabase table mocks (sources, summaries, embeddings, tags, user_quick_wins)
- generateEmbedding mock
- Error simulation for each database operation

**Coverage Target**: ≥80%

---

## 4. E2E Tests

### 4.1 Onboarding Flow

**Test File**: `src/__tests__/e2e/onboarding-flow.test.ts`

#### Test Cases:

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| E2E-01 | Complete onboarding flow | 1. Navigate to /onboarding<br>2. Click "Let's Go"<br>3. Wait for demo seeding<br>4. Enter search query<br>5. Click Search<br>6. Verify success step | All 4 steps complete successfully | High |
| E2E-02 | Skip onboarding | 1. Navigate to /onboarding<br>2. Click "Skip Tutorial" | Redirects to /dashboard | Medium |
| E2E-03 | Error handling - seed failure | 1. Mock seed API to fail<br>2. Click "Let's Go" | Shows error message with retry button | Medium |
| E2E-04 | Error handling - search failure | 1. Complete seeding<br>2. Mock search API to fail<br>3. Click Search | Shows error message | Medium |
| E2E-05 | Custom search query | 1. Complete seeding<br>2. Change search query<br>3. Click Search | Executes custom query | Low |
| E2E-06 | Suggested searches | 1. Complete seeding<br>2. Click suggested query | Populates input field | Low |
| E2E-07 | Success step actions | 1. Complete flow<br>2. Click "Add My First Source" | Redirects to /add | Medium |
| E2E-08 | Success step - explore demo | 1. Complete flow<br>2. Click "Explore Demo Data" | Redirects to /dashboard | Medium |

**Test Environment**:
- Jest with React Testing Library
- Mock Next.js router
- Mock API endpoints
- Test user authentication

**Coverage Target**: ≥70%

---

### 4.2 Quick Wins Tracker Component

**Test File**: `src/__tests__/e2e/quick-wins-tracker.test.tsx`

#### Test Cases:

| Test ID | Scenario | Setup | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| QWT-01 | Display loading state | Initial render | Shows skeleton loader | High |
| QWT-02 | Display compact variant | variant='compact', 2/6 wins | Shows progress bar with 33% | High |
| QWT-03 | Display full variant | variant='full', 2/6 wins | Shows expandable tracker | High |
| QWT-04 | Expand/collapse | Click header button | Toggles checklist visibility | High |
| QWT-05 | Show completed wins | 3 wins completed | Checkmarks on 3 items, circle on 3 | High |
| QWT-06 | Show next win CTA | Collapsed with incomplete wins | Displays next uncompleted win | Medium |
| QWT-07 | Hide when all complete | All 6 wins completed | Component returns null | Medium |
| QWT-08 | Error state with retry | Mock API failure | Shows error with retry button | High |
| QWT-09 | Retry after error | Click retry button | Refetches data | High |
| QWT-10 | Accessibility - ARIA labels | Inspect DOM | All ARIA attributes present | High |
| QWT-11 | Keyboard navigation | Tab through component | Focus indicators visible | Medium |

**Coverage Target**: ≥80%

---

## 5. Accessibility Tests

**Tool**: @testing-library/jest-dom + axe-core

### Test Cases:

| Test ID | Component | Test | Priority |
|---------|-----------|------|----------|
| A11Y-01 | QuickWinsTracker | No WCAG AA violations | High |
| A11Y-02 | QuickWinsTracker | Proper ARIA labels on all interactive elements | High |
| A11Y-03 | QuickWinsTracker | Keyboard navigation (Tab, Enter) | High |
| A11Y-04 | QuickWinsTracker | Screen reader announcements (aria-live) | Medium |
| A11Y-05 | Onboarding page | No WCAG AA violations | High |
| A11Y-06 | Onboarding page | Progress indicator accessible | Medium |
| A11Y-07 | Onboarding page | Form inputs properly labeled | High |

---

## 6. Performance Tests

### Test Cases:

| Test ID | Scenario | Metric | Target | Priority |
|---------|----------|--------|--------|----------|
| PERF-01 | Demo data seeding | API response time | <3 seconds | High |
| PERF-02 | Quick wins GET | API response time | <200ms | Medium |
| PERF-03 | Quick wins POST | API response time | <300ms | Medium |
| PERF-04 | QuickWinsTracker render | Component mount time | <100ms | Low |
| PERF-05 | Onboarding page TTI | Time to Interactive | <2 seconds | Medium |

---

## 7. Security Tests

### Test Cases:

| Test ID | Scenario | Test | Expected Result | Priority |
|---------|----------|------|-----------------|----------|
| SEC-01 | SQL injection | Malicious winId input | Zod validation blocks | High |
| SEC-02 | XSS in demo content | Script tags in demo data | Sanitized output | High |
| SEC-03 | RLS enforcement | User A queries User B's wins | Returns empty/error | High |
| SEC-04 | Rate limit bypass | Rapid requests with different IPs | Rate limit still applies | Medium |
| SEC-05 | Invalid JWT | Expired or malformed token | Returns 401 | High |

---

## 8. Test Data

### Mock Users:
```typescript
const testUser1 = {
  id: 'test-user-1-uuid',
  email: 'test1@example.com',
}

const testUser2 = {
  id: 'test-user-2-uuid',
  email: 'test2@example.com',
}
```

### Mock Quick Wins:
```typescript
const mockQuickWins = [
  {
    id: 'win-1-uuid',
    user_id: 'test-user-1-uuid',
    win_id: 'onboarding_started',
    completed: true,
    completed_at: '2025-01-06T10:00:00Z',
    created_at: '2025-01-06T10:00:00Z',
    updated_at: '2025-01-06T10:00:00Z',
  },
  {
    id: 'win-2-uuid',
    user_id: 'test-user-1-uuid',
    win_id: 'first_source',
    completed: true,
    completed_at: '2025-01-06T10:05:00Z',
    created_at: '2025-01-06T10:05:00Z',
    updated_at: '2025-01-06T10:05:00Z',
  },
]
```

### Mock Demo Sources:
```typescript
const mockDemoSource = {
  id: 'source-1-uuid',
  user_id: 'test-user-1-uuid',
  title: 'Test Demo Source',
  content_type: 'text',
  original_content: 'Test content...',
  url: null,
  created_at: '2025-01-06T10:00:00Z',
  updated_at: '2025-01-06T10:00:00Z',
}
```

---

## 9. Test Execution

### Command:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- demo-data.test.ts
npm test -- quick-wins-get.test.ts
npm test -- onboarding-flow.test.ts

# Watch mode
npm test -- --watch
```

### CI/CD Integration:
- Tests must pass before merging to `main`
- Coverage report generated on every PR
- Minimum 80% coverage required

---

## 10. Test Checklist

Before marking Phase 2 as production-ready:

- [ ] All unit tests written and passing (100% coverage)
- [ ] All integration tests written and passing (≥80% coverage)
- [ ] E2E tests for critical flows passing (≥70% coverage)
- [ ] Accessibility tests passing (WCAG AA compliance)
- [ ] Performance targets met
- [ ] Security tests passing
- [ ] No flaky tests (all pass 10 times consecutively)
- [ ] Test documentation complete
- [ ] Mock data fixtures created
- [ ] CI/CD pipeline configured

---

## 11. Known Issues / Edge Cases

1. **Embedding generation failures**: If OpenAI API is down during demo seeding, embeddings won't be created. This is handled gracefully (logged as error, but seeding continues).

2. **Race conditions**: If user clicks "Let's Go" multiple times rapidly, rate limiting prevents duplicate demo data creation.

3. **Partial failures**: If 1/3 demo sources fail to create, the API returns partial success. This needs clear user communication.

4. **Browser refresh during onboarding**: User loses progress if they refresh during the onboarding flow. Consider adding session storage to preserve state.

---

## 12. Future Test Enhancements

1. **Visual regression tests**: Use Percy or Chromatic for UI snapshot testing
2. **Load testing**: Test demo seeding with 100 concurrent users
3. **Error recovery tests**: Test automatic retry logic
4. **Cross-browser testing**: Verify in Chrome, Firefox, Safari, Edge
5. **Mobile testing**: Test onboarding flow on iOS/Android
6. **Internationalization tests**: When i18n is added, test all languages

---

**Test Plan Owner**: Development Team
**Last Updated**: 2025-01-06
**Next Review Date**: After Phase 2 completion
