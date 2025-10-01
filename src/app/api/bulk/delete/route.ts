/**
 * POST /api/bulk/delete
 *
 * Delete multiple sources at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BulkDeleteSchema = z.object({
  source_ids: z.array(z.string().uuid()).min(1, 'At least one source ID required'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validation = BulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { source_ids } = validation.data;

    // Verify all sources belong to the user
    const { data: sources, error: fetchError } = await supabase
      .from('sources')
      .select('id')
      .in('id', source_ids)
      .eq('user_id', user.id);

    if (fetchError) {
      throw fetchError;
    }

    const validSourceIds = sources?.map((s: any) => s.id) || [];
    const invalidCount = source_ids.length - validSourceIds.length;

    if (validSourceIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid sources found to delete' },
        { status: 404 }
      );
    }

    // Delete sources (cascades to summaries and tags via foreign key constraints)
    const { error: deleteError } = await supabase
      .from('sources')
      .delete()
      .in('id', validSourceIds)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      deleted: validSourceIds.length,
      failed: invalidCount,
      errors: invalidCount > 0
        ? [`${invalidCount} source(s) not found or not owned by user`]
        : [],
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sources' },
      { status: 500 }
    );
  }
}
