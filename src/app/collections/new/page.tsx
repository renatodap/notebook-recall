'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatSidebar from '@/components/ChatSidebar'
import Button from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCollectionPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!name.trim()) {
        setError('Collection name is required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          collection_type: 'reading_list',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create collection')
      }

      // Success! Redirect to collections page
      router.push('/collections')
    } catch (err: unknown) {
      console.error('Create collection error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <main className="max-w-2xl mx-auto px-6 py-8 w-full">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 transition-colors mb-4"
              style={{ color: 'var(--chat-text-secondary)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Collections
            </Link>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--chat-text-primary)' }}>
              Create New Collection
            </h1>
            <p className="mt-2" style={{ color: 'var(--chat-text-secondary)' }}>
              Organize related sources into a collection
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border p-6 space-y-6"
                 style={{
                   backgroundColor: 'var(--chat-bg-message-ai)',
                   borderColor: 'var(--chat-border)'
                 }}>
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--chat-text-primary)' }}
                >
                  Collection Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Machine Learning Research, Book Notes, Work Projects"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{
                    backgroundColor: 'var(--chat-bg-input)',
                    borderColor: 'var(--chat-border)',
                    color: 'var(--chat-text-primary)'
                  }}
                  disabled={loading}
                  maxLength={100}
                  required
                />
                <p className="text-xs mt-1" style={{ color: 'var(--chat-text-secondary)' }}>
                  {name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--chat-text-primary)' }}
                >
                  Description <span style={{ color: 'var(--chat-text-secondary)' }}>(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this collection about?"
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  style={{
                    backgroundColor: 'var(--chat-bg-input)',
                    borderColor: 'var(--chat-border)',
                    color: 'var(--chat-text-primary)'
                  }}
                  disabled={loading}
                  maxLength={500}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--chat-text-secondary)' }}>
                  {description.length}/500 characters
                </p>
              </div>

              {/* Public/Private Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                      disabled={loading}
                    />
                    <div className="w-11 h-6 rounded-full peer transition-colors"
                         style={{
                           backgroundColor: isPublic ? 'var(--chat-accent)' : 'var(--chat-border)'
                         }}></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--chat-text-primary)' }}>
                      Make this collection public
                    </span>
                    <p className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>
                      {isPublic
                        ? 'Anyone can view this collection'
                        : 'Only you can see this collection'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 border rounded-lg"
                   style={{
                     backgroundColor: 'rgba(239, 68, 68, 0.1)',
                     borderColor: 'rgba(239, 68, 68, 0.3)'
                   }}>
                <p className="text-sm font-medium" style={{ color: '#FCA5A5' }}>{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/collections')}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={!name.trim() || loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Collection'}
              </Button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 border rounded-lg"
               style={{
                 backgroundColor: 'var(--chat-bg-message-ai)',
                 borderColor: 'var(--chat-border)'
               }}>
            <p className="text-sm" style={{ color: 'var(--chat-text-secondary)' }}>
              <strong style={{ color: 'var(--chat-text-primary)' }}>💡 Tip:</strong> After creating a collection, you can add sources to it from the
              source detail page or by using bulk actions on the dashboard.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
