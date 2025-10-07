import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/api-auth'
import { AuthenticationError, handleAPIError } from '@/lib/errors/custom-errors'
import { z } from 'zod'

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().min(1).max(365).optional(),
})

/**
 * GET /api/api-keys - List all API keys for current user
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view API keys')
    }

    const { data: keys, error } = await (supabase as any)
      .from('api_keys')
      .select('id, name, key_prefix, is_active, last_used_at, expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: keys || [] })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/api-keys - Create new API key
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to create API keys')
    }

    const body = await request.json()
    const validated = CreateApiKeySchema.parse(body)

    // Generate new API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)
    const keyPrefix = apiKey.substring(0, 12) // rn_xxxxxxxxx

    // Calculate expiration
    let expiresAt: string | null = null
    if (validated.expiresInDays) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + validated.expiresInDays)
      expiresAt = expDate.toISOString()
    }

    // Save to database
    const { data: savedKey, error } = await (supabase as any)
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: validated.name,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('id, name, key_prefix, is_active, expires_at, created_at')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        ...savedKey,
        api_key: apiKey, // Return full key ONLY on creation
      },
      message: 'API key created successfully. Save it now - you won\'t be able to see it again!',
    }, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}
