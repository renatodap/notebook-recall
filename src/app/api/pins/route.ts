import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { z } from 'zod';

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
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = (supabase as any)
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

    if (error) throw error;

    return NextResponse.json({ pinned_items: data || [] });
  } catch (error) {
    console.error('GET pins error:', error);
    return NextResponse.json({ error: 'Failed to fetch pinned items' }, { status: 500 });
  }
}

/**
 * POST /api/pins - Pin a source to a category
 * Body: { source_id: string, category: 'projects' | 'areas' | 'resources' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = PinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { source_id, category } = validation.data;

    // Check if user owns the source
    const { data: source, error: sourceError } = await (supabase as any)
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Check limit: max 3 pins per category
    const { data: existingPins, error: countError } = await (supabase as any)
      .from('pinned_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', category);

    if (countError) throw countError;

    if (existingPins && existingPins.length >= 3) {
      return NextResponse.json(
        { error: `Maximum 3 pinned items per category. Unpin one first.` },
        { status: 400 }
      );
    }

    // Pin the source
    const { data: pinnedItem, error: pinError } = await (supabase as any)
      .from('pinned_items')
      .insert({
        user_id: user.id,
        source_id,
        category,
      })
      .select()
      .single();

    if (pinError) {
      // Check if it's already pinned (unique constraint violation)
      if (pinError.code === '23505') {
        return NextResponse.json({ error: 'Source is already pinned' }, { status: 400 });
      }
      throw pinError;
    }

    return NextResponse.json({ pinned_item: pinnedItem }, { status: 201 });
  } catch (error) {
    console.error('POST pins error:', error);
    return NextResponse.json({ error: 'Failed to pin source' }, { status: 500 });
  }
}

/**
 * DELETE /api/pins - Unpin a source from a category
 * Body: { source_id: string, category: 'projects' | 'areas' | 'resources' }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = UnpinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { source_id, category } = validation.data;

    // Delete the pin
    const { error } = await (supabase as any)
      .from('pinned_items')
      .delete()
      .eq('user_id', user.id)
      .eq('source_id', source_id)
      .eq('category', category);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE pins error:', error);
    return NextResponse.json({ error: 'Failed to unpin source' }, { status: 500 });
  }
}
