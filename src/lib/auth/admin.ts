/**
 * Admin Authentication Utilities
 *
 * Functions for checking admin status and permissions
 */

import { createRouteHandlerClient } from '@/lib/supabase/server';

// List of admin email addresses (in production, store this in database)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];

// Alternative: Check for admin role in database
interface UserRole {
  role: 'admin' | 'user';
}

/**
 * Check if a user is an admin based on email
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if current user is admin (email-based)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return false;
    }

    return isAdminEmail(user.email);
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}

/**
 * Check if user has admin role in database
 * (Alternative approach using database roles)
 */
export async function hasAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = await createRouteHandlerClient();

    // Check user_roles table for admin role
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === 'admin';
  } catch (error) {
    console.error('Role check failed:', error);
    return false;
  }
}

/**
 * Verify CRON secret for scheduled jobs
 */
export function verifyCronSecret(secret: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  return secret === cronSecret;
}

/**
 * Verify webhook secret for external integrations
 */
export function verifyWebhookSecret(secret: string | null): boolean {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('WEBHOOK_SECRET not configured');
    return false;
  }

  return secret === webhookSecret;
}

/**
 * Middleware helper for admin-only routes
 * Returns 403 if user is not admin
 */
export async function requireAdmin(): Promise<{ authorized: true } | { authorized: false; response: Response }> {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!user.email || !isAdminEmail(user.email)) {
    return {
      authorized: false,
      response: Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
    };
  }

  return { authorized: true };
}
