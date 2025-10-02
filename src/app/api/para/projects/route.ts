import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import type { CreateProjectRequest } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/para/projects - Get all projects for the authenticated user
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        source_count:project_sources(count)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .returns<(Project & { source_count: number })[]>();

    if (error) throw error;

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/para/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateProjectRequest = await request.json();

    const { data: project, error } = await (supabase as any)
      .from('projects')
      .insert({
        user_id: session.user.id,
        name: body.name,
        description: body.description || null,
        goal: body.goal || null,
        deadline: body.deadline || null,
        status: body.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
