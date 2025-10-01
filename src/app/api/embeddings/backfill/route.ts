/**
 * POST /api/embeddings/backfill
 *
 * Admin endpoint to backfill embeddings for existing summaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { backfillEmbeddings } from '@/lib/embeddings/backfill';
import { z } from 'zod';
import type { BackfillRequest, BackfillResponse } from '@/types';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  batch_size: z.number().min(1).max(100).optional(),
  dry_run: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin check
    // For now, allow all authenticated users
    // In production, check if user.email is in admin list or has admin role

    // Parse request
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { batch_size, dry_run } = validation.data as BackfillRequest;

    // Run backfill
    const result = await backfillEmbeddings({
      batch_size,
      dry_run,
      skipExisting: true,
    });

    const response: BackfillResponse = {
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      duration_ms: result.duration_ms,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Backfill error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Backfill operation failed',
      },
      { status: 500 }
    );
  }
}
