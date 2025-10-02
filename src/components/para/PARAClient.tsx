'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Project, Area, Resource, PARAStats } from '@/types';

interface PARAClientProps {
  initialProjects: (Project & { source_count: number })[];
  initialAreas: (Area & { source_count: number })[];
  initialResources: (Resource & { source_count: number })[];
  stats: PARAStats;
}

export default function PARAClient({
  initialProjects,
  initialAreas,
  initialResources,
  stats,
}: PARAClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [areas, setAreas] = useState(initialAreas);
  const [resources, setResources] = useState(initialResources);
  const [activeTab, setActiveTab] = useState<'projects' | 'areas' | 'resources'>('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'project' | 'area' | 'resource'>('project');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name.trim()) return;

    setCreating(true);
    try {
      const endpoint = `/api/para/${createType}s`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) throw new Error(`Failed to create ${createType}`);

      const { [createType]: newItem } = await response.json();

      // Update local state
      if (createType === 'project') {
        setProjects([{ ...newItem, source_count: 0 }, ...projects]);
      } else if (createType === 'area') {
        setAreas([{ ...newItem, source_count: 0 }, ...areas]);
      } else {
        setResources([{ ...newItem, source_count: 0 }, ...resources]);
      }

      setShowCreateModal(false);
      router.refresh();
    } catch (error) {
      console.error(`Error creating ${createType}:`, error);
      alert(`Failed to create ${createType}`);
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = (type: 'project' | 'area' | 'resource') => {
    setCreateType(type);
    setShowCreateModal(true);
  };

  const renderItems = (
    items: any[],
    type: 'project' | 'area' | 'resource',
    emptyMessage: string,
    emptyDescription: string,
    icon: string,
    colorClass: string
  ) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-16">
          <div className={`text-6xl mb-4`}>{icon}</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{emptyMessage}</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{emptyDescription}</p>
          <button
            onClick={() => openCreateModal(type)}
            className={`px-6 py-3 ${colorClass} text-white rounded-lg font-medium hover:opacity-90 transition-opacity`}
          >
            Create Your First {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/para/${type}s/${item.id}`}
            className="block group"
          >
            <div className={`bg-white rounded-xl p-6 shadow-sm border-2 border-transparent hover:border-${colorClass.split('-')[1]}-300 hover:shadow-md transition-all duration-200`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl`}>{icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h3>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass} bg-opacity-10`}>
                  {item.source_count}
                </div>
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {item.description}
                </p>
              )}
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Created {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_sources}</div>
          <div className="text-sm text-gray-600">Total Sources</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-indigo-600">{stats.project_count}</div>
          <div className="text-sm text-gray-600">Projects</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl mb-2">🌳</div>
          <div className="text-2xl font-bold text-green-600">{stats.area_count}</div>
          <div className="text-sm text-gray-600">Areas</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl mb-2">💎</div>
          <div className="text-2xl font-bold text-purple-600">{stats.resource_count}</div>
          <div className="text-sm text-gray-600">Resources</div>
        </div>
      </div>

      {/* Warning for unassigned sources */}
      {stats.unassigned_sources > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">Unassigned Sources</h3>
            <p className="text-sm text-amber-800">
              You have {stats.unassigned_sources} source{stats.unassigned_sources !== 1 ? 's' : ''} not
              assigned to any Project, Area, or Resource.
              <Link href="/dashboard" className="font-medium underline ml-1">
                Organize them now
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Archive Link */}
      {stats.archived_sources > 0 && (
        <div className="mb-6">
          <Link
            href="/para/archive"
            className="block bg-gray-100 hover:bg-gray-200 rounded-xl p-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📦</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Archive</h3>
                  <p className="text-sm text-gray-600">
                    {stats.archived_sources} archived source{stats.archived_sources !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎯 Projects
          </button>
          <button
            onClick={() => setActiveTab('areas')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'areas'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🌳 Areas
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'resources'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💎 Resources
          </button>
        </div>

        <button
          onClick={() => openCreateModal(activeTab === 'projects' ? 'project' : activeTab === 'areas' ? 'area' : 'resource')}
          className={`px-4 py-2 rounded-lg font-medium text-white shadow-sm hover:opacity-90 transition-opacity ${
            activeTab === 'projects'
              ? 'bg-indigo-600'
              : activeTab === 'areas'
              ? 'bg-green-600'
              : 'bg-purple-600'
          }`}
        >
          + New {activeTab === 'projects' ? 'Project' : activeTab === 'areas' ? 'Area' : 'Resource'}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
        {activeTab === 'projects' && renderItems(
          projects,
          'project',
          'No Projects Yet',
          'Projects are short-term efforts with specific goals and deadlines. Start organizing your work!',
          '🎯',
          'text-indigo-600'
        )}
        {activeTab === 'areas' && renderItems(
          areas,
          'area',
          'No Areas Yet',
          'Areas are ongoing responsibilities you need to maintain over time. Define your areas of focus!',
          '🌳',
          'text-green-600'
        )}
        {activeTab === 'resources' && renderItems(
          resources,
          'resource',
          'No Resources Yet',
          'Resources are references, materials, and information for future use. Build your knowledge library!',
          '💎',
          'text-purple-600'
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New {createType.charAt(0).toUpperCase() + createType.slice(1)}
            </h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`My ${createType.charAt(0).toUpperCase() + createType.slice(1)}`}
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Describe your ${createType}...`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 ${
                    createType === 'project'
                      ? 'bg-indigo-600'
                      : createType === 'area'
                      ? 'bg-green-600'
                      : 'bg-purple-600'
                  }`}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
