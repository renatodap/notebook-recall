/**
 * POST /api/search/enhanced
 *
 * Chunk-based hierarchical search with passage highlighting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings/client';
import { z } from 'zod';
import type {
  EnhancedSearchRequest,
  EnhancedSearchResponse,
  ChunkSearchResult,
  GroupedSearchResults,
} from '@/types/chunks';

export const dynamic = 'force-dynamic';

const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  mode: z.enum(['chunks', 'summaries', 'hybrid']).optional(),
  limit: z.number().int().positive().max(50).optional(),
  threshold: z.number().min(0).max(1).optional(),
  collection_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    const validation = SearchRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      query,
      mode = 'hybrid',
      limit = 20,
      threshold = 0.7,
      collection_id,
    } = validation.data as EnhancedSearchRequest;

    // Generate query embedding
    const queryEmbedding = await generateEmbedding({
      text: query,
      type: 'query',
      normalize: true,
    });

    let results: ChunkSearchResult[] = [];

    if (mode === 'chunks' || mode === 'hybrid') {
      // Search chunks for granular results
      const { data: chunkData, error: chunkError } = await (supabase as any).rpc(
        'match_content_chunks',
        {
          query_embedding: queryEmbedding.embedding,
          match_threshold: threshold,
          match_count: mode === 'hybrid' ? limit * 2 : limit,
          p_user_id: user.id,
          p_collection_id: collection_id || null,
        }
      );

      if (chunkError) {
        console.error('Chunk search error:', chunkError);
      } else if (chunkData) {
        results = chunkData.map((item: any) => ({
          chunk: {
            id: item.chunk_id,
            source_id: item.source_id,
            chunk_index: item.chunk_index,
            content: item.chunk_content,
            embedding: null,
            metadata: item.chunk_metadata || {},
            created_at: new Date().toISOString(),
          },
          source: {
            id: item.source_id,
            user_id: item.user_id,
            title: item.source_title,
            content_type: item.source_content_type,
            original_content: '',
            url: item.source_url,
            created_at: item.source_created_at,
            updated_at: item.source_created_at,
          },
          relevance_score: item.similarity || 0,
          highlighted_content: highlightQuery(item.chunk_content, query),
        }));
      }
    }

    if (mode === 'summaries') {
      // Use existing summary search
      const { data: summaryData, error: summaryError } = await (supabase as any).rpc(
        'match_summaries',
        {
          query_embedding: queryEmbedding.embedding,
          match_threshold: threshold,
          match_count: limit,
          p_user_id: user.id,
          p_collection_id: collection_id || null,
        }
      );

      if (summaryError) {
        console.error('Summary search error:', summaryError);
      } else if (summaryData) {
        // Convert summary results to chunk format for consistency
        results = summaryData.map((item: any) => ({
          chunk: {
            id: item.summary_id,
            source_id: item.source_id,
            chunk_index: 0,
            content: item.summary_text,
            embedding: null,
            metadata: {
              type: 'summary',
              key_topics: item.key_topics,
              key_actions: item.key_actions,
            },
            created_at: item.summary_created_at,
          },
          source: {
            id: item.source_id,
            user_id: item.user_id,
            title: item.title,
            content_type: item.content_type,
            original_content: item.original_content,
            url: item.url,
            created_at: item.created_at,
            updated_at: item.updated_at,
          },
          relevance_score: item.similarity || 0,
          highlighted_content: highlightQuery(item.summary_text, query),
        }));
      }
    }

    // Group results by source for better UX
    const grouped = groupBySource(results);

    // Sort by best match score
    grouped.sort((a, b) => b.best_score - a.best_score);

    // Limit grouped results
    const limitedGrouped = grouped.slice(0, mode === 'hybrid' ? limit / 2 : limit);

    // Flatten back to chunks for response
    const flatResults = limitedGrouped.flatMap(g => g.chunks).slice(0, limit);

    const response: EnhancedSearchResponse = {
      results: flatResults,
      total: flatResults.length,
      search_mode: mode,
      grouped_by_source: limitedGrouped,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Enhanced search API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to search sources',
      },
      { status: 500 }
    );
  }
}

/**
 * Highlight query terms in content
 */
function highlightQuery(content: string, query: string): string {
  const queryTerms = query.toLowerCase().split(/\s+/);
  let highlighted = content;

  for (const term of queryTerms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }

  // Truncate around highlights for better context
  const maxLength = 300;
  const markIndex = highlighted.indexOf('<mark>');

  if (markIndex !== -1 && highlighted.length > maxLength) {
    const start = Math.max(0, markIndex - 100);
    const end = Math.min(highlighted.length, markIndex + 200);

    let truncated = highlighted.slice(start, end);

    if (start > 0) truncated = '...' + truncated;
    if (end < highlighted.length) truncated = truncated + '...';

    return truncated;
  }

  return highlighted;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Group chunk results by source
 */
function groupBySource(results: ChunkSearchResult[]): GroupedSearchResults[] {
  const grouped = new Map<string, GroupedSearchResults>();

  for (const result of results) {
    const sourceId = result.source.id;

    if (!grouped.has(sourceId)) {
      grouped.set(sourceId, {
        source: result.source,
        summary: {
          id: '',
          source_id: sourceId,
          summary_text: '',
          key_actions: [],
          key_topics: [],
          word_count: 0,
          embedding: null,
          created_at: result.source.created_at,
        },
        chunks: [],
        best_score: result.relevance_score,
        total_matches: 0,
      });
    }

    const group = grouped.get(sourceId)!;
    group.chunks.push(result);
    group.best_score = Math.max(group.best_score, result.relevance_score);
    group.total_matches = group.chunks.length;
  }

  return Array.from(grouped.values());
}
