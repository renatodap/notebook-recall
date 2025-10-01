'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { validateEmail, validatePassword } from './utils'

export interface AuthResult {
  success: boolean
  error?: string
}

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
      }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.errors[0],
      }
    }

    const supabase = await createServerActionClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
      }
    }

    if (!password) {
      return {
        success: false,
        error: 'Password is required',
      }
    }

    const supabase = await createServerActionClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = await createServerActionClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
  }
  redirect('/login')
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const supabase = await createServerActionClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

/**
 * Get the current user
 */
export async function getUser() {
  try {
    const supabase = await createServerActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}
