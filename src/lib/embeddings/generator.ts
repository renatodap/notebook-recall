/**
 * Embedding Generator - OpenAI text-embedding-3-small
 */

import { EmbeddingGenerationResult } from './types'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_TOKENS = 8191

/**
 * Generate embedding vector for text using OpenAI
 */
export async function generateEmbedding(
  text: string
): Promise<EmbeddingGenerationResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // Truncate if too long (rough estimation: 1 token ≈ 4 chars)
  const maxChars = MAX_TOKENS * 4
  const truncatedText = text.length > maxChars
    ? text.substring(0, maxChars)
    : text

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedText,
        encoding_format: 'float'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      embedding: data.data[0].embedding,
      tokenCount: data.usage.total_tokens,
      model: EMBEDDING_MODEL
    }
  } catch (error) {
    console.error('Embedding generation failed:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<EmbeddingGenerationResult[]> {
  if (!texts || texts.length === 0) {
    return []
  }

  // OpenAI supports batch embedding (up to 2048 inputs)
  const maxBatchSize = 100 // Conservative batch size
  const results: EmbeddingGenerationResult[] = []

  for (let i = 0; i < texts.length; i += maxBatchSize) {
    const batch = texts.slice(i, i + maxBatchSize)

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: batch,
          encoding_format: 'float'
        })
      })

      if (!response.ok) {
        throw new Error(`Batch embedding failed: ${response.statusText}`)
      }

      const data = await response.json()

      data.data.forEach((item: any) => {
        results.push({
          embedding: item.embedding,
          tokenCount: data.usage.total_tokens / batch.length, // Approximate
          model: EMBEDDING_MODEL
        })
      })
    } catch (error) {
      console.error('Batch embedding failed:', error)
      // Continue with remaining batches
    }
  }

  return results
}
