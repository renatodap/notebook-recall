/**
 * Retry Utility with Exponential Backoff
 *
 * Provides production-level retry logic for AI API calls and external services
 * per CLAUDE.md Section 2 (Code Quality Standards).
 */

export interface RetryConfig {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds (default: 1000)
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds (default: 10000)
   */
  maxDelay?: number;

  /**
   * Backoff multiplier (default: 2 for exponential backoff)
   */
  backoffMultiplier?: number;

  /**
   * Jitter in milliseconds to add randomness (default: 100)
   */
  jitter?: number;

  /**
   * Function to determine if error should be retried
   * Return true to retry, false to fail immediately
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;

  /**
   * Callback called before each retry attempt
   */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: 100,
  shouldRetry: defaultShouldRetry,
  onRetry: defaultOnRetry,
};

/**
 * Default retry logic - retries on network errors and 5xx errors
 * Does not retry on client errors (4xx) or authentication errors
 */
function defaultShouldRetry(error: unknown, attempt: number): boolean {
  // Don't retry if max attempts reached (handled elsewhere)
  if (attempt >= DEFAULT_CONFIG.maxRetries) {
    return false;
  }

  // Check if it's an HTTP error with status code
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Don't retry client errors
    if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
      return false;
    }

    // Retry on server errors and rate limits
    if (message.includes('429') || message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }

    // Retry on network errors
    if (message.includes('fetch failed') || message.includes('network') || message.includes('timeout')) {
      return true;
    }
  }

  // Default to retrying for unknown errors
  return true;
}

/**
 * Default retry callback - logs to console
 */
function defaultOnRetry(error: unknown, attempt: number, delay: number): void {
  console.log(
    `Retry attempt ${attempt} after ${delay}ms. Error:`,
    error instanceof Error ? error.message : String(error)
  );
}

/**
 * Executes an async function with automatic retry logic
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 * @throws Last error if all retries exhausted
 *
 * @example
 * const result = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retrying API call (attempt ${attempt}) after ${delay}ms`);
 *     }
 *   }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === finalConfig.maxRetries || !finalConfig.shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay =
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
      const cappedDelay = Math.min(exponentialDelay, finalConfig.maxDelay);
      const jitter = Math.random() * finalConfig.jitter;
      const finalDelay = cappedDelay + jitter;

      // Call retry callback
      finalConfig.onRetry(error, attempt + 1, finalDelay);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Convenience wrapper for retrying fetch requests
 *
 * @example
 * const response = await retryFetch('https://api.example.com/data', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ key: 'value' })
 * });
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, init);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }, retryConfig);
}

/**
 * Convenience wrapper for retrying AI API calls
 * Uses more conservative retry settings suitable for AI services
 *
 * @example
 * const summary = await retryAICall(async () => {
 *   const response = await anthropic.messages.create({
 *     model: 'claude-3-5-sonnet-20241022',
 *     max_tokens: 1024,
 *     messages: [{ role: 'user', content: 'Summarize this...' }]
 *   });
 *   return response.content[0].text;
 * });
 */
export async function retryAICall<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 2000, // Start with 2s delay for AI calls
    maxDelay: 30000, // Max 30s delay
    backoffMultiplier: 2,
    jitter: 500,
    ...config,
  });
}
