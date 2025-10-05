/**
 * AI ROUTER - Intelligent Model Selection for Cost Optimization
 *
 * Strategy:
 * - Groq: Ultra-fast, cheap operations (chat, embeddings, summaries)
 * - OpenRouter: Fallback, model diversity, specialized tasks
 * - Anthropic: Reserved for critical reasoning only
 */

export enum TaskType {
  QUICK_CHAT = 'quick_chat',           // Simple Q&A, basic responses
  COMPLEX_REASONING = 'complex_reasoning', // Multi-step logic, analysis
  SUMMARIZATION = 'summarization',      // Document summaries
  EMBEDDINGS = 'embeddings',            // Vector generation
  FUNCTION_CALLING = 'function_calling', // Tool use
  BATCH_PROCESSING = 'batch_processing', // Background jobs
  CODE_GENERATION = 'code_generation',   // Programming tasks
  CREATIVE_WRITING = 'creative_writing'  // Long-form content
}

export interface ModelConfig {
  provider: 'groq' | 'openrouter' | 'anthropic'
  model: string
  costPer1M: number
  speedTokensPerSec?: number
  maxTokens: number
  contextWindow: number
}

export const MODEL_CONFIGS: Record<TaskType, ModelConfig> = {
  [TaskType.QUICK_CHAT]: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    costPer1M: 0.05,
    speedTokensPerSec: 840,
    maxTokens: 8000,
    contextWindow: 131072
  },
  [TaskType.COMPLEX_REASONING]: {
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    costPer1M: 3.0,
    maxTokens: 8000,
    contextWindow: 200000
  },
  [TaskType.SUMMARIZATION]: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    costPer1M: 0.59,
    speedTokensPerSec: 300,
    maxTokens: 32768,
    contextWindow: 131072
  },
  [TaskType.EMBEDDINGS]: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant', // Use for embedding-like tasks
    costPer1M: 0.05,
    maxTokens: 4096,
    contextWindow: 131072
  },
  [TaskType.FUNCTION_CALLING]: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    costPer1M: 0.05,
    speedTokensPerSec: 840,
    maxTokens: 8000,
    contextWindow: 131072
  },
  [TaskType.BATCH_PROCESSING]: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    costPer1M: 0.025, // 50% discount with batch API
    maxTokens: 8000,
    contextWindow: 131072
  },
  [TaskType.CODE_GENERATION]: {
    provider: 'openrouter',
    model: 'deepseek/deepseek-coder',
    costPer1M: 0.14,
    maxTokens: 64000,
    contextWindow: 128000
  },
  [TaskType.CREATIVE_WRITING]: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    costPer1M: 0.59,
    maxTokens: 32768,
    contextWindow: 131072
  }
}

/**
 * Automatically select best model based on task characteristics
 */
export function selectOptimalModel(params: {
  taskType: TaskType
  estimatedTokens?: number
  needsHighAccuracy?: boolean
  needsSpeed?: boolean
  budget?: 'low' | 'medium' | 'high'
}): ModelConfig {
  const { taskType, needsHighAccuracy, needsSpeed, budget = 'low' } = params

  let config = MODEL_CONFIGS[taskType]

  // Override for high accuracy needs
  if (needsHighAccuracy && budget !== 'low') {
    config = MODEL_CONFIGS[TaskType.COMPLEX_REASONING]
  }

  // Override for speed needs
  if (needsSpeed && taskType === TaskType.QUICK_CHAT) {
    config = MODEL_CONFIGS[TaskType.QUICK_CHAT] // Already the fastest
  }

  return config
}

/**
 * Calculate estimated cost for a request
 */
export function estimateCost(params: {
  inputTokens: number
  outputTokens: number
  model: ModelConfig
}): number {
  const { inputTokens, outputTokens, model } = params
  const totalTokens = inputTokens + outputTokens
  return (totalTokens / 1_000_000) * model.costPer1M
}

/**
 * Get provider-specific API configuration
 */
export function getProviderConfig(provider: 'groq' | 'openrouter' | 'anthropic') {
  const configs = {
    groq: {
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      }
    },
    openrouter: {
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Recall Notebook'
      }
    },
    anthropic: {
      baseURL: 'https://api.anthropic.com/v1',
      apiKey: process.env.ANTHROPIC_API_KEY,
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      }
    }
  }

  return configs[provider]
}

/**
 * Fallback chain for resilience
 */
export const FALLBACK_CHAIN: Record<TaskType, ModelConfig[]> = {
  [TaskType.QUICK_CHAT]: [
    MODEL_CONFIGS[TaskType.QUICK_CHAT],
    { ...MODEL_CONFIGS[TaskType.QUICK_CHAT], provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct' },
  ],
  [TaskType.COMPLEX_REASONING]: [
    MODEL_CONFIGS[TaskType.COMPLEX_REASONING],
    { ...MODEL_CONFIGS[TaskType.SUMMARIZATION], provider: 'groq' },
  ],
  [TaskType.SUMMARIZATION]: [
    MODEL_CONFIGS[TaskType.SUMMARIZATION],
    MODEL_CONFIGS[TaskType.QUICK_CHAT],
  ],
  [TaskType.EMBEDDINGS]: [
    MODEL_CONFIGS[TaskType.EMBEDDINGS],
  ],
  [TaskType.FUNCTION_CALLING]: [
    MODEL_CONFIGS[TaskType.FUNCTION_CALLING],
    { ...MODEL_CONFIGS[TaskType.QUICK_CHAT], provider: 'openrouter' },
  ],
  [TaskType.BATCH_PROCESSING]: [
    MODEL_CONFIGS[TaskType.BATCH_PROCESSING],
  ],
  [TaskType.CODE_GENERATION]: [
    MODEL_CONFIGS[TaskType.CODE_GENERATION],
    MODEL_CONFIGS[TaskType.SUMMARIZATION],
  ],
  [TaskType.CREATIVE_WRITING]: [
    MODEL_CONFIGS[TaskType.CREATIVE_WRITING],
    MODEL_CONFIGS[TaskType.COMPLEX_REASONING],
  ]
}

/**
 * Execute request with automatic fallback
 */
export async function executeWithFallback<T>(
  taskType: TaskType,
  executeFn: (config: ModelConfig) => Promise<T>
): Promise<T> {
  const fallbackChain = FALLBACK_CHAIN[taskType]

  for (let i = 0; i < fallbackChain.length; i++) {
    const config = fallbackChain[i]
    try {
      console.log(`Attempting ${config.provider}/${config.model}...`)
      const result = await executeFn(config)
      console.log(`✓ Success with ${config.provider}/${config.model}`)
      return result
    } catch (error) {
      console.error(`✗ Failed with ${config.provider}/${config.model}:`, error)

      // If last in chain, throw error
      if (i === fallbackChain.length - 1) {
        throw error
      }

      // Otherwise, try next in chain
      console.log(`Trying fallback ${i + 2}/${fallbackChain.length}...`)
    }
  }

  throw new Error('All fallback options exhausted')
}
