import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/para/sources/unassigned - Get all unassigned sources
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the database function to get unassigned sources
    const { data: sources, error } = await supabase
      .rpc('get_unassigned_sources', { p_user_id: session.user.id });

    if (error) throw error;

    return NextResponse.json({ sources: sources || [] });
  } catch (error) {
    console.error('Error fetching unassigned sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unassigned sources' },
      { status: 500 }
    );
  }
}
