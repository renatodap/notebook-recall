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

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // Browser cookie access
        if (typeof document === 'undefined') return undefined
        const cookies = document.cookie.split('; ')
        const cookie = cookies.find(c => c.startsWith(`${name}=`))
        return cookie?.split('=')[1]
      },
      set(name: string, value: string, options: any) {
        // Browser cookie setting
        if (typeof document === 'undefined') return
        let cookieString = `${name}=${value}`
        if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
        if (options?.path) cookieString += `; path=${options.path}`
        if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
        if (options?.secure) cookieString += '; secure'
        document.cookie = cookieString
      },
      remove(name: string, options: any) {
        // Browser cookie removal
        if (typeof document === 'undefined') return
        let cookieString = `${name}=; max-age=0`
        if (options?.path) cookieString += `; path=${options.path}`
        document.cookie = cookieString
      },
    },
  })
}
