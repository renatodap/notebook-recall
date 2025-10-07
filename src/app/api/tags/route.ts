/**
 * GET /api/tags
 *
 * Get all tags for the authenticated user with source counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors';
import type { TypedSupabaseClient } from '@/types/supabase-helpers';
import type { GetTagsResponse, TagWithCount } from '@/types';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to view tags');
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
    }

    // Get tags with counts
    // First get all tags for user's sources
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select(
        `
        tag_name,
        source_id,
        sources!inner(user_id)
      `
      )
      .eq('sources.user_id', user.id);

    if (tagsError) {
      console.error('Fetch tags error:', tagsError);
      throw new Error('Failed to fetch tags');
    }

    // Aggregate tags and count sources
    const tagMap = new Map<string, Set<string>>();

    tagsData?.forEach((tag: any) => {
      const tagName = tag.tag_name.toLowerCase();

      if (!tagMap.has(tagName)) {
        tagMap.set(tagName, new Set());
      }

      tagMap.get(tagName)!.add(tag.source_id);
    });

    // Convert to response format
    const tags: TagWithCount[] = Array.from(tagMap.entries())
      .map(([tag_name, sourceIds]) => ({
        tag_name,
        count: sourceIds.size,
        sources: Array.from(sourceIds),
      }))
      .sort((a, b) => {
        // Sort by count (descending), then by name (ascending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.tag_name.localeCompare(b.tag_name);
      });

    const response: GetTagsResponse = {
      tags,
      total: tags.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return handleAPIError(error);
  }
}
