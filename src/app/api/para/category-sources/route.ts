import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/para/category-sources?category=projects|areas|resources
 * Get all sources belonging to a PARA category for the authenticated user
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

    if (!category || !['projects', 'areas', 'resources', 'archive'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be: projects, areas, resources, or archive' },
        { status: 400 }
      );
    }

    let sources = [];

    if (category === 'archive') {
      // Get archived sources
      const { data, error } = await (supabase as any)
        .from('sources')
        .select(
          `
          *,
          summary:summaries(*),
          tags:tags(*)
        `
        )
        .eq('user_id', user.id)
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      sources = data || [];
    } else if (category === 'projects') {
      // Get all sources assigned to any project
      const { data, error } = await (supabase as any)
        .from('project_sources')
        .select(
          `
          source_id,
          sources (
            *,
            summaries (*),
            tags (*)
          )
        `
        )
        .eq('sources.user_id', user.id)
        .eq('sources.archived', false);

      if (error) throw error;

      // Extract sources from junction table result
      sources = (data || [])
        .map((item: any) => item.sources)
        .filter((source: any) => source !== null);

      // Remove duplicates (a source can be in multiple projects)
      const uniqueSources = Array.from(
        new Map(sources.map((s: any) => [s.id, s])).values()
      );
      sources = uniqueSources;
    } else if (category === 'areas') {
      // Get all sources assigned to any area
      const { data, error } = await (supabase as any)
        .from('area_sources')
        .select(
          `
          source_id,
          sources (
            *,
            summaries (*),
            tags (*)
          )
        `
        )
        .eq('sources.user_id', user.id)
        .eq('sources.archived', false);

      if (error) throw error;

      // Extract sources from junction table result
      sources = (data || [])
        .map((item: any) => item.sources)
        .filter((source: any) => source !== null);

      // Remove duplicates
      const uniqueSources = Array.from(
        new Map(sources.map((s: any) => [s.id, s])).values()
      );
      sources = uniqueSources;
    } else if (category === 'resources') {
      // Get all sources assigned to any resource
      const { data, error } = await (supabase as any)
        .from('resource_sources')
        .select(
          `
          source_id,
          sources (
            *,
            summaries (*),
            tags (*)
          )
        `
        )
        .eq('sources.user_id', user.id)
        .eq('sources.archived', false);

      if (error) throw error;

      // Extract sources from junction table result
      sources = (data || [])
        .map((item: any) => item.sources)
        .filter((source: any) => source !== null);

      // Remove duplicates
      const uniqueSources = Array.from(
        new Map(sources.map((s: any) => [s.id, s])).values()
      );
      sources = uniqueSources;
    }

    // Flatten summary arrays
    const flattenedSources = sources.map((source: any) => ({
      ...source,
      summary: Array.isArray(source.summaries)
        ? source.summaries
        : source.summary || [],
    }));

    return NextResponse.json({ sources: flattenedSources });
  } catch (error) {
    console.error('GET category sources error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category sources' },
      { status: 500 }
    );
  }
}
