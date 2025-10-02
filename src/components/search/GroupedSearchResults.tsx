'use client';

import React, { useState } from 'react';
import type { GroupedSearchResults } from '@/types/chunks';
import { ChunkSearchResultCard } from './ChunkSearchResult';
import Link from 'next/link';

interface GroupedSearchResultsProps {
  group: GroupedSearchResults;
}

export function GroupedSearchResultsCard({ group }: GroupedSearchResultsProps) {
  const [expanded, setExpanded] = useState(true);
  const { source, chunks, best_score, total_matches } = group;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Source Header - Clickable to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{source.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span className="capitalize">{source.content_type}</span>
              <span>•</span>
              <span className="font-medium text-blue-600">
                {total_matches} {total_matches === 1 ? 'match' : 'matches'}
              </span>
              <span>•</span>
              <span>
                Best: {Math.round(best_score * 100)}% relevance
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/sources/${source.id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              View Source
            </Link>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expanded ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Matched Passages */}
      {expanded && (
        <div className="p-4 space-y-4">
          {chunks.map((chunkResult, idx) => (
            <ChunkSearchResultCard
              key={`${chunkResult.chunk.id}-${idx}`}
              result={chunkResult}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupedSearchResultsCard;
