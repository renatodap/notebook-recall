/**
 * POST /api/bulk/delete
 *
 * Delete multiple sources at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { BulkDeleteSchema } from '@/lib/validation/schemas';
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
      throw new AuthenticationError('Please sign in to delete sources');
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
    const validation = BulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message);
    }

    const { source_ids, confirm } = validation.data;

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
    const invalidCount = source_ids.length - validSourceIds.length;

    if (validSourceIds.length === 0) {
      throw new NotFoundError('No valid sources found to delete');
    }

    // Delete sources (cascades to summaries and tags via foreign key constraints)
    const { error: deleteError } = await supabase
      .from('sources')
      .delete()
      .in('id', validSourceIds)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete sources error:', deleteError);
      throw new Error('Failed to delete sources');
    }

    return NextResponse.json({
      deleted: validSourceIds.length,
      failed: invalidCount,
      errors: invalidCount > 0
        ? [`${invalidCount} source(s) not found or not owned by user`]
        : [],
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return handleAPIError(error);
  }
}
