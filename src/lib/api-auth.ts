/**
 * API Authentication Middleware
 * Supports both session auth and API key auth
 */

import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationError } from '@/lib/errors/custom-errors'
import crypto from 'crypto'

export interface AuthContext {
  userId: string
  authType: 'session' | 'api_key'
  apiKeyId?: string
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  // Format: rn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 chars after prefix)
  const randomBytes = crypto.randomBytes(24) // 48 hex chars
  return `rn_${randomBytes.toString('hex')}`
}

/**
 * Authenticate request via API key or session
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthContext> {
  // Check for API key in Authorization header
  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7)
    return await authenticateWithApiKey(apiKey)
  }

  // Fallback to session auth
  return await authenticateWithSession()
}

/**
 * Authenticate with API key
 */
async function authenticateWithApiKey(apiKey: string): Promise<AuthContext> {
  if (!apiKey || !apiKey.startsWith('rn_')) {
    throw new AuthenticationError('Invalid API key format')
  }

  const keyHash = hashApiKey(apiKey)

  // Use service role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: apiKeyRecord, error } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, expires_at, last_used_at')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (error || !apiKeyRecord) {
    throw new AuthenticationError('Invalid or expired API key')
  }

  // Check expiration
  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    throw new AuthenticationError('API key has expired')
  }

  // Update last_used_at asynchronously (fire and forget)
  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id)
    .then(({ error }) => {
      if (error) {
        console.error('Failed to update API key last_used_at:', error)
      }
    })

  return {
    userId: apiKeyRecord.user_id,
    authType: 'api_key',
    apiKeyId: apiKeyRecord.id,
  }
}

/**
 * Authenticate with session
 */
async function authenticateWithSession(): Promise<AuthContext> {
  const supabase = await createRouteHandlerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthenticationError('Please sign in or provide an API key')
  }

  return {
    userId: user.id,
    authType: 'session',
  }
}

/**
 * Get authenticated user ID (simplified version)
 */
export async function getAuthenticatedUserId(request: Request): Promise<string> {
  const context = await authenticateRequest(request)
  return context.userId
}
