import React from 'react';
import { Film, Tv } from 'lucide-react';

interface MediaTypeToggleProps {
  type: 'movies' | 'tv';
  onChange: (type: 'movies' | 'tv') => void;
}

export function MediaTypeToggle({ type, onChange }: MediaTypeToggleProps) {
  return (
    <div className="flex items-center justify-center space-x-2 bg-white rounded-lg p-1 border">
      <button
        onClick={() => onChange('movies')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          type === 'movies'
            ? 'bg-primary text-white'
            : 'hover:bg-gray-100 text-gray-600'
        }`}
      >
        <Film className="w-4 h-4" />
        <span>Movies</span>
      </button>
      <button
        onClick={() => onChange('tv')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          type === 'tv'
            ? 'bg-primary text-white'
            : 'hover:bg-gray-100 text-gray-600'
        }`}
      >
        <Tv className="w-4 h-4" />
        <span>TV Shows</span>
      </button>
    </div>
  );
}