'use client';

import dynamic from 'next/dynamic';

// Lazy load KnowledgeGraph (D3.js is heavy - 100KB+)
const KnowledgeGraphClient = dynamic(
  () => import('@/components/visualization/KnowledgeGraphClient'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    ),
    ssr: false, // Client-only for D3.js
  }
);

export default function KnowledgeGraphLoader() {
  return <KnowledgeGraphClient />;
}
