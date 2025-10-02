import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/para/relationships - Add a relationship
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, from_id, to_id } = await request.json();

    // Validate relationship type
    const validTypes = ['project-area', 'project-resource', 'area-resource'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid relationship type' }, { status: 400 });
    }

    let tableName = '';
    const data: any = { user_id: session.user.id };

    // Determine table and field names based on type
    if (type === 'project-area') {
      tableName = 'project_areas';
      data.project_id = from_id;
      data.area_id = to_id;
    } else if (type === 'project-resource') {
      tableName = 'project_resources';
      data.project_id = from_id;
      data.resource_id = to_id;
    } else if (type === 'area-resource') {
      tableName = 'area_resources';
      data.area_id = from_id;
      data.resource_id = to_id;
    }

    // Insert relationship (will fail if duplicate due to unique constraint)
    const { data: relationship, error } = await (supabase as any)
      .from(tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Relationship already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    console.error('Error creating relationship:', error);
    return NextResponse.json(
      { error: 'Failed to create relationship' },
      { status: 500 }
    );
  }
}

// DELETE /api/para/relationships - Remove a relationship
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const from_id = searchParams.get('from_id');
    const to_id = searchParams.get('to_id');

    if (!type || !from_id || !to_id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let tableName = '';
    const conditions: any = { user_id: session.user.id };

    // Determine table and conditions based on type
    if (type === 'project-area') {
      tableName = 'project_areas';
      conditions.project_id = from_id;
      conditions.area_id = to_id;
    } else if (type === 'project-resource') {
      tableName = 'project_resources';
      conditions.project_id = from_id;
      conditions.resource_id = to_id;
    } else if (type === 'area-resource') {
      tableName = 'area_resources';
      conditions.area_id = from_id;
      conditions.resource_id = to_id;
    } else {
      return NextResponse.json({ error: 'Invalid relationship type' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from(tableName)
      .delete()
      .match(conditions);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    return NextResponse.json(
      { error: 'Failed to delete relationship' },
      { status: 500 }
    );
  }
}
