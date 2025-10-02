'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project, Area, Resource, PARAStats } from '@/types';

interface PARADashboardProps {
  userId: string;
}

export default function PARADashboard({ userId }: PARADashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<PARAStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPARAData() {
      try {
        const [projectsRes, areasRes, resourcesRes, statsRes] = await Promise.all([
          fetch('/api/para/projects'),
          fetch('/api/para/areas'),
          fetch('/api/para/resources'),
          fetch('/api/para/stats'),
        ]);

        const [projectsData, areasData, resourcesData, statsData] = await Promise.all([
          projectsRes.json(),
          areasRes.json(),
          resourcesRes.json(),
          statsRes.json(),
        ]);

        setProjects(projectsData.projects || []);
        setAreas(areasData.areas || []);
        setResources(resourcesData.resources || []);
        setStats(statsData.stats || null);
      } catch (error) {
        console.error('Error fetching PARA data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPARAData();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">PARA Organization</h2>
        <Link
          href="/para"
          className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
        >
          View All →
        </Link>
      </div>

      {/* Stats Overview */}
      {stats && stats.unassigned_sources > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>{stats.unassigned_sources}</strong> source{stats.unassigned_sources !== 1 ? 's' : ''}{' '}
            need to be organized.{' '}
            <Link href="/para/unassigned" className="underline font-semibold">
              Organize now
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
            <span className="text-sm text-gray-500">{projects.length}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Short-term goals</p>
          {projects.length > 0 ? (
            <ul className="space-y-2">
              {projects.slice(0, 3).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/para/projects/${project.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 block truncate"
                  >
                    {project.name}
                  </Link>
                </li>
              ))}
              {projects.length > 3 && (
                <li>
                  <Link
                    href="/para/projects"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    +{projects.length - 3} more
                  </Link>
                </li>
              )}
            </ul>
          ) : (
            <Link
              href="/para/projects/new"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Create your first project
            </Link>
          )}
        </div>

        {/* Areas */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Areas</h3>
            <span className="text-sm text-gray-500">{areas.length}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Long-term responsibilities</p>
          {areas.length > 0 ? (
            <ul className="space-y-2">
              {areas.slice(0, 3).map((area) => (
                <li key={area.id}>
                  <Link
                    href={`/para/areas/${area.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 block truncate"
                  >
                    {area.name}
                  </Link>
                </li>
              ))}
              {areas.length > 3 && (
                <li>
                  <Link
                    href="/para/areas"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    +{areas.length - 3} more
                  </Link>
                </li>
              )}
            </ul>
          ) : (
            <Link
              href="/para/areas/new"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Create your first area
            </Link>
          )}
        </div>

        {/* Resources */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
            <span className="text-sm text-gray-500">{resources.length}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Reference materials</p>
          {resources.length > 0 ? (
            <ul className="space-y-2">
              {resources.slice(0, 3).map((resource) => (
                <li key={resource.id}>
                  <Link
                    href={`/para/resources/${resource.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 block truncate"
                  >
                    {resource.name}
                  </Link>
                </li>
              ))}
              {resources.length > 3 && (
                <li>
                  <Link
                    href="/para/resources"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    +{resources.length - 3} more
                  </Link>
                </li>
              )}
            </ul>
          ) : (
            <Link
              href="/para/resources/new"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Create your first resource
            </Link>
          )}
        </div>
      </div>

      {/* Archive Link */}
      {stats && stats.archived_sources > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href="/para/archive"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-between"
          >
            <span>Archive</span>
            <span className="text-gray-500">{stats.archived_sources} sources</span>
          </Link>
        </div>
      )}
    </div>
  );
}
