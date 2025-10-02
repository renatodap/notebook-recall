'use client';

import { useEffect, useState } from 'react';
import type { Source, Summary, Tag } from '@/types';

interface SourceWithDetails extends Source {
  summary: Summary[];
  tags: Tag[];
}

interface AddSourcesToPARAModalProps {
  paraType: 'project' | 'area' | 'resource';
  paraId: string;
  paraName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddSourcesToPARAModal({
  paraType,
  paraId,
  paraName,
  onClose,
  onSuccess,
}: AddSourcesToPARAModalProps) {
  const [sources, setSources] = useState<SourceWithDetails[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unassigned'>('unassigned');

  useEffect(() => {
    fetchSources();
  }, [filter]);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'unassigned'
        ? '/api/para/sources/unassigned'
        : '/api/sources';

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch sources');

      const data = await response.json();
      setSources(data.sources || data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedSourceIds.length === 0) {
      alert('Please select at least one source');
      return;
    }

    setSaving(true);
    try {
      // For each selected source, assign it to this PARA item
      const promises = selectedSourceIds.map(async (sourceId) => {
        const payload: any = {
          source_id: sourceId,
          project_ids: [],
          area_ids: [],
          resource_ids: [],
        };

        // Add the current PARA item to the appropriate array
        if (paraType === 'project') {
          payload.project_ids = [paraId];
        } else if (paraType === 'area') {
          payload.area_ids = [paraId];
        } else {
          payload.resource_ids = [paraId];
        }

        return fetch('/api/para/sources/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      });

      await Promise.all(promises);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error assigning sources:', error);
      alert('Failed to assign sources');
    } finally {
      setSaving(false);
    }
  };

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const getParaIcon = () => {
    switch (paraType) {
      case 'project': return '🎯';
      case 'area': return '🌳';
      case 'resource': return '💎';
    }
  };

  const getParaColor = () => {
    switch (paraType) {
      case 'project': return 'indigo';
      case 'area': return 'green';
      case 'resource': return 'purple';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>{getParaIcon()}</span>
            <span>Add Sources to {paraName}</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select existing sources to add to this {paraType}
          </p>

          {/* Filter Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('unassigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unassigned'
                  ? `bg-${getParaColor()}-600 text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unassigned ({sources.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? `bg-${getParaColor()}-600 text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Sources
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-4xl">⚡</div>
            </div>
          ) : sources.length > 0 ? (
            <div className="space-y-2">
              {sources.map((source) => (
                <label
                  key={source.id}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedSourceIds.includes(source.id)
                      ? `border-${getParaColor()}-400 bg-${getParaColor()}-50`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{
                    borderColor: selectedSourceIds.includes(source.id)
                      ? getParaColor() === 'indigo' ? '#818cf8' : getParaColor() === 'green' ? '#4ade80' : '#c084fc'
                      : undefined,
                    backgroundColor: selectedSourceIds.includes(source.id)
                      ? getParaColor() === 'indigo' ? '#eef2ff' : getParaColor() === 'green' ? '#f0fdf4' : '#faf5ff'
                      : undefined,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSourceIds.includes(source.id)}
                    onChange={() => toggleSourceSelection(source.id)}
                    className="mt-1 mr-3 h-5 w-5 rounded border-gray-300"
                    style={{
                      accentColor: getParaColor() === 'indigo' ? '#6366f1' : getParaColor() === 'green' ? '#22c55e' : '#a855f7'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl flex-shrink-0">
                        {source.content_type === 'pdf' ? '📄' :
                         source.content_type === 'url' ? '🔗' :
                         source.content_type === 'note' ? '📋' :
                         source.content_type === 'image' ? '🖼️' : '📝'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {source.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="capitalize">{source.content_type}</span>
                          <span>•</span>
                          <span>{new Date(source.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {source.summary?.[0]?.summary_text && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {source.summary[0].summary_text}
                      </p>
                    )}
                    {source.tags && source.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {source.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag.tag_name}
                          </span>
                        ))}
                        {source.tags.length > 3 && (
                          <span className="inline-flex px-2 py-0.5 text-gray-500 text-xs">
                            +{source.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'unassigned' ? 'No unassigned sources' : 'No sources found'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unassigned'
                  ? 'All your sources are already organized! Try viewing all sources.'
                  : 'Start by adding some content to your knowledge base.'}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedSourceIds.length > 0 && (
              <span className="font-medium">
                {selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedSourceIds.length === 0 || loading}
              className={`px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                getParaColor() === 'indigo' ? 'bg-indigo-600' :
                getParaColor() === 'green' ? 'bg-green-600' : 'bg-purple-600'
              }`}
            >
              {saving ? 'Adding...' : `Add ${selectedSourceIds.length || ''} to ${paraType}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
