import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { RemoveSourceFromPARARequest } from '@/types';

export const dynamic = 'force-dynamic';

// POST /api/para/sources/unassign - Remove a source from PARA categories
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RemoveSourceFromPARARequest = await request.json();
    const { source_id, project_id, area_id, resource_id } = body;

    // Verify the source belongs to the user
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('user_id')
      .eq('id', source_id)
      .single();

    if (sourceError || !source || source.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Source not found or unauthorized' }, { status: 404 });
    }

    // Remove from project
    if (project_id) {
      const { error } = await supabase
        .from('project_sources')
        .delete()
        .eq('project_id', project_id)
        .eq('source_id', source_id);

      if (error) throw error;
    }

    // Remove from area
    if (area_id) {
      const { error } = await supabase
        .from('area_sources')
        .delete()
        .eq('area_id', area_id)
        .eq('source_id', source_id);

      if (error) throw error;
    }

    // Remove from resource
    if (resource_id) {
      const { error } = await supabase
        .from('resource_sources')
        .delete()
        .eq('resource_id', resource_id)
        .eq('source_id', source_id);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing source from PARA:', error);
    return NextResponse.json(
      { error: 'Failed to remove source' },
      { status: 500 }
    );
  }
}
