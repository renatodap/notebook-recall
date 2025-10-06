import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import type { PARAStats } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/para/stats - Get PARA statistics for the authenticated user
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the database function to get stats
    const { data, error } = await supabase
      .rpc('get_para_stats', { p_user_id: session.user.id } as never)
      .single();

    if (error) throw error;

    const stats: PARAStats = {
      total_sources: Number((data as any).total_sources) || 0,
      archived_sources: Number((data as any).archived_sources) || 0,
      unassigned_sources: Number((data as any).unassigned_sources) || 0,
      project_count: Number((data as any).project_count) || 0,
      area_count: Number((data as any).area_count) || 0,
      resource_count: Number((data as any).resource_count) || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching PARA stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PARA stats' },
      { status: 500 }
    );
  }
}
