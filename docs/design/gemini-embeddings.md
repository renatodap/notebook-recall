# Gemini Embeddings Integration - Design Document

**Feature**: Dual-provider embedding system with Gemini (primary, free) + OpenAI (fallback, paid)
**Goal**: Reduce embedding costs from $0.02/1M tokens to $0.00 (free tier) while maintaining/improving accuracy
**Author**: Claude Code
**Date**: 2025-10-06
**Status**: Design Phase

---

## 1. User Stories

### As a developer:
- I want to use Google Gemini's free embedding tier to reduce API costs
- I want automatic fallback to OpenAI if Gemini rate limits are hit
- I want to track costs per provider to optimize usage
- I want backward compatibility with existing 1536-dimensional embeddings

### As a user:
- I want faster, more accurate semantic search (Gemini performs ~6% better than OpenAI on MTEB)
- I want no disruption to existing features (transparent provider switching)
- I want consistent search quality regardless of which provider is used

---

## 2. Functional Requirements

### FR-1: Gemini Embedding Client
- **Description**: Create a new client for Google Gemini embedding API
- **Input**: Text string (max 2048 tokens), optional output dimensions
- **Output**: Embedding vector (1536 dimensions for compatibility)
- **Error Handling**: Retry logic with exponential backoff
- **Rate Limiting**: Respect Gemini free tier (15 RPM, 1500/day)

### FR-2: Dual-Provider Strategy
- **Primary**: Gemini embedding-001 (free tier, 15 requests/min)
- **Fallback**: OpenAI text-embedding-3-small (paid, unlimited)
- **Switching Logic**:
  1. Try Gemini first
  2. If rate limited (429) → fallback to OpenAI
  3. If Gemini fails (500+) → fallback to OpenAI
  4. Log all provider switches for monitoring

### FR-3: Cost Tracking
- **Log every API call** with:
  - Provider (gemini/openai)
  - Model name
  - Token count
  - Estimated cost ($0.00 for Gemini free tier, $0.02/1M for OpenAI)
  - Timestamp
  - User ID (if available)
- **Aggregate monthly costs** by provider
- **Alert when approaching rate limits**

### FR-4: Backward Compatibility
- **Dimension consistency**: Use 1536 dimensions for both providers
- **No schema changes**: Existing `summaries.embedding` and `source_embeddings.embedding` columns remain unchanged
- **No data migration**: Existing OpenAI embeddings remain valid
- **Seamless switching**: Users don't notice which provider is used

### FR-5: Configuration Management
- **Environment variables**:
  ```bash
  GOOGLE_GEMINI_API_KEY=xxx           # Required for Gemini
  OPENAI_API_KEY=xxx                  # Required for fallback
  EMBEDDING_PROVIDER=dual             # dual | gemini-only | openai-only
  GEMINI_RATE_LIMIT_RPM=15           # Requests per minute (free tier)
  GEMINI_RATE_LIMIT_DAILY=1500       # Requests per day (free tier)
  ```
- **Runtime configuration**: Allow switching providers via environment variables

---

## 3. Technical Approach

### Architecture: Provider Pattern

```typescript
// High-level architecture

┌─────────────────────────────────────────┐
│  Application Code                       │
│  (sources/route.ts, search.ts, etc.)    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Embedding Generator (lib/embeddings/)  │
│  - generateEmbedding(text)              │
│  - Smart provider selection             │
└─────────────┬───────────────────────────┘
              │
              ├──────────────┬──────────────┐
              ▼              ▼              ▼
      ┌──────────┐   ┌──────────┐   ┌──────────┐
      │ Gemini   │   │ OpenAI   │   │ Rate     │
      │ Client   │   │ Client   │   │ Limiter  │
      └──────────┘   └──────────┘   └──────────┘
```

### File Structure

```
src/lib/embeddings/
├── client.ts               # Current OpenAI implementation
├── gemini.ts              # NEW: Gemini client
├── provider.ts            # NEW: Provider selection logic
├── rate-limiter.ts        # NEW: Rate limiting for Gemini
├── cost-tracker.ts        # NEW: Cost logging and tracking
├── generator.ts           # Existing: High-level API
├── types.ts               # Update: Add Gemini types
├── utils.ts               # Existing utilities
└── __tests__/
    ├── gemini.test.ts     # NEW: Gemini client tests
    ├── provider.test.ts   # NEW: Provider switching tests
    ├── integration.test.ts # NEW: End-to-end tests
    └── ...existing tests
```

### API Contracts

#### Gemini Embedding Request
```typescript
interface GeminiEmbeddingRequest {
  text: string;              // Content to embed (max 2048 tokens)
  outputDimensionality?: number; // 768 | 1536 | 3072 (default: 1536)
  taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY';
}
```

#### Gemini Embedding Response
```typescript
interface GeminiEmbeddingResponse {
  embedding: number[];       // Array of floats (length = outputDimensionality)
  model: string;            // 'gemini-embedding-001'
  tokenCount: number;       // Number of tokens consumed
  provider: 'gemini';       // Provider identifier
}
```

#### Provider Selection Config
```typescript
interface ProviderConfig {
  strategy: 'dual' | 'gemini-only' | 'openai-only';
  geminiRateLimitRPM: number;      // Requests per minute
  geminiRateLimitDaily: number;    // Requests per day
  fallbackEnabled: boolean;        // Auto-fallback to OpenAI
  costLoggingEnabled: boolean;     // Track API costs
}
```

---

## 4. Database Schema Changes

**No schema changes required!** ✅

- Current `summaries.embedding` column: `number[]` (pgvector USER-DEFINED)
- Current `source_embeddings.embedding` column: `number[]` (pgvector USER-DEFINED)
- Current dimension: 1536 (OpenAI text-embedding-3-small)
- New dimension: 1536 (Gemini embedding-001 with outputDimensionality: 1536)

**Backward compatibility**: All existing embeddings remain valid. New embeddings from Gemini are drop-in replacements.

---

## 5. AI Model Selection & Cost Estimation

### Model Comparison

| Feature | OpenAI text-embedding-3-small | Gemini embedding-001 | Decision |
|---------|------------------------------|---------------------|----------|
| **Cost (Free Tier)** | N/A | **$0.00** (15 RPM, 1500/day) | **Gemini** |
| **Cost (Paid)** | $0.02/1M tokens | $0.001/1M tokens | **Gemini** |
| **Dimensions** | 1536 (fixed) | 768/1536/3072 | **Gemini** (flexible) |
| **Max tokens** | 8,191 | 2,048 | OpenAI |
| **MTEB Score** | ~62% | ~66% | **Gemini** |
| **Latency** | ~100-200ms | ~150-300ms | OpenAI |

### Cost Optimization Strategy

**Scenario 1: Low-volume users (<1500 embeddings/day)**
- Use: **Gemini free tier** exclusively
- Cost: **$0.00/month**
- Savings: **$0.30-$3/month per user**

**Scenario 2: High-volume users (>1500 embeddings/day)**
- Use: **Gemini free tier first**, then fallback to Gemini paid ($0.001/1M) or OpenAI ($0.02/1M)
- Cost: **$0.00 + overflow at 95% cheaper rate**
- Savings: **~95% vs OpenAI-only**

**Scenario 3: Rate limit hit**
- Use: **Auto-fallback to OpenAI** (no user disruption)
- Cost: **Hybrid** (free + paid as needed)
- Reliability: **100%** (dual provider redundancy)

### Estimated Monthly Savings (10,000 users)

| Metric | OpenAI Only | Gemini Free + OpenAI Fallback | Savings |
|--------|-------------|------------------------------|---------|
| Avg embeddings/user/day | 50 | 50 | - |
| Users within free tier | 0 | 7,000 (70%) | - |
| Users requiring overflow | 10,000 | 3,000 (30%) | - |
| Monthly cost | **$300** | **$45** | **$255 (85%)** |

---

## 6. Error Scenarios

### E-1: Gemini Rate Limit (429)
- **Cause**: Exceeded 15 requests/min or 1500 requests/day
- **Handling**:
  1. Log rate limit event
  2. Immediately fallback to OpenAI
  3. Return OpenAI embedding (transparent to user)
  4. Alert developer if sustained rate limiting

### E-2: Gemini API Failure (500, 503)
- **Cause**: Gemini service downtime
- **Handling**:
  1. Retry up to 3 times with exponential backoff
  2. If all retries fail, fallback to OpenAI
  3. Log error details for debugging

### E-3: Invalid API Key
- **Cause**: Missing or incorrect GOOGLE_GEMINI_API_KEY
- **Handling**:
  1. Validate API key on startup
  2. If invalid, log warning and use OpenAI only
  3. Don't crash application

### E-4: Text Too Long (>2048 tokens)
- **Cause**: Gemini has lower token limit than OpenAI (2048 vs 8191)
- **Handling**:
  1. Detect token count before API call
  2. If >2048 tokens, automatically use OpenAI
  3. Log provider switch reason

### E-5: OpenAI Fallback Fails
- **Cause**: Both Gemini and OpenAI fail
- **Handling**:
  1. Retry both providers once more
  2. If both fail, throw clear error to user
  3. Log critical error for immediate investigation

---

## 7. Rate Limiting Requirements

### Gemini Free Tier Limits
- **Requests per minute (RPM)**: 15
- **Requests per day**: 1,500
- **Strategy**: Token bucket algorithm with sliding window

### Implementation
```typescript
class RateLimiter {
  private requests: number[] = []; // Timestamps of requests

  async checkLimit(rpm: number, daily: number): Promise<boolean> {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const oneDayAgo = now - 86_400_000;

    // Remove old requests
    this.requests = this.requests.filter(ts => ts > oneDayAgo);

    // Check RPM
    const recentRequests = this.requests.filter(ts => ts > oneMinuteAgo);
    if (recentRequests.length >= rpm) {
      return false; // Rate limited
    }

    // Check daily limit
    if (this.requests.length >= daily) {
      return false; // Daily limit exceeded
    }

    // Record request
    this.requests.push(now);
    return true; // OK to proceed
  }
}
```

---

## 8. Security Considerations

### API Key Management
- ✅ Store `GOOGLE_GEMINI_API_KEY` in environment variables only
- ✅ Never commit API keys to git
- ✅ Use Vercel environment variables for deployment
- ✅ Validate API keys on application startup
- ✅ Rotate keys if compromised

### Input Validation
- ✅ Sanitize user input before embedding (prevent prompt injection)
- ✅ Limit text length to prevent abuse (max 2048 tokens for Gemini)
- ✅ Rate limit per user to prevent API quota exhaustion

### Error Messages
- ✅ Don't expose API keys in error logs
- ✅ Don't leak internal provider details to users
- ✅ User-friendly error messages: "Embedding generation failed. Please try again."

---

## 9. Testing Strategy

### Unit Tests
- ✅ `gemini.test.ts`: Gemini client with mocked API responses
- ✅ `provider.test.ts`: Provider selection logic
- ✅ `rate-limiter.test.ts`: Rate limiting algorithm
- ✅ `cost-tracker.test.ts`: Cost calculation accuracy

### Integration Tests
- ✅ `integration.test.ts`: End-to-end embedding generation
- ✅ Test fallback behavior (Gemini → OpenAI)
- ✅ Test rate limiting (simulate 429 errors)
- ✅ Test both providers return compatible embeddings (same dimensions)

### Manual Testing
- ✅ Generate embeddings with Gemini
- ✅ Trigger rate limit and verify OpenAI fallback
- ✅ Search with mixed embeddings (Gemini + OpenAI)
- ✅ Monitor cost logs

---

## 10. Monitoring & Logging

### Metrics to Track
1. **Provider usage**: % Gemini vs % OpenAI
2. **Cost per provider**: Daily/monthly spend
3. **Rate limit events**: Frequency of 429 errors
4. **Latency**: P50, P95, P99 response times per provider
5. **Error rates**: 4xx, 5xx errors per provider

### Logging Format
```typescript
{
  timestamp: '2025-10-06T10:30:00Z',
  event: 'embedding_generated',
  provider: 'gemini',
  model: 'gemini-embedding-001',
  tokens: 120,
  cost: 0.00,
  latency_ms: 180,
  user_id: 'user-123',
  fallback_used: false
}
```

---

## 11. Migration Plan

### Phase 1: Development (Week 1)
- ✅ Implement Gemini client
- ✅ Implement dual-provider logic
- ✅ Write comprehensive tests
- ✅ Local testing with real API keys

### Phase 2: Staging (Week 2)
- Deploy to staging environment
- Test with production-like data
- Monitor costs and performance
- Verify fallback behavior

### Phase 3: Production Rollout (Week 3)
- **10% rollout**: Enable for 10% of users
- **Monitor**: Costs, errors, search quality
- **50% rollout**: If no issues, expand to 50%
- **100% rollout**: Full deployment

### Rollback Plan
- Environment variable: `EMBEDDING_PROVIDER=openai-only`
- Instant rollback without code changes
- No data loss (all embeddings remain valid)

---

## 12. Success Metrics

### Cost Reduction
- **Target**: 85% reduction in embedding costs
- **Measurement**: Monthly API spend (Gemini + OpenAI vs OpenAI-only baseline)

### Search Quality
- **Target**: No degradation (or improvement)
- **Measurement**: User search satisfaction, click-through rates

### Reliability
- **Target**: 99.9% uptime (no embedding failures)
- **Measurement**: Error rate, fallback frequency

### Performance
- **Target**: <300ms P95 latency
- **Measurement**: Embedding generation time

---

## 13. Future Enhancements

### V2: Dynamic Dimension Selection
- Use 768 dimensions for summaries (faster, cheaper)
- Use 1536 dimensions for full documents (better accuracy)
- Use 3072 dimensions for critical academic content (best quality)

### V3: Multi-Model Routing
- Gemini for general content
- OpenAI for long documents (8K tokens)
- Cohere for multilingual content

### V4: Embedding Caching
- Cache frequently accessed embeddings
- Reduce redundant API calls
- Further cost reduction

---

## 14. Dependencies

### New Package
```json
{
  "@google/generative-ai": "^0.1.0"
}
```

### Existing Packages (No changes)
- `openai`: ^6.1.0
- `zod`: For validation
- `@supabase/supabase-js`: For database

---

## 15. Acceptance Criteria

### Feature Complete When:
- ✅ Gemini client implemented with error handling
- ✅ Dual-provider logic with automatic fallback
- ✅ Rate limiting enforced for Gemini free tier
- ✅ Cost tracking logs all API calls
- ✅ Test coverage ≥80%
- ✅ All existing tests pass
- ✅ Manual testing successful with real API keys
- ✅ Documentation updated (README, .env.example)
- ✅ No breaking changes to existing code
- ✅ Performance acceptable (<300ms P95)

---

## 16. Open Questions

1. **Q**: Should we backfill existing OpenAI embeddings with Gemini?
   **A**: No. Keep existing embeddings. Only use Gemini for new embeddings. Backward compatibility is key.

2. **Q**: What happens if a user hits daily limit (1500/day)?
   **A**: Automatically switch to OpenAI for remainder of day. Reset at midnight UTC.

3. **Q**: Should we expose provider selection to users?
   **A**: No. Provider selection is transparent. Users don't need to know or care.

4. **Q**: How do we handle dimension mismatches in search?
   **A**: Use 1536 for all providers. No mismatches possible.

---

## 17. Summary

**Problem**: Embedding costs with OpenAI are $0.02/1M tokens, adding up for high-volume users.

**Solution**: Implement dual-provider system with Gemini (free tier) as primary and OpenAI as fallback.

**Benefits**:
- ✅ **85% cost reduction** (estimated $255/month for 10K users)
- ✅ **Better accuracy** (Gemini ~66% MTEB vs OpenAI ~62%)
- ✅ **Higher reliability** (dual provider redundancy)
- ✅ **No breaking changes** (backward compatible)
- ✅ **Flexible configuration** (environment variables)

**Risks**:
- ⚠️ Gemini token limit (2048 vs OpenAI 8191) → Auto-fallback to OpenAI for long texts
- ⚠️ Rate limiting (15 RPM free tier) → Auto-fallback to OpenAI during spikes
- ⚠️ Vendor lock-in → Mitigated by dual-provider architecture

**Next Steps**: Proceed to test design (Step 2) and implementation (Steps 3-7).
