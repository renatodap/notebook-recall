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

export interface SummarizationResult {
  summary: string
  actions: string[]
  topics: string[]
}

/**
 * Creates a Claude API client
 */
function createClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  return new Anthropic({ apiKey })
}

/**
 * Summarizes content using Claude API
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
 * Summarizes content with retry logic
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
 * Handles summarization of large content by chunking
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
 * Gets Claude API client for direct use
 */
export function getClaudeClient(): Anthropic {
  return createClaudeClient()
}
