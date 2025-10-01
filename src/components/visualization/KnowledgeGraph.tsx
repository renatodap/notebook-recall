'use client'

import { useEffect, useRef, useState } from 'react'

interface GraphNode {
  id: string
  title: string
  type: 'source' | 'concept' | 'collection'
  size?: number
}

interface GraphLink {
  source: string
  target: string
  type: 'connection' | 'concept' | 'collection'
  strength?: number
}

interface KnowledgeGraphProps {
  sources: GraphNode[]
  connections: GraphLink[]
  onNodeClick?: (nodeId: string) => void
}

export default function KnowledgeGraph({ sources, connections, onNodeClick }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Physics simulation state
  const nodesState = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Initialize node positions if not already set
    sources.forEach(source => {
      if (!nodesState.current.has(source.id)) {
        nodesState.current.set(source.id, {
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: 0,
          vy: 0,
        })
      }
    })

    // Force-directed layout simulation
    let animationFrame: number

    const simulate = () => {
      const nodes = nodesState.current

      // Apply forces
      nodes.forEach((node, id) => {
        // Repulsion between all nodes
        nodes.forEach((otherNode, otherId) => {
          if (id === otherId) return
          const dx = otherNode.x - node.x
          const dy = otherNode.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 1000 / (distance * distance)
          node.vx -= (dx / distance) * force
          node.vy -= (dy / distance) * force
        })

        // Attraction along connections
        connections.forEach(conn => {
          if (conn.source === id) {
            const targetNode = nodes.get(conn.target)
            if (targetNode) {
              const dx = targetNode.x - node.x
              const dy = targetNode.y - node.y
              const distance = Math.sqrt(dx * dx + dy * dy) || 1
              const force = distance * 0.01 * (conn.strength || 0.5)
              node.vx += (dx / distance) * force
              node.vy += (dy / distance) * force
            }
          }
        })

        // Center gravity
        const centerX = canvas.offsetWidth / 2
        const centerY = canvas.offsetHeight / 2
        node.vx += (centerX - node.x) * 0.001
        node.vy += (centerY - node.y) * 0.001

        // Damping
        node.vx *= 0.8
        node.vy *= 0.8

        // Update position
        if (!draggingNode || draggingNode !== id) {
          node.x += node.vx
          node.y += node.vy
        }

        // Keep in bounds
        node.x = Math.max(20, Math.min(canvas.offsetWidth - 20, node.x))
        node.y = Math.max(20, Math.min(canvas.offsetHeight - 20, node.y))
      })

      // Render
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      // Draw connections
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1
      connections.forEach(conn => {
        const sourceNode = nodes.get(conn.source)
        const targetNode = nodes.get(conn.target)
        if (sourceNode && targetNode) {
          ctx.beginPath()
          ctx.moveTo(sourceNode.x, sourceNode.y)
          ctx.lineTo(targetNode.x, targetNode.y)
          ctx.stroke()
        }
      })

      // Draw nodes
      sources.forEach(source => {
        const node = nodes.get(source.id)
        if (!node) return

        const isHovered = hoveredNode === source.id
        const radius = (source.size || 10) * (isHovered ? 1.5 : 1)

        // Node color by type
        let color = '#3b82f6'
        if (source.type === 'concept') color = '#8b5cf6'
        if (source.type === 'collection') color = '#10b981'

        // Draw node
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = isHovered ? '#1e40af' : '#fff'
        ctx.lineWidth = isHovered ? 3 : 2
        ctx.stroke()

        // Draw label
        if (isHovered) {
          ctx.fillStyle = '#000'
          ctx.font = '12px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(source.title.substring(0, 30), node.x, node.y - radius - 5)
        }
      })

      animationFrame = requestAnimationFrame(simulate)
    }

    simulate()

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [sources, connections, hoveredNode, draggingNode])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (draggingNode) {
      const node = nodesState.current.get(draggingNode)
      if (node) {
        node.x = x
        node.y = y
        node.vx = 0
        node.vy = 0
      }
      return
    }

    // Check for hover
    let hovered: string | null = null
    sources.forEach(source => {
      const node = nodesState.current.get(source.id)
      if (!node) return

      const dx = node.x - x
      const dy = node.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const radius = source.size || 10

      if (distance < radius) {
        hovered = source.id
      }
    })

    setHoveredNode(hovered)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      setDraggingNode(hoveredNode)
    }
  }

  const handleMouseUp = () => {
    if (draggingNode && onNodeClick) {
      onNodeClick(draggingNode)
    }
    setDraggingNode(null)
  }

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredNode(null)
          setDraggingNode(null)
        }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Sources</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span>Concepts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Collections</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 text-sm">
        <div className="space-y-1">
          <div><strong>{sources.length}</strong> nodes</div>
          <div><strong>{connections.length}</strong> connections</div>
        </div>
      </div>
    </div>
  )
}
