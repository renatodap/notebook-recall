/**
 * Helper types for Supabase client usage
 * These types help avoid 'any' when working with Supabase clients
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database'

/**
 * Typed Supabase client
 */
export type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Generic database row type
 */
export type DatabaseRow = Record<string, unknown>

/**
 * Generic database response type
 */
export interface DatabaseResponse<T = DatabaseRow> {
  data: T | null
  error: Error | null
}

/**
 * Generic database array response type
 */
export interface DatabaseArrayResponse<T = DatabaseRow> {
  data: T[] | null
  error: Error | null
  count?: number | null
}

/**
 * RPC function parameters type helper
 */
export type RPCParams = Record<string, unknown>

/**
 * Cookie options type for Supabase SSR
 */
export interface CookieOptions {
  name: string
  value: string
  maxAge?: number
  path?: string
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
}

/**
 * Supabase error type
 */
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}
