'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileNav from '@/components/MobileNav'
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
          collection_type: 'general',
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
    <>
      <MobileNav />
      <div className="min-h-screen bg-neutral-50 md:ml-64">
        <main className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Collections
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
              Create New Collection
            </h1>
            <p className="text-neutral-600 mt-2">
              Organize related sources into a collection
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Collection Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Machine Learning Research, Book Notes, Work Projects"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                  disabled={loading}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Description <span className="text-neutral-400">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this collection about?"
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 resize-none"
                  disabled={loading}
                  maxLength={500}
                />
                <p className="text-xs text-neutral-500 mt-1">
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
                    <div className="w-11 h-6 bg-neutral-300 rounded-full peer peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 transition-colors"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-700">
                      Make this collection public
                    </span>
                    <p className="text-xs text-neutral-500">
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">{error}</p>
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
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> After creating a collection, you can add sources to it from the
              source detail page or by using bulk actions on the dashboard.
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
