'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, Folder, MessageSquare, Settings, User, LogOut, Home, FileText } from 'lucide-react'
import { signOut } from '@/lib/auth/actions'

interface Category {
  id: string
  name: string
  source_count: number
  created_at: string
}

interface ChatSidebarProps {
  selectedCategoryId?: string | null
  onCategorySelect?: (categoryId: string | null) => void
}

export default function ChatSidebar({ selectedCategoryId, onCategorySelect }: ChatSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/collections')
      const data = await res.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleNewChat = () => {
    if (onCategorySelect) {
      onCategorySelect(null)
    }
    router.push('/search')
  }

  return (
    <div className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:z-40"
         style={{ backgroundColor: 'var(--chat-bg-sidebar)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--chat-border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--chat-text-primary)' }}>
          Recall Notebook
        </h1>
        <button
          onClick={handleNewChat}
          className="w-full mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: 'var(--chat-border)',
            color: 'var(--chat-text-primary)'
          }}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Dashboard & Add Links */}
        <div className="px-3 mb-4 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard' ? 'bg-opacity-10' : ''
            }`}
            style={{
              color: 'var(--chat-text-primary)',
              backgroundColor: pathname === '/dashboard' ? 'var(--chat-hover)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (pathname === '/dashboard') return
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              if (pathname === '/dashboard') return
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Home className="h-4 w-4" />
            <span className="text-sm">Dashboard</span>
          </Link>

          <Link
            href="/add"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              pathname === '/add' ? 'bg-opacity-10' : ''
            }`}
            style={{
              color: 'var(--chat-text-primary)',
              backgroundColor: pathname === '/add' ? 'var(--chat-hover)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (pathname === '/add') return
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              if (pathname === '/add') return
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">Add Content</span>
          </Link>
        </div>

        {/* Collections Section */}
        <div className="px-3 mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider px-2"
              style={{ color: 'var(--chat-text-secondary)' }}>
            Collections
          </h2>
        </div>

        {/* All Sources */}
        {onCategorySelect ? (
          <button
            onClick={() => onCategorySelect(null)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
              !selectedCategoryId ? 'bg-opacity-10' : ''
            }`}
            style={{
              color: 'var(--chat-text-primary)',
              backgroundColor: !selectedCategoryId ? 'var(--chat-hover)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!selectedCategoryId) return
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              if (!selectedCategoryId) return
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">All Sources</span>
          </button>
        ) : (
          <Link
            href="/search"
            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
              pathname === '/search' ? 'bg-opacity-10' : ''
            }`}
            style={{
              color: 'var(--chat-text-primary)',
              backgroundColor: pathname === '/search' ? 'var(--chat-hover)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (pathname === '/search') return
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              if (pathname === '/search') return
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">All Sources</span>
          </Link>
        )}

        {/* Category List */}
        {loading ? (
          <div className="px-4 py-2">
            <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--chat-border)' }} />
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map((category) => (
              onCategorySelect ? (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    selectedCategoryId === category.id ? 'bg-opacity-10' : ''
                  }`}
                  style={{
                    color: 'var(--chat-text-primary)',
                    backgroundColor: selectedCategoryId === category.id ? 'var(--chat-hover)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategoryId === category.id) return
                    e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategoryId === category.id) return
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Folder className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{category.name}</div>
                    <div className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>
                      {category.source_count || 0} sources
                    </div>
                  </div>
                </button>
              ) : (
                <Link
                  key={category.id}
                  href={`/search?collection=${category.id}`}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors`}
                  style={{
                    color: 'var(--chat-text-primary)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Folder className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{category.name}</div>
                    <div className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>
                      {category.source_count || 0} sources
                    </div>
                  </div>
                </Link>
              )
            ))}
          </div>
        )}

        {/* New Collection Button */}
        <Link
          href="/collections/new"
          className="flex items-center gap-3 px-4 py-2.5 mt-2 transition-colors"
          style={{ color: 'var(--chat-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">New Collection</span>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t p-3 space-y-1" style={{ borderColor: 'var(--chat-border)' }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: 'var(--chat-text-primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Settings</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: 'var(--chat-text-primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <User className="h-4 w-4" />
          <span className="text-sm">Profile</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          style={{ color: 'var(--chat-text-primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
