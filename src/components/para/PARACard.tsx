'use client';

import Link from 'next/link';

interface PARACardProps {
  id: string;
  name: string;
  description?: string;
  icon: string;
  type: 'project' | 'area' | 'resource';
  sourceCount: number;
}

export default function PARACard({ id, name, description, icon, type, sourceCount }: PARACardProps) {
  const getColorClasses = () => {
    switch (type) {
      case 'project':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200 hover:border-indigo-400',
          text: 'text-indigo-900',
          badge: 'bg-indigo-100 text-indigo-700',
        };
      case 'area':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200 hover:border-green-400',
          text: 'text-green-900',
          badge: 'bg-green-100 text-green-700',
        };
      case 'resource':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200 hover:border-purple-400',
          text: 'text-purple-900',
          badge: 'bg-purple-100 text-purple-700',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <Link href={`/para/${type}s/${id}`}>
      <div
        className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 h-full transition-all duration-200 hover:shadow-lg cursor-pointer group`}
      >
        {/* Icon */}
        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>

        {/* Name */}
        <h3 className={`text-xl font-bold ${colors.text} mb-2 line-clamp-2`}>
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* Source Count Badge */}
        <div className="flex items-center justify-between mt-auto">
          <span className={`inline-flex items-center gap-1 px-3 py-1 ${colors.badge} rounded-full text-sm font-medium`}>
            <span>📄</span>
            <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
