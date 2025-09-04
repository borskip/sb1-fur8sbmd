import React from 'react';

interface GenreData {
  name: string;
  count: number;
  avgRating: number;
}

interface GenreChartProps {
  genres: GenreData[];
}

export function GenreChart({ genres }: GenreChartProps) {
  const maxCount = Math.max(...genres.map(g => g.count));

  return (
    <div className="space-y-4">
      {genres.map(genre => (
        <div key={genre.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{genre.name}</span>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{genre.count} movies</span>
              <span>•</span>
              <span>{genre.avgRating.toFixed(1)} avg</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(genre.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}