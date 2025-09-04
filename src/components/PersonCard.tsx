import React from 'react';
import { User, Star } from 'lucide-react';

interface PersonCardProps {
  person: {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
    known_for?: Array<{
      id: number;
      title?: string;
      name?: string;
      media_type: string;
    }>;
  };
  onClick?: () => void;
}

export function PersonCard({ person, onClick }: PersonCardProps) {
  const knownFor = person.known_for?.slice(0, 2).map(item => 
    item.title || item.name
  ).join(', ');

  return (
    <div 
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-lg shadow-md transition-transform group-hover:scale-105">
        {person.profile_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
            alt={person.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-white text-center p-4">
            <p className="font-medium">View Movies</p>
          </div>
        </div>
      </div>

      {/* Person Info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
          {person.name}
        </h3>
        
        <p className="text-xs text-gray-500">
          {person.known_for_department}
        </p>
        
        {knownFor && (
          <p className="text-xs text-gray-400 line-clamp-1">
            Known for: {knownFor}
          </p>
        )}
        
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Star className="w-3 h-3" />
          <span>{person.popularity.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}