// src/components/search/EntityBubble.tsx
import React from 'react';

export interface Entity {
  text: string;
  label: string;
  sentences: string[];
}

interface EntityBubbleProps {
  entity: Entity;
  onClick: () => void;
  isSelected: boolean;
}

// Map entity types to colors
const entityColors: Record<string, { bg: string, text: string, border: string }> = {
  'PERSON': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'ORG': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'GPE': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'LOC': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  'PRODUCT': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'EVENT': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  'DATE': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'TIME': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'MONEY': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'QUANTITY': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'ORDINAL': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  'CARDINAL': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  'WORK_OF_ART': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  'LAW': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'LANGUAGE': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'FAC': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'NORP': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  // Default for any other entity types
  'DEFAULT': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
};

const EntityBubble: React.FC<EntityBubbleProps> = ({ entity, onClick, isSelected }) => {
  const style = entityColors[entity.label] || entityColors['DEFAULT'];
  
  return (
    <button
      onClick={onClick}
      className={`
        ${style.bg} ${style.text} ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''} 
        px-3 py-1 rounded-full text-xs font-medium border ${style.border}
        hover:bg-opacity-80 transition-all duration-200 flex items-center
        shadow-sm hover:shadow
      `}
      title={`${entity.label}: ${entity.text}`}
    >
      <span className="truncate max-w-[120px]">{entity.text}</span>
      <span className="ml-1 bg-white bg-opacity-50 px-1 rounded-sm text-[10px]">
        {entity.label}
      </span>
    </button>
  );
};

export default EntityBubble;