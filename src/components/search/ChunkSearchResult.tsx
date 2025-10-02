'use client';

import React from 'react';
import type { ChunkSearchResult } from '@/types/chunks';
import Link from 'next/link';

interface ChunkSearchResultProps {
  result: ChunkSearchResult;
  onSourceClick?: (sourceId: string) => void;
}

export function ChunkSearchResultCard({ result, onSourceClick }: ChunkSearchResultProps) {
  const { chunk, source, relevance_score, highlighted_content } = result;
  const { metadata } = chunk;

  const handleClick = () => {
    if (onSourceClick) {
      onSourceClick(source.id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Source Info Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            href={`/sources/${source.id}`}
            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            onClick={handleClick}
          >
            {source.title}
          </Link>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span className="capitalize">{source.content_type}</span>
            {metadata.pageNumber && (
              <>
                <span>•</span>
                <span>Page {metadata.pageNumber}</span>
              </>
            )}
            {chunk.chunk_index > 0 && (
              <>
                <span>•</span>
                <span>Passage {chunk.chunk_index + 1}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{Math.round(relevance_score * 100)}%</span>
            <span className="text-gray-400 ml-1">match</span>
          </div>
        </div>
      </div>

      {/* Highlighted Passage */}
      <div className="relative">
        <div
          className="text-gray-700 leading-relaxed passage-highlight"
          dangerouslySetInnerHTML={{ __html: highlighted_content }}
        />
      </div>

      {/* Chunk Type Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${metadata.type === 'paragraph' ? 'bg-blue-100 text-blue-800' : ''}
          ${metadata.type === 'sentence' ? 'bg-green-100 text-green-800' : ''}
          ${metadata.type === 'arbitrary' ? 'bg-gray-100 text-gray-800' : ''}
        `}>
          {metadata.type}
        </span>
        {metadata.heading && (
          <span className="text-sm text-gray-500">
            in "{metadata.heading}"
          </span>
        )}
      </div>

      {/* Custom styles for highlighting */}
      <style jsx>{`
        :global(.passage-highlight mark) {
          background-color: #fef08a;
          padding: 2px 4px;
          border-radius: 2px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default ChunkSearchResultCard;
