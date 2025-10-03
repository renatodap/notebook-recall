'use client';

import { useState } from 'react';
import type { Project, Area, Resource, PARAStats } from '@/types';
import PARACard from './PARACard';
import CreateNewPARACard from './CreateNewPARACard';
import IconPickerModal from './IconPickerModal';
import MobileNav from '../MobileNav';

type PARACategory = 'projects' | 'areas' | 'resources' | 'archive';

interface PARAItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
  source_count: number;
  created_at?: string;
  user_id?: string;
}

interface PARADashboardRedesignProps {
  initialProjects: (Project & { source_count: number; icon?: string })[];
  initialAreas: (Area & { source_count: number; icon?: string })[];
  initialResources: (Resource & { source_count: number; icon?: string })[];
  stats: PARAStats;
}

export default function PARADashboardRedesign({
  initialProjects,
  initialAreas,
  initialResources,
  stats,
}: PARADashboardRedesignProps) {
  const [activeCategory, setActiveCategory] = useState<PARACategory>('projects');
  const [projects, setProjects] = useState(initialProjects);
  const [areas, setAreas] = useState(initialAreas);
  const [resources, setResources] = useState(initialResources);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerItem, setIconPickerItem] = useState<{ id: string; type: PARACategory; currentIcon: string } | null>(null);
  const [createType, setCreateType] = useState<'project' | 'area' | 'resource'>('project');
  const [creating, setCreating] = useState(false);

  const getCategoryButtonClass = (category: PARACategory, isActive: boolean) => {
    if (!isActive) return 'text-gray-700 hover:bg-gray-100';

    switch (category) {
      case 'projects': return 'bg-indigo-600 text-white shadow-md';
      case 'areas': return 'bg-green-600 text-white shadow-md';
      case 'resources': return 'bg-purple-600 text-white shadow-md';
      case 'archive': return 'bg-gray-600 text-white shadow-md';
    }
  };

  const getCategoryIcon = (category: PARACategory) => {
    switch (category) {
      case 'projects': return '🎯';
      case 'areas': return '🌳';
      case 'resources': return '💎';
      case 'archive': return '📦';
    }
  };

  const getCurrentItems = (): PARAItem[] => {
    switch (activeCategory) {
      case 'projects': return projects;
      case 'areas': return areas;
      case 'resources': return resources;
      case 'archive': return [];
    }
  };

  const openCreateModal = (type: 'project' | 'area' | 'resource') => {
    setCreateType(type);
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const icon = formData.get('icon') as string || getCategoryIcon(activeCategory);

    if (!name.trim()) return;

    setCreating(true);
    try {
      const endpoint = `/api/para/${createType}s`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, icon }),
      });

      if (!response.ok) throw new Error(`Failed to create ${createType}`);

      const { [createType]: newItem } = await response.json();

      // Update local state
      if (createType === 'project') {
        setProjects([{ ...newItem, source_count: 0, icon: icon }, ...projects]);
      } else if (createType === 'area') {
        setAreas([{ ...newItem, source_count: 0, icon: icon }, ...areas]);
      } else {
        setResources([{ ...newItem, source_count: 0, icon: icon }, ...resources]);
      }

      setShowCreateModal(false);
    } catch (error) {
      console.error(`Error creating ${createType}:`, error);
      alert(`Failed to create ${createType}`);
    } finally {
      setCreating(false);
    }
  };

  const handleIconSelect = async (icon: string) => {
    if (!iconPickerItem) return;

    try {
      const response = await fetch(`/api/para/${iconPickerItem.type}s/${iconPickerItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon }),
      });

      if (!response.ok) throw new Error('Failed to update icon');

      // Update local state
      if (iconPickerItem.type === 'projects') {
        setProjects(projects.map(p => p.id === iconPickerItem.id ? { ...p, icon } : p));
      } else if (iconPickerItem.type === 'areas') {
        setAreas(areas.map(a => a.id === iconPickerItem.id ? { ...a, icon } : a));
      } else if (iconPickerItem.type === 'resources') {
        setResources(resources.map(r => r.id === iconPickerItem.id ? { ...r, icon } : r));
      }

      setShowIconPicker(false);
      setIconPickerItem(null);
    } catch (error) {
      console.error('Error updating icon:', error);
      alert('Failed to update icon');
    }
  };

  const currentItems = getCurrentItems();

  return (
    <>
      <MobileNav />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-0 md:pl-64">
        {/* Top Navigation Bar - Horizontal PARA */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* PARA Navigation */}
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 mr-4">PARA</h1>
                <nav className="flex gap-2">
                  {(['projects', 'areas', 'resources', 'archive'] as PARACategory[]).map(
                    (category) => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${getCategoryButtonClass(category, activeCategory === category)}`}
                      >
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <span className="capitalize">{category}</span>
                      </button>
                    )
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[1920px] mx-auto px-6 py-8">
          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-5xl">{getCategoryIcon(activeCategory)}</span>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 capitalize">
                  {activeCategory}
                </h2>
                <p className="text-gray-600 text-lg">
                  {activeCategory === 'projects' && 'Short-term goals and active work'}
                  {activeCategory === 'areas' && 'Long-term responsibilities and domains'}
                  {activeCategory === 'resources' && 'Reference materials and useful information'}
                  {activeCategory === 'archive' && 'Inactive and completed work'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {activeCategory !== 'archive' && (
            <div className="mb-8 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currentItems.length}</span>
                <span>{activeCategory}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {currentItems.reduce((sum, item) => sum + item.source_count, 0)}
                </span>
                <span>total sources</span>
              </div>
              {stats.unassigned_sources > 0 && (
                <div className="flex items-center gap-2 text-amber-600 font-medium">
                  <span>⚠️</span>
                  <span>{stats.unassigned_sources} unassigned sources</span>
                </div>
              )}
            </div>
          )}

          {/* PARA Items Grid */}
          {activeCategory === 'archive' ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Archive</h3>
              <p className="text-gray-600 mb-6">
                Archived sources are kept here for reference
              </p>
              <a
                href="/para/archive"
                className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                View Archive
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Create New Card */}
              <CreateNewPARACard
                type={activeCategory as 'project' | 'area' | 'resource'}
                onClick={() => openCreateModal(activeCategory as 'project' | 'area' | 'resource')}
              />

              {/* PARA Item Cards */}
              {currentItems.map((item) => (
                <PARACard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description || undefined}
                  icon={item.icon || getCategoryIcon(activeCategory)}
                  type={activeCategory as 'project' | 'area' | 'resource'}
                  sourceCount={item.source_count}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {currentItems.length === 0 && activeCategory !== 'archive' && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-4">No {activeCategory} yet</p>
              <p className="text-sm">Click the &ldquo;Create New&rdquo; card above to get started!</p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-3xl">{getCategoryIcon(activeCategory)}</span>
                <span>Create New {createType.charAt(0).toUpperCase() + createType.slice(1)}</span>
              </h2>
              <form onSubmit={handleCreate}>
                <input type="hidden" name="icon" value={getCategoryIcon(activeCategory)} />
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

        {/* Icon Picker Modal */}
        {showIconPicker && iconPickerItem && (
          <IconPickerModal
            currentIcon={iconPickerItem.currentIcon}
            onSelect={handleIconSelect}
            onClose={() => {
              setShowIconPicker(false);
              setIconPickerItem(null);
            }}
          />
        )}
      </div>
    </>
  );
}
