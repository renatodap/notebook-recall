import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { CreateResourceRequest, Resource } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/para/resources - Get all resources for the authenticated user
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        *,
        source_count:resource_sources(count)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .returns<(Resource & { source_count: number })[]>();

    if (error) throw error;

    return NextResponse.json({ resources: resources || [] });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/para/resources - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateResourceRequest = await request.json();

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        user_id: session.user.id,
        name: body.name,
        description: body.description || null,
        category: body.category || null,
      })
      .select()
      .single()
      .returns<Resource>();

    if (error) throw error;

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
