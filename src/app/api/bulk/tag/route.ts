/**
 * POST /api/bulk/tag
 *
 * Add tags to multiple sources at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { BulkTagSchema } from '@/lib/validation/schemas';
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors';
import type { TypedSupabaseClient } from '@/types/supabase-helpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to add tags');
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = BulkTagSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message);
    }

    const { source_ids, tags } = validation.data;

    // Normalize tags
    const normalizedTags = tags.map((tag) => tag.toLowerCase().trim());

    // Verify all sources belong to the user
    const { data: sources, error: fetchError } = await supabase
      .from('sources')
      .select('id')
      .in('id', source_ids)
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Fetch sources error:', fetchError);
      throw new Error('Failed to verify source ownership');
    }

    const validSourceIds = sources?.map((s: any) => s.id) || [];

    if (validSourceIds.length === 0) {
      throw new NotFoundError('No valid sources found');
    }

    // Get existing tags to avoid duplicates
    const { data: existingTags, error: existingError } = await supabase
      .from('tags')
      .select('source_id, tag_name')
      .in('source_id', validSourceIds);

    if (existingError) {
      console.error('Fetch existing tags error:', existingError);
      throw new Error('Failed to fetch existing tags');
    }

    // Build set of existing tag combinations
    const existingSet = new Set(
      existingTags?.map((t: any) => `${t.source_id}:${t.tag_name.toLowerCase()}`) || []
    );

    // Create new tag entries (avoid duplicates)
    const newTags: Array<{ source_id: string; tag_name: string }> = [];

    validSourceIds.forEach((sourceId: string) => {
      normalizedTags.forEach((tag: string) => {
        const key = `${sourceId}:${tag}`;
        if (!existingSet.has(key)) {
          newTags.push({
            source_id: sourceId,
            tag_name: tag,
          });
        }
      });
    });

    if (newTags.length === 0) {
      return NextResponse.json({
        updated: validSourceIds.length,
        tags_added: 0,
        message: 'All tags already exist on selected sources',
      });
    }

    // Insert new tags
    const { error: insertError } = await supabase
      .from('tags')
      .insert(newTags as never);

    if (insertError) {
      console.error('Insert tags error:', insertError);
      throw new Error('Failed to add tags');
    }

    return NextResponse.json({
      updated: validSourceIds.length,
      tags_added: newTags.length,
      failed: source_ids.length - validSourceIds.length,
    });
  } catch (error) {
    console.error('Bulk tag error:', error);
    return handleAPIError(error);
  }
}
