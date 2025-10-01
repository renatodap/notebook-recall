'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30days')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/dashboard?period=${period}`)
      const data = await res.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-4 items-center">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Total Sources</h3>
          <p className="text-3xl font-bold">{analytics.overview.totalSources}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Collections</h3>
          <p className="text-3xl font-bold">{analytics.overview.totalCollections}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Synthesis Reports</h3>
          <p className="text-3xl font-bold">{analytics.overview.totalSynthesisReports}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Published Outputs</h3>
          <p className="text-3xl font-bold">{analytics.overview.totalPublishedOutputs}</p>
        </div>
      </div>

      {/* Productivity Score */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-2">Productivity Score</h2>
        <div className="flex items-end gap-4">
          <div className="text-6xl font-bold">{analytics.overview.productivityScore}</div>
          <div className="text-xl mb-2">/100</div>
        </div>
        <p className="mt-2 text-blue-100">
          Based on sources, synthesis, publications, and AI feature usage
        </p>
      </div>

      {/* Insights */}
      {analytics.insights && analytics.insights.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3">💡 Insights & Recommendations</h2>
          <ul className="space-y-2">
            {analytics.insights.map((insight: string, idx: number) => (
              <li key={idx} className="text-sm">• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source Type Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sources by Type</h2>
          {Object.entries(analytics.breakdown.bySourceType || {}).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(analytics.breakdown.bySourceType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="capitalize">{type}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>

        {/* AI Feature Usage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">AI Features Used</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Connections Discovered</span>
              <span className="font-semibold">{analytics.breakdown.aiFeatureUsage.connectionsDiscovered}</span>
            </div>
            <div className="flex justify-between">
              <span>Concepts Extracted</span>
              <span className="font-semibold">{analytics.breakdown.aiFeatureUsage.conceptsExtracted}</span>
            </div>
            <div className="flex justify-between">
              <span>Contradictions Found</span>
              <span className="font-semibold">{analytics.breakdown.aiFeatureUsage.contradictionsFound}</span>
            </div>
          </div>
        </div>

        {/* Top Tags */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Tags</h2>
          {analytics.topItems?.tags && analytics.topItems.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analytics.topItems.tags.map((item: any) => (
                <span key={item.tag} className="bg-blue-100 px-3 py-1 rounded-full text-sm">
                  {item.tag} ({item.count})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tags yet</p>
          )}
        </div>

        {/* Publishing Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Publishing Activity</h2>
          {analytics.breakdown.publishing && (
            <>
              <div className="mb-3">
                <h3 className="text-sm font-semibold mb-2">By Type</h3>
                {Object.entries(analytics.breakdown.publishing.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span>{count as number}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">By Status</h3>
                {Object.entries(analytics.breakdown.publishing.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="capitalize">{status}</span>
                    <span>{count as number}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Collaboration Stats */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Collaboration & Social</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Shares Created</p>
              <p className="text-2xl font-bold">{analytics.breakdown.collaboration.sharesCreated}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Following</p>
              <p className="text-2xl font-bold">{analytics.breakdown.collaboration.following}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Followers</p>
              <p className="text-2xl font-bold">{analytics.breakdown.collaboration.followers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Trend */}
      {analytics.trends?.sourcesOverTime && analytics.trends.sourcesOverTime.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-4">Activity Over Time</h2>
          <div className="space-y-1">
            {analytics.trends.sourcesOverTime.slice(-14).map((day: any) => (
              <div key={day.date} className="flex items-center gap-2 text-sm">
                <span className="w-24 text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                <div className="flex-1 bg-gray-200 rounded h-6" style={{ width: '100%' }}>
                  <div
                    className="bg-blue-500 h-full rounded"
                    style={{ width: `${Math.min(100, (day.count / Math.max(...analytics.trends.sourcesOverTime.map((d: any) => d.count))) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right">{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
