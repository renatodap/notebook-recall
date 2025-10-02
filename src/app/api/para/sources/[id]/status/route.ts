import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import type { GetSourcePARAStatusResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/para/sources/[id]/status - Get PARA status for a specific source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceId } = await params;
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get source with PARA assignments
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('id, user_id, archived')
      .eq('id', sourceId)
      .eq('user_id', session.user.id)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Get projects
    const { data: projects } = await supabase
      .from('project_sources')
      .select('projects(id, name)')
      .eq('source_id', sourceId);

    // Get areas
    const { data: areas } = await supabase
      .from('area_sources')
      .select('areas(id, name)')
      .eq('source_id', sourceId);

    // Get resources
    const { data: resources } = await supabase
      .from('resource_sources')
      .select('resources(id, name)')
      .eq('source_id', sourceId);

    const projectsList = (projects || []).map((p: any) => p.projects).filter(Boolean);
    const areasList = (areas || []).map((a: any) => a.areas).filter(Boolean);
    const resourcesList = (resources || []).map((r: any) => r.resources).filter(Boolean);

    const has_para_assignment = projectsList.length > 0 || areasList.length > 0 || resourcesList.length > 0;

    const response: GetSourcePARAStatusResponse = {
      source_id: sourceId,
      archived: source.archived || false,
      projects: projectsList,
      areas: areasList,
      resources: resourcesList,
      has_para_assignment,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching source PARA status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch source PARA status' },
      { status: 500 }
    );
  }
}
