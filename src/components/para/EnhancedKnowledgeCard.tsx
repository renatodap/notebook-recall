'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Source, Summary, Tag } from '@/types';
import PARAAssignmentModal from './PARAAssignmentModal';

interface EnhancedKnowledgeCardProps {
  source: Source & { summary: Summary[]; tags: Tag[] };
  category: 'projects' | 'areas' | 'resources' | 'archive';
  categoryColor: string;
  initialPinned?: boolean;
}

export default function EnhancedKnowledgeCard({
  source,
  category,
  categoryColor,
  initialPinned = false,
}: EnhancedKnowledgeCardProps) {
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [showActions, setShowActions] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const summary = source.summary?.[0];

  const contentTypeIcons: Record<string, string> = {
    text: '📝',
    url: '🔗',
    pdf: '📄',
    note: '📋',
    image: '🖼️',
  };

  const contentTypeLabels: Record<string, string> = {
    text: 'Text',
    url: 'Web',
    pdf: 'PDF',
    note: 'Note',
    image: 'Image',
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (pinLoading || category === 'archive') return;

    setPinLoading(true);
    try {
      const url = '/api/pins';
      const method = isPinned ? 'DELETE' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: source.id,
          category,
        }),
      });

      if (response.ok) {
        setIsPinned(!isPinned);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to pin/unpin source');
      }
    } catch (error) {
      console.error('Error pinning source:', error);
      alert('Failed to pin/unpin source');
    } finally {
      setPinLoading(false);
    }
  };

  const getCategoryBadgeColor = () => {
    switch (categoryColor) {
      case 'indigo':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'green':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'purple':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'gray':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getHoverBorderColor = () => {
    switch (categoryColor) {
      case 'indigo':
        return 'hover:border-indigo-400';
      case 'green':
        return 'hover:border-green-400';
      case 'purple':
        return 'hover:border-purple-400';
      case 'gray':
        return 'hover:border-gray-400';
      default:
        return 'hover:border-blue-400';
    }
  };

  return (
    <Link href={`/source/${source.id}`}>
      <div
        className={`group relative bg-white rounded-xl border-2 border-gray-200 ${getHoverBorderColor()} shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Pin Badge */}
        {isPinned && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
              📌 Pinned
            </span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        {showActions && (
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <button
              onClick={handlePin}
              className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title={isPinned ? 'Unpin' : 'Pin to top'}
            >
              {isPinned ? '📌' : '📍'}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAssignModal(true);
              }}
              className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Organize with PARA"
            >
              📂
            </button>
          </div>
        )}

        <div className="p-5">
          {/* Header: Icon, Title, Date */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 text-3xl">{contentTypeIcons[source.content_type]}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-1">
                {source.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`px-2 py-0.5 rounded ${getCategoryBadgeColor()} border`}>
                  {contentTypeLabels[source.content_type]}
                </span>
                <span>•</span>
                <time dateTime={source.created_at}>
                  {new Date(source.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
            </div>
          </div>

          {/* AI-Generated Summary Preview */}
          {summary && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                {summary.summary_text}
              </p>
            </div>
          )}

          {/* Key Topics (AI-Inferred Tags) */}
          {summary?.key_topics && summary.key_topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {summary.key_topics.slice(0, 4).map((topic, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {topic}
                </span>
              ))}
              {summary.key_topics.length > 4 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-200">
                  +{summary.key_topics.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Key Actions (if available) */}
          {summary?.key_actions && summary.key_actions.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Key Actions
              </div>
              <ul className="space-y-1">
                {summary.key_actions.slice(0, 2).map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="flex-shrink-0 text-green-500">✓</span>
                    <span className="line-clamp-1">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata Bar */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {summary?.word_count && (
                <span className="flex items-center gap-1">
                  <span>📊</span>
                  <span>{summary.word_count} words</span>
                </span>
              )}
              {source.tags && source.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <span>🏷️</span>
                  <span>{source.tags.length} tags</span>
                </span>
              )}
            </div>

            {/* Connection Indicator */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Connected sources"
              >
                🔗 0
              </span>
            </div>
          </div>
        </div>

        {/* Category Color Accent (left border) */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 bg-${categoryColor}-500`}
          style={{
            backgroundColor:
              categoryColor === 'indigo'
                ? '#6366f1'
                : categoryColor === 'green'
                ? '#22c55e'
                : categoryColor === 'purple'
                ? '#a855f7'
                : '#6b7280',
          }}
        />
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <PARAAssignmentModal
          sourceId={source.id}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            // Optionally refresh or show success message
            setShowAssignModal(false);
          }}
        />
      )}
    </Link>
  );
}
