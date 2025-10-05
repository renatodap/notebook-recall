/**
 * OpenRouter Client - Model diversity and fallback options
 */

import OpenAI from 'openai'
import type { DatabaseRecord } from '@/types/api-types'

let openRouterClient: OpenAI | null = null

export function getOpenRouterClient(): OpenAI {
  if (!openRouterClient) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }

    openRouterClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Recall Notebook'
      }
    })
  }

  return openRouterClient
}

export interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterChatOptions {
  model: string
  messages: OpenRouterChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  transforms?: string[] // OpenRouter-specific: e.g., ['middle-out']
  route?: 'fallback' | 'cheapest' | 'fastest' // OpenRouter routing
}

/**
 * Send chat completion via OpenRouter
 */
export async function openRouterChatCompletion(
  options: OpenRouterChatOptions
): Promise<string> {
  const client = getOpenRouterClient()

  const requestBody: any = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4000,
    top_p: options.top_p ?? 1,
    stream: false,
  }

  // Add OpenRouter-specific params if provided
  if (options.transforms) {
    requestBody.transforms = options.transforms
  }
  if (options.route) {
    requestBody.route = options.route
  }

  const response = await client.chat.completions.create(requestBody)

  return response.choices[0]?.message?.content || ''
}

/**
 * Stream chat completion from OpenRouter
 */
export async function* openRouterChatCompletionStream(
  options: OpenRouterChatOptions
): AsyncGenerator<string> {
  const client = getOpenRouterClient()

  const stream = await client.chat.completions.create({
    ...options,
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
 * Get available models from OpenRouter
 */
export async function getOpenRouterModels() {
  const client = getOpenRouterClient()

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    }
  })

  return response.json()
}

/**
 * Use OpenRouter's smart routing to automatically select cheapest/fastest model
 */
export async function openRouterAutoRoute(
  messages: OpenRouterChatMessage[],
  preference: 'cheapest' | 'fastest' | 'best' = 'cheapest'
): Promise<string> {
  const modelMap = {
    cheapest: 'meta-llama/llama-3.1-8b-instruct:free', // Free tier
    fastest: 'google/gemini-2.0-flash-exp:free', // Ultra-low latency
    best: 'anthropic/claude-3.5-sonnet' // Best quality
  }

  return openRouterChatCompletion({
    model: modelMap[preference],
    messages,
    route: preference === 'cheapest' ? 'cheapest' : 'fallback'
  })
}

/**
 * Function calling with OpenRouter (supports multiple providers)
 */
export interface OpenRouterTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export async function openRouterFunctionCall(
  messages: OpenRouterChatMessage[],
  tools: OpenRouterTool[],
  model: string = 'anthropic/claude-3.5-sonnet'
): Promise<{ response: string; toolCalls: unknown[] }> {
  const client = getOpenRouterClient()

  const response = await client.chat.completions.create({
    model,
    messages,
    tools: tools as any,
    tool_choice: 'auto'
  })

  const message = response.choices[0]?.message
  const toolCalls = message?.tool_calls || []

  return {
    response: message?.content || '',
    toolCalls: toolCalls.map((tc: DatabaseRecord) => ({
      name: tc.function.name,
      arguments: typeof tc.function.arguments === 'string'
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments
    }))
  }
}

/**
 * Multimodal completion (images, PDFs, audio)
 */
export async function openRouterMultimodal(
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string | Array<{ type: string; [key: string]: any }>
  }>,
  model: string = 'anthropic/claude-3.5-sonnet'
): Promise<string> {
  const client = getOpenRouterClient()

  const response = await client.chat.completions.create({
    model,
    messages: messages as any
  })

  return response.choices[0]?.message?.content || ''
}
