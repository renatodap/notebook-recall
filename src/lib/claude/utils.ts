/**
 * Estimates token count (rough approximation)
 * More accurate: use tiktoken library
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

/**
 * Chunks large content into smaller pieces
 */
export function chunkContent(content: string, maxTokens: number): string[] {
  const estimatedTokens = estimateTokenCount(content)

  if (estimatedTokens <= maxTokens) {
    return [content]
  }

  const chunks: string[] = []
  const maxChars = maxTokens * 4 // Rough conversion

  // Split by paragraphs first
  const paragraphs = content.split(/\n\n+/)

  let currentChunk = ''

  for (const paragraph of paragraphs) {
    const proposedLength = currentChunk.length + (currentChunk ? 2 : 0) + paragraph.length

    if (proposedLength > maxChars) {
      // Save current chunk if it exists
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      // If single paragraph is too large, split by sentences
      if (paragraph.length > maxChars) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
        for (const sentence of sentences) {
          const sentenceProposed = currentChunk.length + sentence.length

          if (sentenceProposed > maxChars) {
            if (currentChunk) {
              chunks.push(currentChunk.trim())
            }
            // If even a single sentence is too large, force it as a chunk
            if (sentence.length > maxChars) {
              chunks.push(sentence.trim())
              currentChunk = ''
            } else {
              currentChunk = sentence
            }
          } else {
            currentChunk += sentence
          }
        }
      } else {
        currentChunk = paragraph
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks.length > 0 ? chunks : [content]
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.message.includes('400') || error.message.includes('401')) {
          throw error
        }
      }

      if (attempt < maxRetries - 1) {
        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt)
        const jitter = Math.random() * 1000
        await new Promise((resolve) => setTimeout(resolve, delay + jitter))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Sanitizes content to remove potential prompt injections
 */
export function sanitizeContent(content: string): string {
  // Remove excessive whitespace
  let sanitized = content.trim().replace(/\s+/g, ' ')

  // Limit length to prevent abuse
  const maxLength = 500000 // ~125k tokens
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Validates summarization response structure
 */
export function validateSummarizationResponse(data: any): {
  valid: boolean
  error?: string
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Response is not an object' }
  }

  if (!data.summary || typeof data.summary !== 'string') {
    return { valid: false, error: 'Missing or invalid summary field' }
  }

  if (!Array.isArray(data.actions)) {
    return { valid: false, error: 'Missing or invalid actions field' }
  }

  if (!Array.isArray(data.topics)) {
    return { valid: false, error: 'Missing or invalid topics field' }
  }

  return { valid: true }
}
