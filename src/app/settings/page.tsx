'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import MobileNav from '@/components/MobileNav'

type DigestPeriod = 'day' | 'week' | 'month'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [digestPeriod, setDigestPeriod] = useState<DigestPeriod>('week')
  const [message, setMessage] = useState('')
  const [captureEmail, setCaptureEmail] = useState<string | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)

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
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
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
      setCaptureEmail(data.email)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoadingEmail(false)
    }
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
