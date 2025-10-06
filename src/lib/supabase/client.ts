'use client'

import { createBrowserClient as createClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Creates a Supabase client for use in Client Components
 * Handles cookie-based session management automatically
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}
