'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  const navItems = [
    {
      name: 'PARA',
      path: '/para',
      icon: '📁',
      activeIcon: '📁'
    },
    {
      name: 'Sources',
      path: '/dashboard',
      icon: '📄',
      activeIcon: '📄'
    },
    {
      name: 'Add',
      path: '/add',
      icon: '➕',
      activeIcon: '➕',
      highlight: true
    },
    {
      name: 'Tools',
      path: '/tools',
      icon: '🛠️',
      activeIcon: '🛠️'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: '⚙️',
      activeIcon: '⚙️'
    },
  ]

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  item.highlight
                    ? active
                      ? 'text-indigo-700'
                      : 'text-indigo-600'
                    : active
                    ? 'text-indigo-600'
                    : 'text-gray-600'
                }`}
              >
                <div className={`text-2xl mb-0.5 ${item.highlight && !active ? 'scale-110' : ''}`}>
                  {active ? item.activeIcon : item.icon}
                </div>
                <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:bg-white md:border-r md:border-gray-200 md:z-40">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Recall Notebook</h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-6 py-3 transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl mr-3">{active ? item.activeIcon : item.icon}</span>
                <span className={`font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="p-6 border-t border-gray-200">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}
