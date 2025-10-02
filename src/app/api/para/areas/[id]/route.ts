import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/para/areas/[id] - Get a specific area with sources
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: area, error } = await supabase
      .from('areas')
      .select(`
        *,
        area_sources (
          source_id,
          added_at,
          note,
          sources (
            *,
            summaries (*)
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ area });
  } catch (error) {
    console.error('Error fetching area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch area' },
      { status: 500 }
    );
  }
}

// PATCH /api/para/areas/[id] - Update an area
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.standard !== undefined) updateData.standard = body.standard;
    if (body.review_frequency !== undefined) updateData.review_frequency = body.review_frequency;
    if (body.icon !== undefined) updateData.icon = body.icon;

    const { data: area, error } = await (supabase as any)
      .from('areas')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ area });
  } catch (error) {
    console.error('Error updating area:', error);
    return NextResponse.json(
      { error: 'Failed to update area' },
      { status: 500 }
    );
  }
}

// DELETE /api/para/areas/[id] - Delete an area
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await (supabase as any)
      .from('areas')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting area:', error);
    return NextResponse.json(
      { error: 'Failed to delete area' },
      { status: 500 }
    );
  }
}
