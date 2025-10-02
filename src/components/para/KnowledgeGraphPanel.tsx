'use client';

import { useEffect, useState, useRef } from 'react';
import { Source, Summary, Tag } from '@/types';

interface KnowledgeGraphPanelProps {
  category: 'projects' | 'areas' | 'resources' | 'archive';
  sources: (Source & { summary: Summary[]; tags: Tag[] })[];
}

interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'tag' | 'category';
  x: number;
  y: number;
  color: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'has_tag' | 'related_to';
}

export default function KnowledgeGraphPanel({
  category,
  sources,
}: KnowledgeGraphPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const getCategoryColor = () => {
    switch (category) {
      case 'projects':
        return '#6366f1'; // indigo
      case 'areas':
        return '#22c55e'; // green
      case 'resources':
        return '#a855f7'; // purple
      case 'archive':
        return '#6b7280'; // gray
      default:
        return '#3b82f6'; // blue
    }
  };

  // Build graph data from sources
  useEffect(() => {
    if (sources.length === 0) return;

    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];
    const categoryColor = getCategoryColor();

    // Create center category node
    graphNodes.push({
      id: `category-${category}`,
      label: category.toUpperCase(),
      type: 'category',
      x: 400,
      y: 250,
      color: categoryColor,
    });

    // Create source nodes in a circle
    sources.slice(0, 10).forEach((source, index) => {
      const angle = (index / Math.min(sources.length, 10)) * 2 * Math.PI;
      const radius = 150;
      const x = 400 + radius * Math.cos(angle);
      const y = 250 + radius * Math.sin(angle);

      graphNodes.push({
        id: source.id,
        label: source.title.substring(0, 20) + (source.title.length > 20 ? '...' : ''),
        type: 'source',
        x,
        y,
        color: '#94a3b8',
      });

      // Connect to category
      graphEdges.push({
        source: `category-${category}`,
        target: source.id,
        type: 'related_to',
      });

      // Create tag nodes and edges
      if (source.tags) {
        source.tags.slice(0, 2).forEach((tag) => {
          const tagId = `tag-${tag.tag_name}`;

          // Add tag node if not exists
          if (!graphNodes.find((n) => n.id === tagId)) {
            const tagAngle = Math.random() * 2 * Math.PI;
            const tagRadius = 250;
            graphNodes.push({
              id: tagId,
              label: tag.tag_name,
              type: 'tag',
              x: 400 + tagRadius * Math.cos(tagAngle),
              y: 250 + tagRadius * Math.sin(tagAngle),
              color: '#f59e0b',
            });
          }

          // Connect source to tag
          graphEdges.push({
            source: source.id,
            target: tagId,
            type: 'has_tag',
          });
        });
      }
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [sources, category]);

  // Draw graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = edge.type === 'has_tag' ? '#fbbf2420' : '#cbd5e140';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredNode === node.id;
      const radius = node.type === 'category' ? 30 : node.type === 'tag' ? 15 : 20;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Hover effect
      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#1f2937';
      ctx.font = node.type === 'category' ? 'bold 14px sans-serif' : '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + radius + 15);
    });
  }, [nodes, edges, hoveredNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a source node
    const clickedNode = nodes.find((node) => {
      if (node.type !== 'source') return false;
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance < 20;
    });

    if (clickedNode && clickedNode.type === 'source') {
      window.location.href = `/source/${clickedNode.id}`;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNode = nodes.find((node) => {
      const radius = node.type === 'category' ? 30 : node.type === 'tag' ? 15 : 20;
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance < radius;
    });

    setHoveredNode(hoveredNode?.id || null);
    canvas.style.cursor = hoveredNode?.type === 'source' ? 'pointer' : 'default';
  };

  if (sources.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="text-4xl mb-3">🕸️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Graph</h3>
        <p className="text-gray-600">
          Add sources to visualize connections between your knowledge
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🕸️</span>
              <span>Knowledge Graph</span>
            </h3>
            <p className="text-sm text-gray-600">
              {nodes.length} nodes • {edges.length} connections
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Category</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Sources</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Tags</span>
            </div>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="w-full"
      />
    </div>
  );
}
