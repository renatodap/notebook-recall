/**
 * Groq Client - Ultra-fast, low-cost LLM operations
 */

import Groq from 'groq-sdk'
import { ModelConfig } from './index'

let groqClient: Groq | null = null

export function getGroqClient(): Groq {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured')
    }
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    })
  }
  return groqClient
}

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqChatOptions {
  model?: string
  messages: GroqChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  stop?: string[]
}

/**
 * Send chat completion request to Groq
 */
export async function groqChatCompletion(
  options: GroqChatOptions
): Promise<string> {
  const client = getGroqClient()

  const response = await client.chat.completions.create({
    model: options.model || 'llama-3.1-8b-instant',
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 8000,
    top_p: options.top_p ?? 1,
    stream: false,
    stop: options.stop
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * Stream chat completion from Groq
 */
export async function* groqChatCompletionStream(
  options: GroqChatOptions
): AsyncGenerator<string> {
  const client = getGroqClient()

  const stream = await client.chat.completions.create({
    ...options,
    model: options.model || 'llama-3.1-8b-instant',
    stream: true
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

/**
 * Batch completion for offline processing (50% cost savings)
 */
export async function groqBatchCompletion(
  requests: GroqChatOptions[]
): Promise<string[]> {
  // Groq batch API processes multiple requests efficiently
  // For now, we'll process sequentially but this can be optimized with actual batch endpoint
  const results: string[] = []

  for (const request of requests) {
    try {
      const result = await groqChatCompletion(request)
      results.push(result)
    } catch (error) {
      console.error('Batch request failed:', error)
      results.push('')
    }
  }

  return results
}

/**
 * Generate pseudo-embeddings using Groq (for ultra-low-cost alternative to OpenAI)
 * Note: This uses LLM to generate dense representations, not true embeddings
 */
export async function groqPseudoEmbedding(text: string): Promise<number[]> {
  const client = getGroqClient()

  // Use Groq to generate a dense representation
  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'Convert the following text into a semantic fingerprint by extracting key concepts and themes. Return ONLY a comma-separated list of 100 floating point numbers between -1 and 1.'
      },
      {
        role: 'user',
        content: text.substring(0, 8000) // Limit input
      }
    ],
    temperature: 0.1,
    max_tokens: 512
  })

  const content = response.choices[0]?.message?.content || ''

  // Parse the output into numbers
  try {
    const numbers = content
      .split(',')
      .map(n => parseFloat(n.trim()))
      .filter(n => !isNaN(n))

    // Pad or truncate to exactly 1536 dimensions (OpenAI embedding size)
    while (numbers.length < 1536) {
      numbers.push(0)
    }

    return numbers.slice(0, 1536)
  } catch (error) {
    console.error('Failed to parse pseudo-embedding:', error)
    // Return zero vector on error
    return new Array(1536).fill(0)
  }
}

/**
 * Function calling with Groq
 */
export interface GroqTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

export async function groqFunctionCall(
  messages: GroqChatMessage[],
  tools: GroqTool[]
): Promise<{ response: string; toolCalls: any[] }> {
  const client = getGroqClient()

  const response = await client.chat.completions.create({
    model: 'llama-3.1-70b-versatile', // Function calling works best with 70B
    messages,
    tools: tools as any,
    tool_choice: 'auto',
    temperature: 0.1
  })

  const message = response.choices[0]?.message
  const toolCalls = message?.tool_calls || []

  return {
    response: message?.content || '',
    toolCalls: toolCalls.map((tc: any) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments)
    }))
  }
}
