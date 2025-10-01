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

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  text: z.string().min(1).max(8000),
  type: z.enum(['summary', 'query']),
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
      tokens: result.tokens,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Embedding generation error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate embedding',
      },
      { status: 500 }
    );
  }
}
