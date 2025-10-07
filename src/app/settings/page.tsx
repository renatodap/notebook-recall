'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import MobileNav from '@/components/MobileNav'

type DigestPeriod = 'day' | 'week' | 'month'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [digestPeriod, setDigestPeriod] = useState<DigestPeriod>('week')
  const [message, setMessage] = useState('')
  const [captureEmail, setCaptureEmail] = useState<string | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExpiresInDays, setNewKeyExpiresInDays] = useState<number | undefined>(undefined)
  const [creatingKey, setCreatingKey] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)

  const handleGenerateDigest = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: digestPeriod })
      })

      if (!response.ok) {
        throw new Error('Failed to generate digest')
      }

      const data = await response.json()
      setMessage(`✓ Digest generated successfully! ${data.sourceCount} sources summarized.`)
    } catch (error: unknown) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGetCaptureEmail = async () => {
    setLoadingEmail(true)

    try {
      const response = await fetch('/api/email-capture')

      if (!response.ok) {
        throw new Error('Failed to get capture email')
      }

      const data = await response.json()
      setCaptureEmail(data.capture_email)
    } catch (error: unknown) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setLoadingEmail(false)
    }
  }

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const response = await fetch('/api/api-keys')
      if (!response.ok) {
        throw new Error('Failed to load API keys')
      }
      const data = await response.json()
      setApiKeys(data.data || [])
    } catch (error: unknown) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setMessage('Please enter a name for the API key')
      return
    }

    setCreatingKey(true)
    setMessage('')

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          expiresInDays: newKeyExpiresInDays,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create API key')
      }

      const data = await response.json()
      setNewlyCreatedKey(data.data.api_key)
      setMessage(data.message)
      setNewKeyName('')
      setNewKeyExpiresInDays(undefined)
      await loadApiKeys()
    } catch (error: unknown) {
      setMessage(`Error: ${(error as Error).message}`)
    } finally {
      setCreatingKey(false)
    }
  }

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      setMessage('✓ API key deleted successfully')
      await loadApiKeys()
    } catch (error: unknown) {
      setMessage(`Error: ${(error as Error).message}`)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
              ← Dashboard
            </Link>
          </div>
          <p className="text-gray-600">Manage your Recall Notebook preferences and features</p>
        </div>

        {/* Email Capture Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Email Capture</h2>
          <p className="text-gray-600 mb-4">
            Forward emails to your unique capture address to automatically save them to your notebook.
          </p>

          {!captureEmail ? (
            <Button
              onClick={handleGetCaptureEmail}
              loading={loadingEmail}
              aria-label={loadingEmail ? 'Retrieving capture email' : 'Get my capture email address'}
            >
              Get My Capture Email
            </Button>
          ) : (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm font-medium text-indigo-900 mb-2">Your Capture Email:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-indigo-300 text-indigo-700 font-mono text-sm">
                  {captureEmail}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(captureEmail)
                    setMessage('✓ Email copied to clipboard!')
                  }}
                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-indigo-700 mt-2">
                💡 Forward any email to this address to save it to your notebook
              </p>
            </div>
          )}
        </div>

        {/* API Keys Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔑 API Keys</h2>
          <p className="text-gray-600 mb-4">
            Create API keys to integrate Recall Notebook with external applications and services.
          </p>

          {/* Create New Key Button */}
          {!showNewKeyDialog && !newlyCreatedKey && (
            <Button
              onClick={() => setShowNewKeyDialog(true)}
              aria-label="Create new API key"
            >
              + Create New API Key
            </Button>
          )}

          {/* New Key Creation Dialog */}
          {showNewKeyDialog && !newlyCreatedKey && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-3">Create New API Key</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name *
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Persimmon Labs Integration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires In (days, optional)
                  </label>
                  <input
                    type="number"
                    value={newKeyExpiresInDays || ''}
                    onChange={(e) => setNewKeyExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Leave empty for no expiration"
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateApiKey}
                    loading={creatingKey}
                    aria-label={creatingKey ? 'Creating API key' : 'Create API key'}
                  >
                    Create Key
                  </Button>
                  <button
                    onClick={() => {
                      setShowNewKeyDialog(false)
                      setNewKeyName('')
                      setNewKeyExpiresInDays(undefined)
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Newly Created Key Display */}
          {newlyCreatedKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-900 mb-2">✓ API Key Created!</h3>
              <p className="text-sm text-green-800 mb-3">
                <strong>Important:</strong> Copy this key now. You won&apos;t be able to see it again!
              </p>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-green-300 text-green-700 font-mono text-sm break-all">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newlyCreatedKey)
                    setMessage('✓ API key copied to clipboard!')
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="text-sm text-green-700 hover:underline"
              >
                I&apos;ve saved my key, dismiss this
              </button>
            </div>
          )}

          {/* Existing Keys List */}
          {loadingKeys ? (
            <div className="text-center py-4 text-gray-600">Loading API keys...</div>
          ) : apiKeys.length > 0 ? (
            <div className="mt-4 space-y-3">
              <h3 className="font-medium text-gray-900">Your API Keys</h3>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{key.name}</h4>
                        {!key.is_active && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-mono">
                        {key.key_prefix}...
                      </p>
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <div>Created: {formatDate(key.created_at)}</div>
                        <div>Last used: {formatDate(key.last_used_at)}</div>
                        {key.expires_at && (
                          <div>
                            Expires: {formatDate(key.expires_at)}
                            {new Date(key.expires_at) < new Date() && (
                              <span className="text-red-600 ml-1">(Expired)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="px-3 py-1.5 text-red-600 border border-red-300 rounded hover:bg-red-50 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showNewKeyDialog && !newlyCreatedKey ? (
            <div className="mt-4 text-center py-4 text-gray-500 text-sm">
              No API keys yet. Create one to get started!
            </div>
          ) : null}

          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">What are API keys used for?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Integrate with external applications (e.g., Persimmon Labs)</li>
              <li>Automate data fetching and analysis</li>
              <li>Build custom tools that use your knowledge base</li>
              <li>Securely access your collections programmatically</li>
            </ul>
          </div>
        </div>

        {/* Digest Generation Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Weekly Digest</h2>
          <p className="text-gray-600 mb-4">
            Generate an AI-powered summary of your captured content for a specific time period.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="period"
                    value="day"
                    checked={digestPeriod === 'day'}
                    onChange={(e) => setDigestPeriod(e.target.value as DigestPeriod)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Today</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="period"
                    value="week"
                    checked={digestPeriod === 'week'}
                    onChange={(e) => setDigestPeriod(e.target.value as DigestPeriod)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">This Week</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="period"
                    value="month"
                    checked={digestPeriod === 'month'}
                    onChange={(e) => setDigestPeriod(e.target.value as DigestPeriod)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">This Month</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleGenerateDigest}
              loading={loading}
              aria-label={loading ? 'Generating digest' : 'Generate digest for selected period'}
            >
              Generate Digest
            </Button>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.startsWith('✓')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">What&apos;s in a digest?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Summary of all sources captured in the period</li>
                <li>Top 3-5 key insights and themes</li>
                <li>Important action items to review</li>
                <li>Emerging patterns and connections</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-sm border border-purple-200 p-6">
          <h2 className="text-xl font-semibold text-purple-900 mb-4">🚀 Coming Soon</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-lg">🎤</span>
              <div>
                <strong>Voice Notes:</strong> Record audio notes with automatic transcription
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🔔</span>
              <div>
                <strong>Scheduled Digests:</strong> Automatic weekly/monthly email summaries
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🔄</span>
              <div>
                <strong>Auto-sync:</strong> Automatic content capture from connected services
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
