'use client';

interface CreateNewPARACardProps {
  type: 'project' | 'area' | 'resource';
  onClick: () => void;
}

export default function CreateNewPARACard({ type, onClick }: CreateNewPARACardProps) {
  const getColorClasses = () => {
    switch (type) {
      case 'project':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-300 hover:border-indigo-500',
          text: 'text-indigo-700',
          hoverBg: 'hover:bg-indigo-100',
        };
      case 'area':
        return {
          bg: 'bg-green-50',
          border: 'border-green-300 hover:border-green-500',
          text: 'text-green-700',
          hoverBg: 'hover:bg-green-100',
        };
      case 'resource':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-300 hover:border-purple-500',
          text: 'text-purple-700',
          hoverBg: 'hover:bg-purple-100',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <button
      onClick={onClick}
      className={`${colors.bg} ${colors.hoverBg} border-2 ${colors.border} border-dashed rounded-xl p-6 h-full transition-all duration-200 hover:shadow-lg cursor-pointer group flex flex-col items-center justify-center min-h-[240px]`}
    >
      {/* Plus Icon */}
      <div className={`text-6xl ${colors.text} mb-4 group-hover:scale-110 transition-transform duration-200`}>
        ➕
      </div>

      {/* Text */}
      <h3 className={`text-xl font-bold ${colors.text}`}>
        Create New {type.charAt(0).toUpperCase() + type.slice(1)}
      </h3>
    </button>
  );
}
