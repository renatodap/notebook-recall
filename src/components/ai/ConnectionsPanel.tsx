'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import Link from 'next/link'
import type { SourceConnection } from '@/types'

interface ConnectionsPanelProps {
  sourceId: string
}

interface ConnectionWithTarget extends SourceConnection {
  target: {
    id: string
    title: string
    content_type: string
    created_at: string
  }
}

export default function ConnectionsPanel({ sourceId }: ConnectionsPanelProps) {
  const [connections, setConnections] = useState<ConnectionWithTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [discovering, setDiscovering] = useState(false)

  useEffect(() => {
    fetchConnections()
  }, [sourceId])

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/connections/source/${sourceId}`)
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDiscoverConnections = async () => {
    setDiscovering(true)
    try {
      const response = await fetch('/api/connections/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          limit: 10,
          connection_types: ['similar'],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.discovered_new > 0) {
          alert(`Discovered ${data.discovered_new} new connection(s)!`)
          fetchConnections()
        } else {
          alert('No new connections found.')
        }
      }
    } catch (error) {
      console.error('Discovery error:', error)
      alert('Failed to discover connections')
    } finally {
      setDiscovering(false)
    }
  }

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'similar':
        return '🔗'
      case 'contradicts':
        return '⚔️'
      case 'cites':
        return '📚'
      case 'extends':
        return '➕'
      case 'refutes':
        return '❌'
      default:
        return '•'
    }
  }

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'similar':
        return 'bg-blue-100 text-blue-800'
      case 'contradicts':
        return 'bg-red-100 text-red-800'
      case 'cites':
        return 'bg-purple-100 text-purple-800'
      case 'extends':
        return 'bg-green-100 text-green-800'
      case 'refutes':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Related Sources</h2>
        </CardHeader>
        <CardBody>
          <div className="text-center text-gray-500 py-4">Loading connections...</div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Related Sources</h2>
          <Button
            onClick={handleDiscoverConnections}
            loading={discovering}
            size="sm"
            variant="secondary"
          >
            🔍 Discover Connections
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {connections.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🔗</div>
            <p className="text-gray-600 mb-4">
              No connections yet. Click &quot;Discover Connections&quot; to find related sources.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <Link
                key={connection.id}
                href={`/source/${connection.target.id}`}
                className="block"
              >
                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getConnectionIcon(connection.connection_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getConnectionColor(
                            connection.connection_type
                          )}`}
                        >
                          {connection.connection_type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(connection.strength * 100)}% match
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                        {connection.target.title}
                      </h3>
                      {connection.evidence && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {connection.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
