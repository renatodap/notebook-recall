import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors';
import type { TypedSupabaseClient } from '@/types/supabase-helpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const PinSchema = z.object({
  source_id: z.string().uuid(),
  category: z.enum(['projects', 'areas', 'resources']),
});

const UnpinSchema = z.object({
  source_id: z.string().uuid(),
  category: z.enum(['projects', 'areas', 'resources']),
});

/**
 * GET /api/pins - Get all pinned items for the user
 * Query params:
 *   - category: 'projects' | 'areas' | 'resources' (optional, filter by category)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to view pinned items');
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('pinned_items')
      .select(
        `
        id,
        source_id,
        category,
        pinned_at,
        sources (
          *,
          summaries (*),
          tags (*)
        )
      `
      )
      .eq('user_id', user.id)
      .order('pinned_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch pinned items error:', error);
      throw new Error('Failed to fetch pinned items');
    }

    return NextResponse.json({ pinned_items: data || [] });
  } catch (error) {
    console.error('GET pins error:', error);
    return handleAPIError(error);
  }
}

/**
 * POST /api/pins - Pin a source to a category
 * Body: { source_id: string, category: 'projects' | 'areas' | 'resources' }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to pin sources');
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
    }

    const body = await request.json();
    const validation = PinSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message);
    }

    const { source_id, category } = validation.data;

    // Check if user owns the source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single();

    if (sourceError || !source) {
      throw new NotFoundError('Source not found or you do not have permission to access it');
    }

    // Check limit: max 3 pins per category
    const { data: existingPins, error: countError } = await supabase
      .from('pinned_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', category);

    if (countError) {
      console.error('Count pinned items error:', countError);
      throw new Error('Failed to check pin limit');
    }

    if (existingPins && existingPins.length >= 3) {
      throw new ValidationError(`Maximum 3 pinned items per category. Unpin one first.`);
    }

    // Pin the source
    const { data: pinnedItem, error: pinError } = await supabase
      .from('pinned_items')
      .insert({
        user_id: user.id,
        source_id,
        category,
      } as never)
      .select()
      .single();

    if (pinError) {
      // Check if it's already pinned (unique constraint violation)
      if (pinError.code === '23505') {
        throw new ValidationError('Source is already pinned to this category');
      }
      console.error('Pin source error:', pinError);
      throw new Error('Failed to pin source');
    }

    return NextResponse.json({ pinned_item: pinnedItem }, { status: 201 });
  } catch (error) {
    console.error('POST pins error:', error);
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/pins - Unpin a source from a category
 * Body: { source_id: string, category: 'projects' | 'areas' | 'resources' }
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to unpin sources');
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
    }

    const body = await request.json();
    const validation = UnpinSchema.safeParse(body);

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message);
    }

    const { source_id, category } = validation.data;

    // Delete the pin
    const { error } = await supabase
      .from('pinned_items')
      .delete()
      .eq('user_id', user.id)
      .eq('source_id', source_id)
      .eq('category', category);

    if (error) {
      console.error('Unpin source error:', error);
      throw new Error('Failed to unpin source');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE pins error:', error);
    return handleAPIError(error);
  }
}
