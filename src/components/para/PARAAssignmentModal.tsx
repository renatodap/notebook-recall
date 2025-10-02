'use client';

import { useEffect, useState } from 'react';
import type { Project, Area, Resource } from '@/types';

interface PARAAssignmentModalProps {
  sourceId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PARAAssignmentModal({
  sourceId,
  onClose,
  onSuccess,
}: PARAAssignmentModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, areasRes, resourcesRes, statusRes] = await Promise.all([
          fetch('/api/para/projects'),
          fetch('/api/para/areas'),
          fetch('/api/para/resources'),
          fetch(`/api/para/sources/${sourceId}/status`),
        ]);

        const [projectsData, areasData, resourcesData, statusData] = await Promise.all([
          projectsRes.json(),
          areasRes.json(),
          resourcesRes.json(),
          statusRes.json(),
        ]);

        setProjects(projectsData.projects || []);
        setAreas(areasData.areas || []);
        setResources(resourcesData.resources || []);

        // Set current assignments
        setSelectedProjects((statusData.projects || []).map((p: any) => p.id));
        setSelectedAreas((statusData.areas || []).map((a: any) => a.id));
        setSelectedResources((statusData.resources || []).map((r: any) => r.id));
      } catch (error) {
        console.error('Error fetching PARA data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sourceId]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Assign to selected categories
      await fetch('/api/para/sources/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          project_ids: selectedProjects,
          area_ids: selectedAreas,
          resource_ids: selectedResources,
        }),
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving PARA assignments:', error);
      alert('Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (id: string, category: 'project' | 'area' | 'resource') => {
    if (category === 'project') {
      setSelectedProjects((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
    } else if (category === 'area') {
      setSelectedAreas((prev) =>
        prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
      );
    } else {
      setSelectedResources((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Organize with PARA</h2>
          <p className="text-sm text-gray-600 mt-1">
            Assign this source to projects, areas, or resources
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Projects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Projects</h3>
                {projects.length > 0 ? (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <label
                        key={project.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={() => toggleSelection(project.id, 'project')}
                          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-gray-600">{project.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No projects yet. Create one first!</p>
                )}
              </div>

              {/* Areas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas</h3>
                {areas.length > 0 ? (
                  <div className="space-y-2">
                    {areas.map((area) => (
                      <label
                        key={area.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAreas.includes(area.id)}
                          onChange={() => toggleSelection(area.id, 'area')}
                          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{area.name}</div>
                          {area.description && (
                            <div className="text-sm text-gray-600">{area.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No areas yet. Create one first!</p>
                )}
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resources</h3>
                {resources.length > 0 ? (
                  <div className="space-y-2">
                    {resources.map((resource) => (
                      <label
                        key={resource.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedResources.includes(resource.id)}
                          onChange={() => toggleSelection(resource.id, 'resource')}
                          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{resource.name}</div>
                          {resource.description && (
                            <div className="text-sm text-gray-600">{resource.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No resources yet. Create one first!</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
