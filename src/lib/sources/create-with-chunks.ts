/**
 * Source Creation Service with Automatic Chunking
 *
 * Wrapper service that creates a source and automatically chunks it
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings/client';
import { createSourceChunks } from '@/lib/chunking/embeddings';
import type { ContentType } from '@/types';

export interface CreateSourceWithChunksParams {
  userId: string;
  title: string;
  contentType: ContentType;
  originalContent: string;
  url?: string;
  summaryText: string;
  keyActions: string[];
  keyTopics: string[];
  wordCount: number;
}

export interface CreateSourceWithChunksResult {
  source: any;
  summary: any;
  chunks: any[];
  chunksCreated: number;
}

/**
 * Create a source with automatic chunking and embedding
 */
export async function createSourceWithChunks(
  params: CreateSourceWithChunksParams
): Promise<CreateSourceWithChunksResult> {
  const {
    userId,
    title,
    contentType,
    originalContent,
    url,
    summaryText,
    keyActions,
    keyTopics,
    wordCount,
  } = params;

  const supabase = createServiceRoleClient();

  try {
    // 1. Create source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        user_id: userId,
        title,
        content_type: contentType,
        original_content: originalContent,
        url,
      })
      .select()
      .single();

    if (sourceError) {
      throw new Error(`Failed to create source: ${sourceError.message}`);
    }

    // 2. Generate embedding for summary
    const textToEmbed = [summaryText, ...keyTopics].join(' ');
    const embeddingResult = await generateEmbedding({
      text: textToEmbed,
      type: 'summary',
      normalize: true,
    });

    // 3. Create summary with embedding
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        source_id: source.id,
        summary_text: summaryText,
        key_actions: keyActions,
        key_topics: keyTopics,
        word_count: wordCount,
        embedding: embeddingResult.embedding,
      })
      .select()
      .single();

    if (summaryError) {
      throw new Error(`Failed to create summary: ${summaryError.message}`);
    }

    // 4. Create tags
    if (keyTopics.length > 0) {
      const tagsData = keyTopics.map((topic) => ({
        source_id: source.id,
        tag_name: topic.toLowerCase(),
      }));

      await supabase.from('tags').insert(tagsData);
    }

    // 5. Create chunks (async, non-blocking)
    let chunks: any[] = [];
    let chunksCreated = 0;

    try {
      chunks = await createSourceChunks(source.id, originalContent, contentType);
      chunksCreated = chunks.length;

      if (chunksCreated > 0) {
        console.log(`Created ${chunksCreated} chunks for source ${source.id}`);
      }
    } catch (chunkError) {
      console.error('Chunking failed (non-critical):', chunkError);
      // Continue - chunking is optional
    }

    return {
      source,
      summary,
      chunks,
      chunksCreated,
    };
  } catch (error) {
    throw error;
  }
}
