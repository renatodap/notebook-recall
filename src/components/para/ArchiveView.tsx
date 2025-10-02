'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SourceCard from '@/components/SourceCard';
import type { Source } from '@/types';

interface ArchiveViewProps {
  initialSources: any[];
}

export default function ArchiveView({ initialSources }: ArchiveViewProps) {
  const [sources, setSources] = useState(initialSources);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUnarchive = async (sourceId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/para/sources/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId, archived: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to unarchive source');
      }

      // Remove from local state
      setSources(sources.filter((s) => s.id !== sourceId));
      router.refresh();
    } catch (error) {
      console.error('Error unarchiving source:', error);
      alert('Failed to unarchive source');
    } finally {
      setLoading(false);
    }
  };

  if (sources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No archived sources</h3>
        <p className="text-gray-600">
          Sources you archive will appear here for safekeeping
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {sources.length} archived source{sources.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sources.map((source) => {
          const summary = Array.isArray(source.summaries) ? source.summaries[0] : source.summaries;
          const tags = source.tags || [];

          return (
            <div key={source.id} className="relative">
              <SourceCard
                source={source}
                summary={summary}
                tags={tags}
                onClick={() => router.push(`/sources/${source.id}`)}
              />
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnarchive(source.id);
                  }}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Unarchive
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
