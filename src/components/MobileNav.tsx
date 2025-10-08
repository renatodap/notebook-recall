'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

export default function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // Simplified navigation - 4 primary items (2026 UX standards)
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '🏠',
      activeIcon: '🏠'
    },
    {
      name: 'Search',
      path: '/search',
      icon: '🔍',
      activeIcon: '🔍'
    },
    {
      name: 'Add',
      path: '/add',
      icon: '➕',
      activeIcon: '➕',
      highlight: true
    },
    {
      name: 'Collections',
      path: '/collections',
      icon: '📚',
      activeIcon: '📚'
    },
  ]

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 md:hidden z-50 safe-area-bottom shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  item.highlight
                    ? active
                      ? 'text-primary-700'
                      : 'text-primary-600'
                    : active
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                <div className={`text-2xl mb-0.5 transition-transform ${item.highlight && !active ? 'scale-110' : ''} ${active ? 'scale-105' : ''}`}>
                  {active ? item.activeIcon : item.icon}
                </div>
                <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:bg-white md:border-r md:border-neutral-200 md:z-40">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Recall Notebook</h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-6 py-3 transition-all duration-200 ${
                  active
                    ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <span className="text-2xl mr-3">{active ? item.activeIcon : item.icon}</span>
                <span className={`${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="p-6 border-t border-neutral-200">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}
