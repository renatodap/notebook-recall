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
import { handleAPIError, RateLimitError } from '@/lib/errors/custom-errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  batch_size: z.number().min(1).max(100).optional(),
  dry_run: z.boolean().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Admin-only endpoint
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        await adminCheck.response.json(),
        { status: adminCheck.response.status }
      );
    }

    // Get user for rate limiting
    const { createRouteHandlerClient } = await import('@/lib/supabase/server');
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (even for admin)
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.EMBEDDINGS);
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      );
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

    const response = {
      total: result.total,
      processed: result.processed,
      successes: result.successes,
      failures: result.failures,
      errors: result.failures
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Backfill error:', error);
    return handleAPIError(error);
  }
}
