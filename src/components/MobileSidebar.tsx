'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Folder, MessageSquare, Plus, Home, FileText, Settings, User, LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth/actions'

interface Collection {
  id: string
  name: string
  source_count: number
  created_at: string
}

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchCollections()
    }
  }, [isOpen])

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections')
      const data = await res.json()
      setCollections(data.data || [])
    } catch (error) {
      console.error('Failed to fetch collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const closeDrawer = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--chat-bg-sidebar)',
          color: 'var(--chat-text-primary)'
        }}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--chat-bg-sidebar)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--chat-border)' }}>
          <h1 className="text-lg font-bold" style={{ color: 'var(--chat-text-primary)' }}>
            Recall Notebook
          </h1>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--chat-text-primary)' }}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Main Links */}
          <div className="px-3 mb-4 space-y-1">
            <Link
              href="/dashboard"
              onClick={closeDrawer}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
              style={{ color: 'var(--chat-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>

            <Link
              href="/add"
              onClick={closeDrawer}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
              style={{ color: 'var(--chat-text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Add Content</span>
            </Link>
          </div>

          {/* Collections Section */}
          <div className="px-3 mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider px-2"
                style={{ color: 'var(--chat-text-secondary)' }}>
              Collections
            </h2>
          </div>

          {/* All Sources Link */}
          <Link
            href="/search"
            onClick={closeDrawer}
            className="flex items-center gap-3 px-4 py-3 mx-3 rounded-lg mb-1 transition-colors"
            style={{ color: 'var(--chat-text-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">All Sources</span>
          </Link>

          {/* Collections List */}
          {loading ? (
            <div className="px-4 py-2">
              <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--chat-border)' }} />
            </div>
          ) : (
            <div className="space-y-1 px-3">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/search?collection=${collection.id}`}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  style={{ color: 'var(--chat-text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Folder className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{collection.name}</div>
                    <div className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>
                      {collection.source_count || 0} sources
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* New Collection Button */}
          <Link
            href="/collections/new"
            onClick={closeDrawer}
            className="flex items-center gap-3 px-4 py-3 mx-3 mt-2 transition-colors"
            style={{ color: 'var(--chat-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">New Collection</span>
          </Link>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t p-3 space-y-1" style={{ borderColor: 'var(--chat-border)' }}>
          <Link
            href="/settings"
            onClick={closeDrawer}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--chat-text-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </Link>
          <Link
            href="/profile"
            onClick={closeDrawer}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--chat-text-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--chat-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <User className="h-5 w-5" />
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
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
