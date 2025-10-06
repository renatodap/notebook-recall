/**
 * POST /api/embeddings/backfill
 *
 * Admin endpoint to backfill embeddings for existing summaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { backfillEmbeddings } from '@/lib/embeddings/backfill';
import { requireAdmin } from '@/lib/auth/admin';
import { z } from 'zod';
import type { BackfillRequest } from '@/types';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  batch_size: z.number().min(1).max(100).optional(),
  dry_run: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Admin-only endpoint
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

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
      batchSize: batch_size,
      dryRun: dry_run,
    });

    const response: any = {
      total: result.total,
      processed: result.processed,
      successes: result.successes,
      failures: result.failures,
      errors: result.failures
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
