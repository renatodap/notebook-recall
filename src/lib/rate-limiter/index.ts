/**
 * Rate Limiter Utility
 *
 * Provides production-level rate limiting for API endpoints
 * per CLAUDE.md Section 3 (Security Standards).
 *
 * Uses in-memory store for development, should use Redis in production.
 */

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Identifier for this rate limit rule (e.g., 'ai-summary', 'search')
   */
  identifier: string;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Check if request is rate limited
 *
 * @param userId - User ID to track
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and retry information
 *
 * @example
 * const limit = await checkRateLimit(user.id, {
 *   maxRequests: 100,
 *   windowSeconds: 86400, // 24 hours
 *   identifier: 'chat-messages'
 * });
 *
 * if (limit.isLimited) {
 *   throw new RateLimitError(
 *     `Too many requests. Please try again in ${limit.retryAfter} seconds`,
 *     limit.retryAfter
 *   );
 * }
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<{
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  const key = `${config.identifier}:${userId}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowSeconds * 1000,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count += 1;

  // Check if rate limit exceeded
  const isLimited = entry.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const retryAfter = isLimited
    ? Math.ceil((entry.resetTime - now) / 1000)
    : undefined;

  return {
    isLimited,
    remaining,
    resetTime: entry.resetTime,
    retryAfter,
  };
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RATE_LIMITS = {
  /**
   * AI-powered endpoints (expensive operations)
   */
  AI_SUMMARY: {
    maxRequests: 50,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-summary',
  } as RateLimitConfig,

  AI_CHAT: {
    maxRequests: 100,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-chat',
  } as RateLimitConfig,

  AI_SYNTHESIS: {
    maxRequests: 10,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-synthesis',
  } as RateLimitConfig,

  AI_PUBLISHING: {
    maxRequests: 20,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-publishing',
  } as RateLimitConfig,

  AI_CONTRADICTIONS: {
    maxRequests: 30,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-contradictions',
  } as RateLimitConfig,

  AI_CONNECTIONS: {
    maxRequests: 30,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-connections',
  } as RateLimitConfig,

  /**
   * Regular endpoints
   */
  SEARCH: {
    maxRequests: 1000,
    windowSeconds: 3600, // 1 hour
    identifier: 'search',
  } as RateLimitConfig,

  SOURCE_CREATION: {
    maxRequests: 100,
    windowSeconds: 3600, // 1 hour
    identifier: 'source-creation',
  } as RateLimitConfig,

  PDF_UPLOAD: {
    maxRequests: 20,
    windowSeconds: 3600, // 1 hour
    identifier: 'pdf-upload',
  } as RateLimitConfig,

  CONTENT_FETCH: {
    maxRequests: 50,
    windowSeconds: 3600, // 1 hour
    identifier: 'content-fetch',
  } as RateLimitConfig,

  DATA_MODIFICATION: {
    maxRequests: 200,
    windowSeconds: 3600, // 1 hour
    identifier: 'data-modification',
  } as RateLimitConfig,

  EXPORT: {
    maxRequests: 50,
    windowSeconds: 3600, // 1 hour
    identifier: 'export',
  } as RateLimitConfig,

  IMPORT: {
    maxRequests: 30,
    windowSeconds: 3600, // 1 hour
    identifier: 'import',
  } as RateLimitConfig,

  EMBEDDINGS: {
    maxRequests: 100,
    windowSeconds: 86400, // 24 hours
    identifier: 'embeddings',
  } as RateLimitConfig,

  AI_ANALYSIS: {
    maxRequests: 50,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-analysis',
  } as RateLimitConfig,

  AI_LITERATURE_REVIEW: {
    maxRequests: 10,
    windowSeconds: 86400, // 24 hours
    identifier: 'ai-literature-review',
  } as RateLimitConfig,
};

/**
 * Clears rate limit for a specific user and identifier
 * Useful for testing or admin overrides
 */
export function clearRateLimit(userId: string, identifier: string): void {
  const key = `${identifier}:${userId}`;
  rateLimitStore.delete(key);
}

/**
 * Clears all rate limits
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
