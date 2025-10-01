'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KnowledgeGraph from './KnowledgeGraph'

export default function KnowledgeGraphClient() {
  const router = useRouter()
  const [nodes, setNodes] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchGraphData()
  }, [])

  const fetchGraphData = async () => {
    try {
      const response = await fetch('/api/graph/data?limit=100')
      const data = await response.json()

      setNodes(data.nodes || [])
      setLinks(data.links || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching graph data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNodeClick = (nodeId: string) => {
    // Determine node type and navigate
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    if (node.type === 'source') {
      router.push(`/source/${nodeId}`)
    } else if (node.type === 'collection') {
      router.push(`/collections/${nodeId}`)
    }
    // Concepts don't have dedicated pages yet
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🕸️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No graph data yet
          </h3>
          <p className="text-gray-600">
            Add sources and generate connections to see your knowledge graph
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <KnowledgeGraph
        sources={nodes}
        connections={links}
        onNodeClick={handleNodeClick}
      />

      {/* Info Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-gray-900 mb-2">Your Knowledge Graph</h3>
        <p className="text-sm text-gray-600 mb-3">
          Click and drag nodes to explore. Click a node to navigate.
        </p>
        {stats && (
          <div className="text-sm space-y-1 border-t pt-2">
            <div><strong>{stats.sources}</strong> sources</div>
            <div><strong>{stats.concepts}</strong> concepts</div>
            <div><strong>{stats.collections}</strong> collections</div>
            <div><strong>{stats.connections}</strong> connections</div>
          </div>
        )}
      </div>
    </div>
  )
}
