import Anthropic from '@anthropic-ai/sdk'
import { ContentType } from '@/types'
import { getSummarizationPrompt, getSystemPrompt } from './prompts'
import {
  retryWithBackoff,
  sanitizeContent,
  validateSummarizationResponse,
  estimateTokenCount,
  chunkContent,
} from './utils'
import { retryAICall } from '@/lib/retry'

/**
 * Result of content summarization operation
 */
export interface SummarizationResult {
  /** Main summary text extracted from content */
  summary: string
  /** List of actionable items identified in content */
  actions: string[]
  /** Key topics or themes identified in content */
  topics: string[]
}

/**
 * Creates and configures a Claude API client instance
 *
 * @returns Configured Anthropic client
 * @throws {Error} If ANTHROPIC_API_KEY environment variable is missing
 *
 * @example
 * const client = createClaudeClient()
 * const response = await client.messages.create({...})
 */
function createClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  return new Anthropic({ apiKey })
}

/**
 * Summarizes content using Claude API with automatic chunking for large documents
 *
 * NOTE: This uses Claude 3.5 Sonnet directly ($3/M tokens). Consider using the
 * unified AI router for cheaper alternatives on simple content.
 *
 * @param content - Text content to summarize (up to 500K characters)
 * @param contentType - Type of content (text, url, pdf, note, image)
 * @returns Promise resolving to summarization result with summary, actions, and topics
 * @throws {Error} Various errors for API failures, rate limits, or invalid content
 *
 * @example
 * const result = await summarizeContent(
 *   'Long article text...',
 *   'text'
 * )
 * console.log(result.summary) // Main summary
 * console.log(result.actions) // Action items
 * console.log(result.topics)  // Key topics
 */
export async function summarizeContent(
  content: string,
  contentType: ContentType
): Promise<SummarizationResult> {
  try {
    // Sanitize input
    const sanitizedContent = sanitizeContent(content)

    // Check if content needs chunking
    const estimatedTokens = estimateTokenCount(sanitizedContent)
    const maxInputTokens = 150000 // Leave room for prompt and response

    let finalSummary: SummarizationResult

    if (estimatedTokens > maxInputTokens) {
      // Handle large content by chunking
      finalSummary = await summarizeLargeContent(
        sanitizedContent,
        contentType,
        maxInputTokens
      )
    } else {
      // Summarize directly
      finalSummary = await summarizeWithRetry(sanitizedContent, contentType)
    }

    return finalSummary
  } catch (error) {
    console.error('Summarization error:', error)

    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error(
          'Service is busy, please try again in a moment'
        )
      } else if (error.message.includes('401')) {
        throw new Error('API authentication failed')
      } else if (error.message.includes('400')) {
        throw new Error('Content could not be processed')
      }
    }

    throw new Error('Unable to generate summary, please try again')
  }
}

/**
 * Summarizes content with automatic retry logic on failures
 *
 * Uses exponential backoff retry strategy to handle temporary API failures.
 * Internal helper function for summarizeContent.
 *
 * @param content - Sanitized content to summarize
 * @param contentType - Type of content
 * @returns Promise resolving to summarization result
 * @throws {Error} If all retry attempts fail or response is invalid
 */
async function summarizeWithRetry(
  content: string,
  contentType: ContentType
): Promise<SummarizationResult> {
  return retryWithBackoff(async () => {
    const client = createClaudeClient()
    const prompt = getSummarizationPrompt(content, contentType)

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      system: getSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse JSON response
    let parsedResponse: any
    try {
      // Try to extract JSON from the response
      const text = textContent.text.trim()

      // If response is wrapped in markdown code blocks, extract it
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text

      parsedResponse = JSON.parse(jsonText)
    } catch (error) {
      console.error('JSON parsing error:', error)
      throw new Error('Failed to parse response')
    }

    // Validate response structure
    const validation = validateSummarizationResponse(parsedResponse)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid response structure')
    }

    return {
      summary: parsedResponse.summary,
      actions: parsedResponse.actions,
      topics: parsedResponse.topics,
    }
  })
}

/**
 * Handles summarization of large content by chunking and combining results
 *
 * Automatically splits content exceeding token limits into chunks, summarizes
 * each chunk, then combines the results. If combined summary is still too large,
 * creates a meta-summary.
 *
 * @param content - Large content to summarize
 * @param contentType - Type of content
 * @param maxTokens - Maximum tokens per chunk
 * @returns Promise resolving to combined summarization result
 * @throws {Error} If any chunk summarization fails
 */
async function summarizeLargeContent(
  content: string,
  contentType: ContentType,
  maxTokens: number
): Promise<SummarizationResult> {
  const chunks = chunkContent(content, maxTokens)

  // Summarize each chunk
  const chunkSummaries: SummarizationResult[] = []

  for (const chunk of chunks) {
    const summary = await summarizeWithRetry(chunk, contentType)
    chunkSummaries.push(summary)
  }

  // Combine summaries
  const combinedSummary = chunkSummaries.map((s) => s.summary).join('\n\n')
  const combinedActions = Array.from(
    new Set(chunkSummaries.flatMap((s) => s.actions))
  )
  const combinedTopics = Array.from(
    new Set(chunkSummaries.flatMap((s) => s.topics))
  )

  // If combined summary is still long, create meta-summary
  if (estimateTokenCount(combinedSummary) > 10000) {
    return await summarizeWithRetry(
      `Summarize this content:\n\n${combinedSummary}`,
      contentType
    )
  }

  return {
    summary: combinedSummary,
    actions: combinedActions.slice(0, 10), // Limit to 10 actions
    topics: combinedTopics.slice(0, 10), // Limit to 10 topics
  }
}

/**
 * Generates a concise, descriptive title for content using Claude API
 *
 * NOTE: This uses Claude 3.5 Sonnet ($3/M tokens). Consider using Groq for
 * simple title generation to reduce costs to $0.05/M tokens.
 *
 * @param content - Text content to generate title for (automatically truncated to 1000 chars)
 * @param contentType - Type of content
 * @returns Promise resolving to generated title (5-10 words max)
 *
 * @example
 * const title = await generateTitle('Article about AI...', 'text')
 * // Returns: "Understanding Modern AI Applications"
 */
export async function generateTitle(
  content: string,
  contentType: ContentType
): Promise<string> {
  try {
    return await retryAICall(async () => {
      const client = createClaudeClient()

      // Truncate content for title generation
      const truncatedContent = content.substring(0, 1000)

      const prompt = `Generate a brief, descriptive title (5-10 words max) for this ${contentType} content. The title should capture the main topic or theme. Return only the title with no additional text or punctuation.

Content:
${truncatedContent}${content.length > 1000 ? '...' : ''}`

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const textContent = response.content.find((c) => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response')
      }

      return textContent.text.trim()
    })
  } catch (error) {
    console.error('Title generation error:', error)
    // Return a fallback title
    return `Untitled ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`
  }
}

/**
 * Gets Claude API client for direct use in custom implementations
 *
 * Use this when you need direct access to the Anthropic SDK for advanced
 * use cases not covered by the summarizeContent or generateTitle functions.
 *
 * @returns Configured Anthropic client instance
 * @throws {Error} If ANTHROPIC_API_KEY environment variable is missing
 *
 * @example
 * const client = getClaudeClient()
 * const stream = await client.messages.stream({
 *   model: 'claude-3-5-sonnet-20241022',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   max_tokens: 1024
 * })
 */
export function getClaudeClient(): Anthropic {
  return createClaudeClient()
}
