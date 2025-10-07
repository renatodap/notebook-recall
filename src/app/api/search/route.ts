/**
 * POST /api/search
 *
 * Enhanced search with semantic, keyword, and hybrid modes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings/client';
import { calculateHybridScore } from '@/lib/embeddings/utils';
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors';
import { z } from 'zod';
import type { SearchRequest, SearchResponse, SearchMode, SearchResult } from '@/types';
import type { TypedSupabaseClient } from '@/types/supabase-helpers';
import { DatabaseSource } from '@/types/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  mode: z.enum(['semantic', 'keyword', 'hybrid']).optional(),
  limit: z.number().int().positive().max(100).optional(),
  threshold: z.number().min(0).max(1).optional(),
  collection_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to search sources');
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
    }

    const body = await request.json();

    // Validate request
    const validation = SearchRequestSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message);
    }

    const {
      query,
      mode = 'hybrid',
      limit = 20,
      threshold = 0.7,
      collection_id,
    } = validation.data as SearchRequest;

    let results: SearchResult[] = [];
    const searchMode: SearchMode = mode;

    // Semantic or Hybrid Search
    if (mode === 'semantic' || mode === 'hybrid') {
      try {
        // Generate query embedding
        console.log(`[Search] Generating embedding for query: "${query}"`);
        const queryEmbedding = await generateEmbedding({
          text: query,
          type: 'query',
          normalize: true,
        });

        console.log(`[Search] Query embedding generated:`, {
          provider: queryEmbedding.provider,
          model: queryEmbedding.model,
          dimension: queryEmbedding.embedding.length,
          cost: queryEmbedding.cost,
        });

        // Use database function for vector similarity search
        console.log(`[Search] Calling match_summaries with threshold: ${threshold}`);
        const { data: semanticData, error: semanticError } = await supabase.rpc(
          'match_summaries',
          {
            query_embedding: queryEmbedding.embedding,
            match_threshold: threshold,
            match_count: limit,
            p_user_id: user.id,
            p_collection_id: collection_id || null,
          } as never
        );

        console.log(`[Search] match_summaries result:`, {
          success: !semanticError,
          results_count: semanticData ? (semanticData as any[]).length : 0,
          error: semanticError?.message,
        });

        if (semanticError) {
          console.error('Semantic search error:', semanticError);

          // Fall back to keyword search if semantic search fails
          if (mode === 'semantic') {
            console.log('Falling back to keyword search due to semantic error');
            return await performKeywordSearch(supabase, user.id, query, limit, collection_id);
          }
        } else if (semanticData && (semanticData as any[]).length > 0) {
          // Transform semantic results
          results = (semanticData as any[]).map((item: any) => ({
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
            summary: {
              id: item.summary_id,
              source_id: item.source_id,
              summary_text: item.summary_text,
              key_actions: item.key_actions || [],
              key_topics: item.key_topics || [],
              word_count: item.word_count || 0,
              embedding: null,
              created_at: item.summary_created_at,
            },
            relevance_score: item.similarity || 0,
            match_type: 'semantic',
            matched_content: item.summary_text?.substring(0, 200) || '',
          }));
        } else if (mode === 'semantic') {
          // No semantic results found, fall back to keyword search
          console.log('No semantic results found, falling back to keyword search');
          return await performKeywordSearch(supabase, user.id, query, limit, collection_id);
        }
      } catch (error) {
        console.error('Embedding generation error:', error);

        // Fall back to keyword search
        if (mode === 'semantic') {
          console.log('Falling back to keyword search due to embedding error');
          return await performKeywordSearch(supabase, user.id, query, limit, collection_id);
        }
      }
    }

    // Keyword or Hybrid Search
    if (mode === 'keyword' || (mode === 'hybrid' && results.length < limit)) {
      const keywordResults = await getKeywordResults(supabase, user.id, query, limit, collection_id);

      if (mode === 'keyword') {
        results = keywordResults;
      } else {
        // Merge with semantic results for hybrid
        results = mergeResults(results, keywordResults, limit);
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    // Limit results
    results = results.slice(0, limit);

    const response: SearchResponse = {
      results,
      total: results.length,
      search_mode: searchMode,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return handleAPIError(error);
  }
}

/**
 * Perform keyword search
 */
async function getKeywordResults(
  supabase: TypedSupabaseClient,
  userId: string,
  query: string,
  limit: number,
  collectionId?: string
): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`;

  let queryBuilder = supabase
    .from('sources')
    .select(
      `
      *,
      summary:summaries(*)${collectionId ? ',collection_sources!inner(collection_id)' : ''}
    `
    )
    .eq('user_id', userId);

  // Apply collection filter if provided
  if (collectionId) {
    queryBuilder = queryBuilder.eq('collection_sources.collection_id', collectionId);
  }

  const { data, error } = await queryBuilder
    .or(
      `title.ilike.${searchPattern},original_content.ilike.${searchPattern}`
    )
    .limit(limit);

  if (error) {
    console.error('Keyword search error:', error);
    return [];
  }

  // Calculate keyword relevance scores
  return (data || []).map((item: any) => {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    if (item.title?.toLowerCase().includes(lowerQuery)) score += 0.3;
    if (item.original_content?.toLowerCase().includes(lowerQuery)) score += 0.4;
    if (item.summary?.[0]?.summary_text?.toLowerCase().includes(lowerQuery))
      score += 0.3;

    // Normalize to 0-1 range
    score = Math.min(score, 1.0);

    return {
      source: {
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        content_type: item.content_type,
        original_content: item.original_content,
        url: item.url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
      summary: item.summary?.[0] || {
        id: '',
        source_id: item.id,
        summary_text: '',
        key_actions: [],
        key_topics: [],
        word_count: 0,
        embedding: null,
        created_at: item.created_at,
      },
      relevance_score: score,
      match_type: 'keyword' as const,
      matched_content: item.title || '',
    };
  });
}

/**
 * Perform keyword search and return as NextResponse
 */
async function performKeywordSearch(
  supabase: TypedSupabaseClient,
  userId: string,
  query: string,
  limit: number,
  collectionId?: string
): Promise<NextResponse> {
  const results = await getKeywordResults(supabase, userId, query, limit, collectionId);

  const response: SearchResponse = {
    results,
    total: results.length,
    search_mode: 'keyword',
  };

  return NextResponse.json(response);
}

/**
 * Merge semantic and keyword results for hybrid search
 */
function mergeResults(
  semanticResults: SearchResult[],
  keywordResults: SearchResult[],
  limit: number
): SearchResult[] {
  const merged = new Map<string, SearchResult>();

  // Add semantic results
  semanticResults.forEach((result) => {
    merged.set(result.source.id, result);
  });

  // Merge keyword results
  keywordResults.forEach((keywordResult) => {
    const existing = merged.get(keywordResult.source.id);

    if (existing) {
      // Calculate hybrid score
      const hybrid = calculateHybridScore(
        existing.relevance_score,
        keywordResult.relevance_score
      );

      merged.set(keywordResult.source.id, {
        ...existing,
        relevance_score: hybrid.finalScore || 0,
        match_type: 'hybrid',
      });
    } else {
      // Add as keyword-only result
      merged.set(keywordResult.source.id, keywordResult);
    }
  });

  return Array.from(merged.values()).slice(0, limit);
}
