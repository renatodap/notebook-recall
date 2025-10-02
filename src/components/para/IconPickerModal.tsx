'use client';

import { useState } from 'react';

interface IconPickerModalProps {
  currentIcon: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const ICON_CATEGORIES = {
  'Work & Projects': ['💼', '📊', '📈', '🎯', '🚀', '⚡', '🔥', '💡', '🛠️', '⚙️', '📝', '📋'],
  'Knowledge & Learning': ['📚', '📖', '📕', '📗', '📘', '📙', '🎓', '🧠', '💭', '🔬', '🔭', '🧪'],
  'Areas & Domains': ['🌳', '🌲', '🌴', '🏞️', '🌅', '🏔️', '🏛️', '🏗️', '🏭', '🏢', '🏦', '🏫'],
  'Resources & Tools': ['💎', '🔧', '🔨', '⚒️', '🛡️', '⚗️', '🎨', '🖼️', '🎭', '🎪', '🎬', '🎮'],
  'Communication': ['💬', '📧', '📬', '📮', '📨', '📩', '📞', '📱', '💻', '🖥️', '⌨️', '🖱️'],
  'Nature & Objects': ['⭐', '🌟', '✨', '🌈', '🌸', '🌺', '🌻', '🌼', '🍀', '🌿', '☘️', '🎋'],
  'Symbols': ['♻️', '⚡', '🔱', '🔰', '⚜️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠'],
  'Flags & Markers': ['🚩', '🎌', '🏁', '🏳️', '🏴', '📍', '📌', '📎', '🔖', '🏷️', '🎯', '🎪'],
};

export default function IconPickerModal({ currentIcon, onSelect, onClose }: IconPickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(ICON_CATEGORIES)[0]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Choose an Icon</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Current Selection */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-4xl">{currentIcon}</span>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Icon</p>
              <p className="text-xs text-gray-500">Click any icon below to change</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {Object.keys(ICON_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-8 gap-3">
            {ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES].map((icon) => (
              <button
                key={icon}
                onClick={() => onSelect(icon)}
                className={`text-4xl p-4 rounded-lg transition-all hover:scale-110 ${
                  icon === currentIcon
                    ? 'bg-indigo-100 ring-2 ring-indigo-500'
                    : 'hover:bg-gray-100'
                }`}
                title={icon}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
