/**
 * Semantic Search using pgvector
 */

import { createRouteHandlerClient } from '@/lib/supabase/server'
import { SemanticSearchOptions, SemanticSearchResult } from './types'
import { generateEmbedding } from './generator'

/**
 * Perform semantic search for sources using vector similarity
 */
export async function semanticSearch(
  userId: string,
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResult[]> {
  const {
    limit = 5,
    threshold = 0.7,
    includeMetadata = true
  } = options

  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    // Generate embedding for query
    const { embedding: queryEmbedding } = await generateEmbedding(query)

    // Perform vector similarity search
    const supabase = await createRouteHandlerClient()

    // Use pgvector's cosine distance operator (<=>)
    const { data, error } = await (supabase as any)
      .rpc('search_sources_by_embedding', {
        query_embedding: queryEmbedding,
        match_threshold: 1 - threshold, // Convert similarity to distance
        match_count: limit,
        user_id_filter: userId
      })

    if (error) {
      console.error('Semantic search error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    const results: SemanticSearchResult[] = data.map((row: any) => ({
      source_id: row.source_id,
      chunk_id: row.chunk_id,
      similarity: 1 - row.distance, // Convert distance back to similarity
      content_preview: row.content_preview,
      metadata: includeMetadata ? {
        title: row.title,
        content_type: row.content_type,
        created_at: row.created_at
      } : undefined
    }))

    return results
  } catch (error) {
    console.error('Semantic search failed:', error)
    return []
  }
}

/**
 * Store embedding for a source
 */
export async function storeSourceEmbedding(
  sourceId: string,
  content: string,
  chunkId: number = 0
): Promise<string | null> {
  try {
    const { embedding } = await generateEmbedding(content)
    const supabase = await createRouteHandlerClient()

    const contentPreview = content.substring(0, 200)

    const { data, error } = await (supabase as any)
      .from('source_embeddings')
      .upsert({
        source_id: sourceId,
        chunk_id: chunkId,
        embedding,
        content_preview: contentPreview
      }, {
        onConflict: 'source_id,chunk_id'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to store embedding:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Store embedding error:', error)
    return null
  }
}
