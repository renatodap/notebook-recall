import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import MobileNav from '@/components/MobileNav'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user stats
  const { data: sources } = await supabase
    .from('sources')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: collections } = await (supabase as any)
    .from('collections')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Settings</h1>
          <p className="text-gray-600">
            Manage your account and preferences
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.email}</h2>
              <p className="text-sm text-gray-600">Member since {new Date(user.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{sources?.length || 0}</div>
              <div className="text-sm text-gray-600">Sources</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{collections?.length || 0}</div>
              <div className="text-sm text-gray-600">Collections</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Links</h3>

          <Link
            href="/discover"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌐</span>
              <span className="font-medium text-gray-900">Discover</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/workspaces"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <span className="font-medium text-gray-900">Workspaces</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/import"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📥</span>
              <span className="font-medium text-gray-900">Import References</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/analytics"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <span className="font-medium text-gray-900">Analytics</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Account</h3>

          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all font-medium"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚪</span>
                <span>Sign Out</span>
              </div>
              <span>→</span>
            </button>
          </form>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Recall Notebook v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Powered by Claude AI
          </p>
        </div>
      </div>
    </div>
  )
}
