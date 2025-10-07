# Gemini Embeddings Integration - Test Plan

**Feature**: Dual-provider embedding system with Gemini + OpenAI
**Test Coverage Target**: ≥80%
**Author**: Claude Code
**Date**: 2025-10-06

---

## 1. Test Strategy Overview

### Test Pyramid
```
        ┌──────────────┐
        │   Manual     │  5% - Real API testing
        │   Testing    │
        ├──────────────┤
        │ Integration  │  15% - End-to-end flows
        │   Tests      │
        ├──────────────┤
        │  Unit Tests  │  80% - Component isolation
        └──────────────┘
```

### Testing Approach
- **Test-Driven Development (TDD)**: Write tests BEFORE implementation
- **Mocking**: Mock external APIs (Gemini, OpenAI) for unit tests
- **Real API**: Use real APIs only in manual testing phase
- **Coverage**: Aim for 80% overall, 100% for critical paths

---

## 2. Unit Tests

### 2.1 Gemini Client Tests (`lib/embeddings/__tests__/gemini.test.ts`)

#### Test Suite: `GeminiEmbeddingClient`

| Test ID | Scenario | Expected Input | Expected Output | Pass Criteria |
|---------|----------|----------------|-----------------|---------------|
| GC-001 | Generate embedding with valid text | `{ text: "Hello world", outputDimensionality: 1536 }` | `{ embedding: number[1536], model: "gemini-embedding-001", tokenCount: 2 }` | ✅ Returns 1536-dim vector |
| GC-002 | Handle empty text | `{ text: "" }` | Throws `ValidationError` | ✅ Error message: "Text cannot be empty" |
| GC-003 | Handle text too long (>2048 tokens) | `{ text: "a".repeat(10000) }` | Throws `ValidationError` | ✅ Error message: "Text exceeds max length" |
| GC-004 | Handle API error (500) | Valid text + mock 500 response | Retries 3 times, then throws `APIError` | ✅ Retry logic executed, error logged |
| GC-005 | Handle rate limit (429) | Valid text + mock 429 response | Throws `RateLimitError` | ✅ Error code: 429, retryable: false |
| GC-006 | Handle invalid API key | Valid text + mock 401 response | Throws `AuthenticationError` | ✅ Error message: "Invalid API key" |
| GC-007 | Normalize embedding vector | `{ text: "Test", normalize: true }` | Vector magnitude = 1.0 (±0.001) | ✅ Normalized vector |
| GC-008 | Generate with different dimensions | `{ text: "Test", outputDimensionality: 768 }` | `embedding.length === 768` | ✅ Correct dimension |
| GC-009 | Retry on transient failure | Valid text + mock 503 → 200 on retry | `embedding` returned after retry | ✅ Retry successful, no error |
| GC-010 | Respect task type parameter | `{ text: "Query", taskType: "RETRIEVAL_QUERY" }` | Request includes taskType | ✅ Gemini API receives correct taskType |

**Mock Data**:
```typescript
const mockGeminiResponse = {
  embeddings: [{
    values: new Array(1536).fill(0).map(() => Math.random())
  }]
};
```

---

### 2.2 Rate Limiter Tests (`lib/embeddings/__tests__/rate-limiter.test.ts`)

#### Test Suite: `RateLimiter`

| Test ID | Scenario | Setup | Action | Expected Result |
|---------|----------|-------|--------|-----------------|
| RL-001 | Allow within RPM limit | No prior requests | Call `checkLimit(15, 1500)` | Returns `true` |
| RL-002 | Block at RPM limit | 15 requests in last minute | Call `checkLimit(15, 1500)` | Returns `false` |
| RL-003 | Block at daily limit | 1500 requests in last 24h | Call `checkLimit(15, 1500)` | Returns `false` |
| RL-004 | Reset after 1 minute | 15 requests at t=0, call at t=61s | Call `checkLimit(15, 1500)` | Returns `true` (oldest removed) |
| RL-005 | Reset after 24 hours | 1500 requests at t=0, call at t=24h+1s | Call `checkLimit(15, 1500)` | Returns `true` (daily reset) |
| RL-006 | Handle concurrent requests | 10 parallel calls | All call `checkLimit(15, 1500)` | Max 15 return `true` |
| RL-007 | Track per-user limits | User A hits limit, User B requests | Check User B limit | User B not affected |

**Test Data**:
```typescript
// Simulate 15 requests in 1 minute
const timestamps = Array.from({ length: 15 }, (_, i) => Date.now() - i * 3000);
```

---

### 2.3 Provider Selection Tests (`lib/embeddings/__tests__/provider.test.ts`)

#### Test Suite: `EmbeddingProvider`

| Test ID | Scenario | Config | Mock Behavior | Expected Provider | Expected Result |
|---------|----------|--------|---------------|-------------------|-----------------|
| PS-001 | Use Gemini when available | `strategy: 'dual'` | Gemini 200 OK | Gemini | ✅ Gemini embedding returned |
| PS-002 | Fallback to OpenAI on Gemini rate limit | `strategy: 'dual'` | Gemini 429 → OpenAI 200 | OpenAI | ✅ OpenAI embedding returned, logged fallback |
| PS-003 | Fallback to OpenAI on Gemini error | `strategy: 'dual'` | Gemini 500 → OpenAI 200 | OpenAI | ✅ OpenAI embedding returned after retries |
| PS-004 | Use only Gemini when configured | `strategy: 'gemini-only'` | Gemini 200 OK | Gemini | ✅ Gemini embedding, no OpenAI call |
| PS-005 | Fail when Gemini-only fails | `strategy: 'gemini-only'` | Gemini 500 (all retries) | None | ❌ Throws error (no fallback) |
| PS-006 | Use only OpenAI when configured | `strategy: 'openai-only'` | OpenAI 200 OK | OpenAI | ✅ OpenAI embedding, no Gemini call |
| PS-007 | Auto-fallback for long text (>2048 tokens) | `strategy: 'dual'` | Text length check | OpenAI | ✅ Skip Gemini, use OpenAI directly |
| PS-008 | Log provider switch | `strategy: 'dual'` | Gemini 429 → OpenAI 200 | OpenAI | ✅ Log includes: `fallback_reason: 'rate_limit'` |
| PS-009 | Fail when both providers fail | `strategy: 'dual'` | Gemini 500, OpenAI 500 | None | ❌ Throws `EmbeddingError` |
| PS-010 | Respect rate limits before API call | `strategy: 'dual'` | Rate limiter returns false | OpenAI | ✅ Skip Gemini, use OpenAI (no API call to Gemini) |

**Mock Data**:
```typescript
const mockProviderConfig: ProviderConfig = {
  strategy: 'dual',
  geminiRateLimitRPM: 15,
  geminiRateLimitDaily: 1500,
  fallbackEnabled: true,
  costLoggingEnabled: true
};
```

---

### 2.4 Cost Tracker Tests (`lib/embeddings/__tests__/cost-tracker.test.ts`)

#### Test Suite: `CostTracker`

| Test ID | Scenario | Input | Expected Calculation | Pass Criteria |
|---------|----------|-------|---------------------|---------------|
| CT-001 | Calculate Gemini free tier cost | `{ provider: 'gemini', tokens: 100 }` | `cost: 0.00` | ✅ Free tier = $0 |
| CT-002 | Calculate Gemini paid tier cost | `{ provider: 'gemini', tokens: 1_000_000 }` | `cost: 0.001` | ✅ $0.001/1M tokens |
| CT-003 | Calculate OpenAI cost | `{ provider: 'openai', tokens: 1_000_000 }` | `cost: 0.02` | ✅ $0.02/1M tokens |
| CT-004 | Aggregate daily costs | 5 Gemini calls, 3 OpenAI calls | `{ gemini: 0.00, openai: 0.06 }` | ✅ Correct totals |
| CT-005 | Aggregate monthly costs | 30 days of usage | `{ gemini: 0.00, openai: 1.80, total: 1.80 }` | ✅ Correct monthly sum |
| CT-006 | Track free tier usage | 100 Gemini calls | `{ freeRequests: 100, paidRequests: 0 }` | ✅ All free tier |
| CT-007 | Alert on approaching limit | 1400 Gemini calls today | `shouldAlert: true` | ✅ Alert at 93% of daily limit |
| CT-008 | Log API call with metadata | Full API call data | Log entry created | ✅ Log includes provider, model, tokens, cost, timestamp, user_id |

**Test Data**:
```typescript
const mockApiCall = {
  provider: 'gemini',
  model: 'gemini-embedding-001',
  tokens: 120,
  cost: 0.00,
  timestamp: '2025-10-06T10:30:00Z',
  user_id: 'user-123'
};
```

---

### 2.5 Type Validation Tests (`lib/embeddings/__tests__/types.test.ts`)

#### Test Suite: `TypeDefinitions`

| Test ID | Scenario | Input | Zod Validation | Expected Result |
|---------|----------|-------|----------------|-----------------|
| TV-001 | Valid Gemini request | `{ text: "Test", outputDimensionality: 1536 }` | Parse success | ✅ Valid schema |
| TV-002 | Invalid dimension | `{ text: "Test", outputDimensionality: 999 }` | Parse failure | ❌ Error: dimension must be 768/1536/3072 |
| TV-003 | Missing text | `{ outputDimensionality: 1536 }` | Parse failure | ❌ Error: text is required |
| TV-004 | Invalid task type | `{ text: "Test", taskType: "INVALID" }` | Parse failure | ❌ Error: invalid task type |
| TV-005 | Valid provider config | `{ strategy: 'dual', ... }` | Parse success | ✅ Valid config |
| TV-006 | Invalid strategy | `{ strategy: 'invalid' }` | Parse failure | ❌ Error: invalid strategy |

**Zod Schemas**:
```typescript
import { z } from 'zod';

const GeminiRequestSchema = z.object({
  text: z.string().min(1),
  outputDimensionality: z.enum([768, 1536, 3072]).default(1536),
  taskType: z.enum(['RETRIEVAL_QUERY', 'RETRIEVAL_DOCUMENT', 'SEMANTIC_SIMILARITY']).optional()
});
```

---

## 3. Integration Tests

### 3.1 End-to-End Embedding Generation (`__tests__/integration/gemini-embedding-e2e.test.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| E2E-001 | Create source with Gemini embedding | 1. POST /api/sources with text<br>2. Check summaries table | ✅ Summary created with 1536-dim embedding |
| E2E-002 | Search with Gemini embedding | 1. Create source with Gemini<br>2. GET /api/search?q=query | ✅ Source found in search results |
| E2E-003 | Mixed provider search | 1. Create source A (OpenAI)<br>2. Create source B (Gemini)<br>3. Search | ✅ Both sources found (compatible embeddings) |
| E2E-004 | Fallback during source creation | 1. Mock Gemini 429<br>2. POST /api/sources | ✅ Source created with OpenAI embedding (no user-facing error) |
| E2E-005 | Rate limit recovery | 1. Trigger 15 Gemini requests<br>2. Wait 61 seconds<br>3. Request again | ✅ Gemini used again after cooldown |

---

### 3.2 Fallback Behavior Tests (`__tests__/integration/provider-fallback.test.ts`)

| Test ID | Scenario | Mock Setup | Action | Expected Behavior |
|---------|----------|------------|--------|-------------------|
| FB-001 | Immediate fallback on 429 | Gemini returns 429 | Call generateEmbedding | ✅ OpenAI called without retry delay |
| FB-002 | Retry then fallback on 500 | Gemini returns 500 (3x) | Call generateEmbedding | ✅ 3 retries, then fallback to OpenAI |
| FB-003 | Success after retry | Gemini returns 503 → 200 | Call generateEmbedding | ✅ Gemini embedding returned after 1 retry |
| FB-004 | Log fallback event | Gemini 429 → OpenAI 200 | Call generateEmbedding | ✅ Log: `{ event: 'fallback', reason: 'rate_limit', provider: 'openai' }` |
| FB-005 | No fallback in gemini-only mode | Config: gemini-only, Gemini 500 | Call generateEmbedding | ❌ Throws error (no OpenAI call) |

---

## 4. Manual Testing

### 4.1 Real API Testing

| Test ID | Description | Steps | Success Criteria |
|---------|-------------|-------|------------------|
| MAN-001 | Gemini embedding generation | 1. Set GOOGLE_GEMINI_API_KEY<br>2. Run `npm run test:manual gemini` | ✅ 1536-dim embedding returned, cost = $0.00 |
| MAN-002 | OpenAI embedding generation | 1. Run `npm run test:manual openai` | ✅ 1536-dim embedding returned, cost logged |
| MAN-003 | Semantic search with Gemini | 1. Create 10 sources<br>2. Search for "machine learning" | ✅ Relevant sources ranked by similarity |
| MAN-004 | Semantic search with mixed embeddings | 1. Create 5 OpenAI sources<br>2. Create 5 Gemini sources<br>3. Search | ✅ All 10 sources searchable, no errors |
| MAN-005 | Rate limit handling | 1. Generate 16 embeddings rapidly | ✅ First 15 use Gemini, 16th uses OpenAI |
| MAN-006 | Long text handling | 1. Generate embedding for 10,000-char text | ✅ Auto-fallback to OpenAI (Gemini max = 2048 tokens) |
| MAN-007 | Cost tracking | 1. Generate 100 embeddings<br>2. Check logs | ✅ Costs logged: Gemini $0.00, OpenAI (if any) calculated correctly |
| MAN-008 | Error handling | 1. Provide invalid API key<br>2. Generate embedding | ✅ Clear error message, fallback works |

---

## 5. Performance Testing

### 5.1 Latency Tests

| Test ID | Scenario | Setup | Measurement | Target |
|---------|----------|-------|-------------|--------|
| PERF-001 | Gemini latency (cold start) | First request of day | Time to first byte | <500ms |
| PERF-002 | Gemini latency (warm) | 10th request | Time to first byte | <200ms |
| PERF-003 | OpenAI latency | Standard request | Time to first byte | <200ms |
| PERF-004 | Fallback latency | Gemini 429 → OpenAI | Total time (retry + fallback) | <1000ms |
| PERF-005 | Bulk embedding generation | 100 embeddings sequentially | Total time | <30s (avg 300ms/embedding) |

---

### 5.2 Load Tests

| Test ID | Scenario | Load | Duration | Success Criteria |
|---------|----------|------|----------|------------------|
| LOAD-001 | Sustained Gemini usage | 10 req/min | 10 minutes | ✅ No rate limit errors, all requests succeed |
| LOAD-002 | Burst traffic | 20 req/min | 1 minute | ✅ First 15 use Gemini, rest use OpenAI |
| LOAD-003 | Daily limit test | 1500 requests | 24 hours | ✅ All succeed via Gemini free tier |
| LOAD-004 | Exceed daily limit | 2000 requests | 24 hours | ✅ First 1500 Gemini, next 500 OpenAI |

---

## 6. Edge Case Testing

### 6.1 Edge Cases

| Test ID | Scenario | Input | Expected Handling |
|---------|----------|-------|-------------------|
| EDGE-001 | Unicode text | `"こんにちは世界 🌍"` | ✅ Embedding generated correctly |
| EDGE-002 | Extremely short text | `"a"` | ✅ Embedding generated (1 token) |
| EDGE-003 | Text with special characters | `"<script>alert('xss')</script>"` | ✅ Sanitized, embedding generated |
| EDGE-004 | Null/undefined text | `null` | ❌ Throws ValidationError before API call |
| EDGE-005 | Concurrent requests to same provider | 10 parallel Gemini calls | ✅ Rate limiter handles concurrency |
| EDGE-006 | Network timeout | Mock 30s delay | ✅ Timeout after 10s, retry |
| EDGE-007 | Malformed API response | Invalid JSON | ✅ Throws APIError, fallback works |
| EDGE-008 | Embedding dimension mismatch | Gemini returns 768 instead of 1536 | ❌ Validation error, retry with correct config |

---

## 7. Security Testing

### 7.1 Security Tests

| Test ID | Scenario | Attack Vector | Expected Defense |
|---------|----------|---------------|------------------|
| SEC-001 | API key exposure | Log error with API key in message | ✅ API key redacted in logs |
| SEC-002 | Prompt injection | `"Ignore previous instructions and..."` | ✅ Input sanitized before embedding |
| SEC-003 | Rate limit abuse | 1000 requests from same user | ✅ Rate limiter blocks after daily limit |
| SEC-004 | SQL injection in logging | Text with SQL commands | ✅ Parameterized queries, no SQL execution |
| SEC-005 | XSS in error messages | Malicious HTML in text | ✅ Error messages sanitized |

---

## 8. Regression Testing

### 8.1 Backward Compatibility

| Test ID | Scenario | Setup | Validation |
|---------|----------|-------|------------|
| REG-001 | Existing OpenAI embeddings still searchable | Existing database with OpenAI embeddings | ✅ Search works, results ranked correctly |
| REG-002 | No breaking changes to API | Deploy new code | ✅ All existing endpoints return same structure |
| REG-003 | Existing tests still pass | Run full test suite | ✅ 100% existing tests pass |
| REG-004 | Environment variable compatibility | Add GOOGLE_GEMINI_API_KEY | ✅ App works with/without new env var |

---

## 9. Test Coverage Goals

### Coverage Targets

| Component | Target Coverage | Critical Paths |
|-----------|----------------|----------------|
| Gemini Client | 90% | ✅ API calls, error handling, retries |
| Rate Limiter | 95% | ✅ RPM check, daily limit, concurrent requests |
| Provider Selection | 90% | ✅ Fallback logic, provider routing |
| Cost Tracker | 85% | ✅ Cost calculation, logging |
| Integration Tests | 80% | ✅ E2E flows, fallback scenarios |
| **Overall** | **≥80%** | ✅ All critical paths 100% |

---

## 10. Test Data & Fixtures

### Mock Embeddings
```typescript
export const mockEmbedding1536 = new Array(1536).fill(0).map(() => Math.random());
export const mockEmbedding768 = new Array(768).fill(0).map(() => Math.random());
export const mockEmbedding3072 = new Array(3072).fill(0).map(() => Math.random());
```

### Mock API Responses
```typescript
export const mockGeminiSuccess = {
  embeddings: [{ values: mockEmbedding1536 }]
};

export const mockGeminiRateLimit = {
  error: {
    code: 429,
    message: 'Rate limit exceeded'
  }
};

export const mockOpenAISuccess = {
  data: [{ embedding: mockEmbedding1536 }],
  usage: { total_tokens: 120 }
};
```

### Test Users
```typescript
export const testUsers = {
  regularUser: { id: 'user-regular', name: 'Regular User' },
  powerUser: { id: 'user-power', name: 'Power User (high volume)' },
  rateLimitedUser: { id: 'user-limited', name: 'User who hit rate limit' }
};
```

---

## 11. Test Execution Plan

### Phase 1: Unit Tests (TDD)
1. Write `gemini.test.ts` ✅
2. Write `rate-limiter.test.ts` ✅
3. Write `provider.test.ts` ✅
4. Write `cost-tracker.test.ts` ✅
5. Write `types.test.ts` ✅
6. **Run tests (should fail initially)** ❌
7. Implement features
8. **Run tests (should pass)** ✅

### Phase 2: Integration Tests
1. Write `gemini-embedding-e2e.test.ts` ✅
2. Write `provider-fallback.test.ts` ✅
3. **Run integration tests** ✅
4. Fix any failures
5. **Verify coverage ≥80%** ✅

### Phase 3: Manual Testing
1. Test with real Gemini API key
2. Test with real OpenAI API key
3. Test rate limiting (trigger 15+ requests)
4. Test cost tracking (verify logs)
5. Test search quality (create sources, search)

### Phase 4: Performance & Load Testing
1. Measure latency (Gemini vs OpenAI)
2. Simulate burst traffic
3. Simulate sustained usage
4. Verify rate limits enforced

### Phase 5: Production Validation
1. Deploy to staging
2. Run smoke tests
3. Monitor logs for errors
4. Verify cost reduction
5. Deploy to production (10% rollout)

---

## 12. Success Criteria

### Tests Pass When:
- ✅ All unit tests pass (100%)
- ✅ All integration tests pass (100%)
- ✅ Code coverage ≥80%
- ✅ Manual testing successful with real APIs
- ✅ No regression (existing tests still pass)
- ✅ Performance targets met (<300ms P95)
- ✅ Security tests pass (no data leaks)

### Feature Ready When:
- ✅ Test coverage ≥80%
- ✅ All critical paths tested
- ✅ Fallback behavior validated
- ✅ Cost tracking verified
- ✅ Rate limiting enforced
- ✅ Error handling comprehensive
- ✅ No breaking changes

---

## 13. Test Maintenance

### Ongoing Testing
- Run tests on every commit (CI/CD)
- Monthly manual testing with real APIs
- Quarterly load testing
- Update tests when APIs change

### Test Documentation
- Keep test plan updated with implementation
- Document new edge cases discovered
- Maintain mock data library
- Share test results with team

---

**Test Plan Complete. Ready for Step 4: Implementation.**
