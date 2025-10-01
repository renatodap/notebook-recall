'use client'

import { useState, useEffect } from 'react'
import Button from './ui/Button'
import { Card, CardBody } from './ui/Card'

interface ShareButtonProps {
  sourceId: string
}

export default function ShareButton({ sourceId }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [loading, setLoading] = useState(false)
  const [publicUrl, setPublicUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchShareStatus()
  }, [sourceId])

  const fetchShareStatus = async () => {
    try {
      const res = await fetch(`/api/sharing?type=owned`)
      if (res.ok) {
        const data = await res.json()
        const share = data.shares?.find((s: any) => s.source_id === sourceId)
        if (share) {
          setVisibility(share.visibility)
          if (share.visibility === 'public') {
            setPublicUrl(`${window.location.origin}/public/source/${sourceId}`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch share status:', error)
    }
  }

  const toggleVisibility = async (newVisibility: 'private' | 'public') => {
    setLoading(true)
    try {
      const res = await fetch('/api/sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          visibility: newVisibility
        })
      })

      if (res.ok) {
        setVisibility(newVisibility)
        if (newVisibility === 'public') {
          const url = `${window.location.origin}/public/source/${sourceId}`
          setPublicUrl(url)
        } else {
          setPublicUrl('')
        }
      } else {
        alert('Failed to update sharing settings')
      }
    } catch (error) {
      console.error('Failed to update sharing:', error)
      alert('Failed to update sharing settings')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={visibility === 'public' ? 'primary' : 'secondary'}
        size="sm"
        className={visibility === 'public' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        {visibility === 'public' ? '🌐 Public' : '🔒 Private'}
      </Button>

      {/* Share Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
              <CardBody className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl">🔗</span>
                      <span className="hidden xs:inline">Share This Source</span><span className="xs:hidden">Share</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Control who can view this research
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl leading-none ml-2"
                  >
                    ×
                  </button>
                </div>

                {/* Visibility Options */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => toggleVisibility('private')}
                    disabled={loading}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      visibility === 'private'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        visibility === 'private' ? 'border-indigo-600' : 'border-gray-300'
                      }`}>
                        {visibility === 'private' && (
                          <div className="w-3 h-3 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🔒</span>
                          <span className="font-semibold text-gray-900">Private</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Only you can view this source
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => toggleVisibility('public')}
                    disabled={loading}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      visibility === 'public'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        visibility === 'public' ? 'border-green-600' : 'border-gray-300'
                      }`}>
                        {visibility === 'public' && (
                          <div className="w-3 h-3 rounded-full bg-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🌐</span>
                          <span className="font-semibold text-gray-900">Public</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            SHAREABLE
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Anyone with the link can view this source
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Public Link Section */}
                {visibility === 'public' && publicUrl && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                      🎉 Public Link - Share anywhere!
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={publicUrl}
                        readOnly
                        className="flex-1 px-2 sm:px-3 py-2 bg-white border border-green-300 rounded-lg text-xs sm:text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <Button
                        onClick={copyToClipboard}
                        size="sm"
                        className={`whitespace-nowrap ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Tip: Share this link on social media, email, or embed it in your blog
                    </p>
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Public sharing builds your reputation
                      </p>
                      <p className="text-xs text-blue-700">
                        Other researchers can discover your work, cite your findings, and follow your research journey.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                  >
                    Close
                  </Button>
                  {visibility === 'public' && publicUrl && (
                    <Button
                      onClick={() => window.open(publicUrl, '_blank')}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      🔗 View Public Page
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
