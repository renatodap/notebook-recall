import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { AddSourceToPARARequest } from '@/types';

export const dynamic = 'force-dynamic';

// POST /api/para/sources/assign - Assign a source to PARA categories
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AddSourceToPARARequest = await request.json();
    const { source_id, project_ids = [], area_ids = [], resource_ids = [] } = body;

    // Verify the source belongs to the user
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('user_id')
      .eq('id', source_id)
      .single();

    if (sourceError || !source || source.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Source not found or unauthorized' }, { status: 404 });
    }

    // Add to projects
    if (project_ids.length > 0) {
      const projectAssignments = project_ids.map(id => ({
        project_id: id,
        source_id,
      }));

      const { error: projectError } = await supabase
        .from('project_sources')
        .upsert(projectAssignments, { onConflict: 'project_id,source_id' });

      if (projectError) throw projectError;
    }

    // Add to areas
    if (area_ids.length > 0) {
      const areaAssignments = area_ids.map(id => ({
        area_id: id,
        source_id,
      }));

      const { error: areaError } = await supabase
        .from('area_sources')
        .upsert(areaAssignments, { onConflict: 'area_id,source_id' });

      if (areaError) throw areaError;
    }

    // Add to resources
    if (resource_ids.length > 0) {
      const resourceAssignments = resource_ids.map(id => ({
        resource_id: id,
        source_id,
      }));

      const { error: resourceError } = await supabase
        .from('resource_sources')
        .upsert(resourceAssignments, { onConflict: 'resource_id,source_id' });

      if (resourceError) throw resourceError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning source to PARA:', error);
    return NextResponse.json(
      { error: 'Failed to assign source' },
      { status: 500 }
    );
  }
}
