/**
 * Chunk Embedding Service
 *
 * Generates embeddings for document chunks
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings/client';
import { chunkDocument, getChunkConfig, shouldChunk } from './splitter';
import type { ContentType } from '@/types';
import type { ContentChunk, ChunkBackfillResponse } from '@/types/chunks';
import type { DocumentChunk } from './splitter';

/**
 * Create and embed chunks for a source
 */
export async function createSourceChunks(
  sourceId: string,
  content: string,
  contentType: ContentType
): Promise<ContentChunk[]> {
  // Check if content should be chunked
  if (!shouldChunk(contentType, content.length)) {
    return [];
  }

  const supabase = createServiceRoleClient();

  // Generate chunks
  const config = getChunkConfig(contentType, content.length);
  const documentChunks = chunkDocument(content, contentType, config);

  const createdChunks: ContentChunk[] = [];

  // Create chunks with embeddings
  for (const chunk of documentChunks) {
    try {
      // Generate embedding
      const embeddingResult = await generateEmbedding({
        text: chunk.content,
        type: 'summary',
        normalize: true,
      });

      // Store chunk in database
      const { data, error } = await supabase
        .from('content_chunks')
        .insert({
          source_id: sourceId,
          chunk_index: chunk.index,
          content: chunk.content,
          embedding: embeddingResult.embedding,
          metadata: chunk.metadata,
        })
        .select()
        .single();

      if (error) {
        console.error(`Failed to create chunk ${chunk.index}:`, error);
        continue;
      }

      createdChunks.push(data as ContentChunk);
    } catch (error) {
      console.error(`Failed to embed chunk ${chunk.index}:`, error);
      // Store chunk without embedding
      const { data } = await supabase
        .from('content_chunks')
        .insert({
          source_id: sourceId,
          chunk_index: chunk.index,
          content: chunk.content,
          metadata: chunk.metadata,
        })
        .select()
        .single();

      if (data) {
        createdChunks.push(data as ContentChunk);
      }
    }
  }

  return createdChunks;
}

/**
 * Delete all chunks for a source
 */
export async function deleteSourceChunks(sourceId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('content_chunks')
    .delete()
    .eq('source_id', sourceId);

  if (error) {
    throw new Error(`Failed to delete chunks: ${error.message}`);
  }
}

/**
 * Regenerate chunks for a source (delete old, create new)
 */
export async function regenerateSourceChunks(
  sourceId: string,
  content: string,
  contentType: ContentType
): Promise<ContentChunk[]> {
  await deleteSourceChunks(sourceId);
  return createSourceChunks(sourceId, content, contentType);
}

/**
 * Get chunks for a source
 */
export async function getSourceChunks(sourceId: string): Promise<ContentChunk[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('content_chunks')
    .select('*')
    .eq('source_id', sourceId)
    .order('chunk_index');

  if (error) {
    throw new Error(`Failed to fetch chunks: ${error.message}`);
  }

  return (data as ContentChunk[]) || [];
}

/**
 * Backfill chunks for existing sources without chunks
 */
export async function backfillChunks(
  userId?: string,
  batchSize: number = 10
): Promise<ChunkBackfillResponse> {
  const startTime = Date.now();
  const supabase = createServiceRoleClient();

  let sourcesProcessed = 0;
  let chunksCreated = 0;
  let chunksEmbedded = 0;
  let failed = 0;

  try {
    // Get sources without chunks
    let query = supabase
      .from('sources')
      .select('id, original_content, content_type')
      .not('content_type', 'eq', 'image'); // Skip images

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: sources, error: fetchError } = await query.limit(batchSize);

    if (fetchError) {
      throw fetchError;
    }

    if (!sources || sources.length === 0) {
      return {
        sources_processed: 0,
        chunks_created: 0,
        chunks_embedded: 0,
        failed: 0,
        duration_ms: Date.now() - startTime,
      };
    }

    // Filter sources that don't have chunks yet
    const sourcesNeedingChunks = [];
    for (const source of sources) {
      const { count } = await supabase
        .from('content_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', source.id);

      if (count === 0 && shouldChunk(source.content_type, source.original_content.length)) {
        sourcesNeedingChunks.push(source);
      }
    }

    // Process each source
    for (const source of sourcesNeedingChunks) {
      try {
        const chunks = await createSourceChunks(
          source.id,
          source.original_content,
          source.content_type
        );

        sourcesProcessed++;
        chunksCreated += chunks.length;
        chunksEmbedded += chunks.filter(c => c.embedding !== null).length;
      } catch (error) {
        console.error(`Failed to chunk source ${source.id}:`, error);
        failed++;
      }
    }

    return {
      sources_processed: sourcesProcessed,
      chunks_created: chunksCreated,
      chunks_embedded: chunksEmbedded,
      failed,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    throw new Error(
      `Chunk backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get chunk statistics for a source
 */
export async function getChunkStats(sourceId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await (supabase as any).rpc('get_chunk_stats', {
    p_source_id: sourceId,
  });

  if (error) {
    throw new Error(`Failed to get chunk stats: ${error.message}`);
  }

  return data?.[0] || {
    total_chunks: 0,
    chunks_with_embeddings: 0,
    chunks_without_embeddings: 0,
    avg_chunk_length: 0,
  };
}

/**
 * Embed a single chunk
 */
export async function embedChunk(chunkId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get chunk
  const { data: chunk, error: fetchError } = await supabase
    .from('content_chunks')
    .select('*')
    .eq('id', chunkId)
    .single();

  if (fetchError || !chunk) {
    throw new Error('Chunk not found');
  }

  // Generate embedding
  const embeddingResult = await generateEmbedding({
    text: chunk.content,
    type: 'summary',
    normalize: true,
  });

  // Update chunk
  const { error: updateError } = await supabase
    .from('content_chunks')
    .update({ embedding: embeddingResult.embedding })
    .eq('id', chunkId);

  if (updateError) {
    throw new Error(`Failed to update chunk embedding: ${updateError.message}`);
  }
}

/**
 * Backfill embeddings for chunks without them
 */
export async function backfillChunkEmbeddings(
  batchSize: number = 50
): Promise<{ processed: number; failed: number }> {
  const supabase = createServiceRoleClient();

  let processed = 0;
  let failed = 0;

  // Get chunks without embeddings
  const { data: chunks, error } = await supabase
    .from('content_chunks')
    .select('id')
    .is('embedding', null)
    .limit(batchSize);

  if (error || !chunks) {
    throw new Error('Failed to fetch chunks without embeddings');
  }

  // Embed each chunk
  for (const chunk of chunks) {
    try {
      await embedChunk(chunk.id);
      processed++;
    } catch (error) {
      console.error(`Failed to embed chunk ${chunk.id}:`, error);
      failed++;
    }
  }

  return { processed, failed };
}
