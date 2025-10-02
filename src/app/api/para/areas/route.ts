import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import type { CreateAreaRequest } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/para/areas - Get all areas for the authenticated user
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: areas, error } = await (supabase as any)
      .from('areas')
      .select(`
        *,
        source_count:area_sources(count)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ areas: areas || [] });
  } catch (error) {
    console.error('Error fetching areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch areas' },
      { status: 500 }
    );
  }
}

// POST /api/para/areas - Create a new area
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateAreaRequest = await request.json();

    const { data: area, error } = await (supabase as any)
      .from('areas')
      .insert({
        user_id: session.user.id,
        name: body.name,
        description: body.description || null,
        standard: body.standard || null,
        review_frequency: body.review_frequency || 'monthly',
        icon: (body as any).icon || '🌳',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ area }, { status: 201 });
  } catch (error) {
    console.error('Error creating area:', error);
    return NextResponse.json(
      { error: 'Failed to create area' },
      { status: 500 }
    );
  }
}
