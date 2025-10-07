/**
 * Unified AI Client - Single interface for all providers
 *
 * Automatically routes to optimal model based on task type and requirements.
 * Provides cost-optimized AI API calls by selecting the cheapest model that
 * meets quality requirements.
 *
 * Provider Cost Comparison:
 * - Groq: $0.05-0.59/M tokens (fastest, cheapest)
 * - OpenRouter: $0.14-1.00/M tokens (flexible)
 * - Anthropic: $3-15/M tokens (highest quality)
 *
 * @see CLAUDE.md Section 4: AI API Cost Optimization
 */

import { TaskType, selectOptimalModel, executeWithFallback, MODEL_CONFIGS } from './index'
import { groqChatCompletion, groqFunctionCall, type GroqChatMessage, type GroqTool } from './groq-client'
import { openRouterChatCompletion, openRouterFunctionCall, type OpenRouterChatMessage, type OpenRouterTool } from './openrouter-client'
import { retryAICall } from '@/lib/retry'

export interface UnifiedChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface UnifiedChatOptions {
  messages: UnifiedChatMessage[]
  taskType: TaskType
  temperature?: number
  max_tokens?: number
  stream?: boolean
  tools?: unknown[]
  needsHighAccuracy?: boolean
  needsSpeed?: boolean
  budget?: 'low' | 'medium' | 'high'
}

/**
 * Sends a chat completion request using the optimal model for the task
 *
 * Automatically selects the best model based on task type, accuracy needs,
 * speed requirements, and budget constraints. Includes fallback mechanisms
 * for resilience.
 *
 * @param options - Chat completion options including messages, task type, and preferences
 * @returns Promise resolving to completion with content, model info, cost, and tokens
 *
 * @example
 * const result = await unifiedChatCompletion({
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant' },
 *     { role: 'user', content: 'Explain AI in simple terms' }
 *   ],
 *   taskType: TaskType.QUICK_CHAT,
 *   budget: 'low'
 * })
 * console.log(result.content)        // AI response
 * console.log(result.estimatedCost)  // ~$0.00001 (using Groq)
 */
export async function unifiedChatCompletion(
  options: UnifiedChatOptions
): Promise<{
  content: string
  model: string
  provider: string
  estimatedCost: number
  tokensUsed: number
}> {
  const modelConfig = selectOptimalModel({
    taskType: options.taskType,
    needsHighAccuracy: options.needsHighAccuracy,
    needsSpeed: options.needsSpeed,
    budget: options.budget
  })

  console.log(`🎯 Selected: ${modelConfig.provider}/${modelConfig.model} for ${options.taskType}`)

  const result = await executeWithFallback(options.taskType, async (config) => {
    if (config.provider === 'groq') {
      const content = await groqChatCompletion({
        model: config.model,
        messages: options.messages as GroqChatMessage[],
        temperature: options.temperature,
        max_tokens: options.max_tokens || config.maxTokens
      })

      // Estimate tokens (rough approximation)
      const inputTokens = options.messages.reduce((sum, m) => sum + m.content.length / 4, 0)
      const outputTokens = content.length / 4

      return {
        content,
        model: config.model,
        provider: config.provider,
        estimatedCost: ((inputTokens + outputTokens) / 1_000_000) * config.costPer1M,
        tokensUsed: Math.round(inputTokens + outputTokens)
      }
    } else if (config.provider === 'openrouter') {
      const content = await openRouterChatCompletion({
        model: config.model,
        messages: options.messages as OpenRouterChatMessage[],
        temperature: options.temperature,
        max_tokens: options.max_tokens || config.maxTokens
      })

      const inputTokens = options.messages.reduce((sum, m) => sum + m.content.length / 4, 0)
      const outputTokens = content.length / 4

      return {
        content,
        model: config.model,
        provider: config.provider,
        estimatedCost: ((inputTokens + outputTokens) / 1_000_000) * config.costPer1M,
        tokensUsed: Math.round(inputTokens + outputTokens)
      }
    } else {
      // Anthropic fallback (existing implementation)
      return await retryAICall(async () => {
        const anthropicKey = process.env.ANTHROPIC_API_KEY
        if (!anthropicKey) throw new Error('Anthropic API key not configured')

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: options.max_tokens || 4000,
            system: options.messages.find(m => m.role === 'system')?.content || '',
            messages: options.messages.filter(m => m.role !== 'system')
          })
        })

        const data = await response.json()
        const content = data.content?.[0]?.text || ''

        return {
          content,
          model: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
          estimatedCost: (data.usage?.input_tokens + data.usage?.output_tokens) / 1_000_000 * 3.0,
          tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0
        }
      })
    }
  })

  return result
}

/**
 * Executes function calling with automatic provider selection
 *
 * Routes to the best provider for tool use based on current configuration.
 * Defaults to Groq for cost-effectiveness with fallback to OpenRouter.
 *
 * @param messages - Chat messages leading to function call
 * @param tools - Array of tool/function definitions
 * @returns Promise resolving to response with tool calls and provider info
 *
 * @example
 * const result = await unifiedFunctionCall(
 *   [{ role: 'user', content: 'What is the weather in NYC?' }],
 *   [{ name: 'get_weather', description: 'Get weather', parameters: {...} }]
 * )
 */
export async function unifiedFunctionCall(
  messages: UnifiedChatMessage[],
  tools: unknown[]
): Promise<{ response: string; toolCalls: unknown[]; provider: string }> {
  const config = MODEL_CONFIGS[TaskType.FUNCTION_CALLING]

  if (config.provider === 'groq') {
    const result = await groqFunctionCall(
      messages as GroqChatMessage[],
      tools as GroqTool[]
    )
    return { ...result, provider: 'groq' }
  } else if (config.provider === 'openrouter') {
    const result = await openRouterFunctionCall(
      messages as OpenRouterChatMessage[],
      tools as OpenRouterTool[]
    )
    return { ...result, provider: 'openrouter' }
  }

  // Fallback to OpenRouter with Claude
  const result = await openRouterFunctionCall(
    messages as OpenRouterChatMessage[],
    tools as OpenRouterTool[],
    'anthropic/claude-3.5-sonnet'
  )
  return { ...result, provider: 'openrouter' }
}

/**
 * Quick chat completion using the fastest, cheapest model (Groq Llama 3.1 8B)
 *
 * Optimized for simple Q&A and basic responses. Uses Groq at $0.05/M tokens
 * for maximum cost efficiency. Perfect for tag extraction, simple summaries,
 * and basic text generation.
 *
 * @param userMessage - User's message/query
 * @param systemPrompt - Optional system instructions
 * @returns Promise resolving to AI response text
 *
 * @example
 * const response = await quickChat(
 *   'Extract tags from: "Machine learning tutorial"',
 *   'You are a tag extraction assistant'
 * )
 * // Cost: ~$0.000001 per request
 */
export async function quickChat(
  userMessage: string,
  systemPrompt?: string
): Promise<string> {
  const messages: UnifiedChatMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: userMessage })

  const result = await unifiedChatCompletion({
    messages,
    taskType: TaskType.QUICK_CHAT,
    needsSpeed: true,
    budget: 'low'
  })

  console.log(`💰 Cost: $${result.estimatedCost.toFixed(6)} (${result.tokensUsed} tokens)`)

  return result.content
}

/**
 * Complex reasoning using high-quality model (Claude via OpenRouter)
 *
 * Uses Claude 3.5 Sonnet for tasks requiring deep analysis, multi-step
 * reasoning, or high accuracy. More expensive ($3/M tokens) but worth it
 * for critical tasks like synthesis, contradictions, and academic writing.
 *
 * @param userMessage - User's message/query
 * @param systemPrompt - Optional system instructions
 * @param conversationHistory - Optional conversation context
 * @returns Promise resolving to AI response text
 *
 * @example
 * const response = await complexReasoning(
 *   'Analyze the contradictions between these research findings...',
 *   'You are an academic research analyst',
 *   previousMessages
 * )
 * // Cost: ~$0.003 per 1000 tokens
 */
export async function complexReasoning(
  userMessage: string,
  systemPrompt?: string,
  conversationHistory?: UnifiedChatMessage[]
): Promise<string> {
  const messages: UnifiedChatMessage[] = conversationHistory || []

  if (systemPrompt && !messages.some(m => m.role === 'system')) {
    messages.unshift({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: userMessage })

  const result = await unifiedChatCompletion({
    messages,
    taskType: TaskType.COMPLEX_REASONING,
    needsHighAccuracy: true,
    budget: 'medium' // Can afford better models for complex tasks
  })

  console.log(`💰 Cost: $${result.estimatedCost.toFixed(6)} (${result.tokensUsed} tokens)`)

  return result.content
}

/**
 * Summarizes text using cost-optimized model (Groq Llama 3.3 70B)
 *
 * Uses Groq's larger model for better summarization quality while maintaining
 * low cost ($0.59/M tokens). Good balance between quality and price for
 * most summarization tasks.
 *
 * @param text - Text to summarize
 * @param style - Summarization style (brief, detailed, or bullets)
 * @returns Promise resolving to summary text
 *
 * @example
 * const summary = await summarize(
 *   'Long article text...',
 *   'bullets'
 * )
 * // Cost: ~$0.0006 per 1000 tokens
 */
export async function summarize(
  text: string,
  style: 'brief' | 'detailed' | 'bullets' = 'detailed'
): Promise<string> {
  const prompts = {
    brief: 'Provide a 1-2 sentence summary.',
    detailed: 'Provide a comprehensive but concise summary.',
    bullets: 'Provide a bulleted list summary of key points.'
  }

  const result = await unifiedChatCompletion({
    messages: [
      { role: 'system', content: `You are a summarization expert. ${prompts[style]}` },
      { role: 'user', content: `Summarize this:\n\n${text}` }
    ],
    taskType: TaskType.SUMMARIZATION,
    budget: 'low'
  })

  return result.content
}
