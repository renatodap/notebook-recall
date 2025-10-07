/**
 * POST /api/embeddings/generate
 *
 * Generate embedding for text
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings/client';
import { z } from 'zod';
import type { EmbeddingGenerateRequest, EmbeddingGenerateResponse } from '@/types';
import {
  AuthenticationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors';
import type { TypedSupabaseClient } from '@/types/supabase-helpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  text: z.string().min(1).max(8000),
  type: z.enum(['summary', 'query']),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('Please sign in to generate embeddings');
    }

    // Check rate limit
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

    const { text, type } = validation.data as EmbeddingGenerateRequest;

    // Generate embedding
    const result = await generateEmbedding({
      text,
      type,
      normalize: true,
    });

    const response: EmbeddingGenerateResponse = {
      embedding: result.embedding,
      model: result.model,
      tokens: result.tokens || result.tokenCount || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Embedding generation error:', error);
    return handleAPIError(error);
  }
}
