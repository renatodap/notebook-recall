import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { ArchiveSourceRequest } from '@/types';

export const dynamic = 'force-dynamic';

// POST /api/para/sources/archive - Archive or unarchive a source
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ArchiveSourceRequest = await request.json();
    const { source_id, archived } = body;

    const { data: source, error } = await supabase
      .from('sources')
      .update({ archived })
      .eq('id', source_id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Error archiving source:', error);
    return NextResponse.json(
      { error: 'Failed to archive source' },
      { status: 500 }
    );
  }
}

// GET /api/para/sources/archive - Get all archived sources
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sources, error } = await supabase
      .from('sources')
      .select(`
        *,
        summaries (*)
      `)
      .eq('user_id', session.user.id)
      .eq('archived', true)
      .order('archived_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sources: sources || [] });
  } catch (error) {
    console.error('Error fetching archived sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived sources' },
      { status: 500 }
    );
  }
}
