import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface FilterProps {
  filters: {
    search: string;
    sortBy: string | null;
    sortDirection: 'asc' | 'desc';
    genre: string | null;
    decade: string | null;
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  genres: string[];
  decades: string[];
}

export function MovieFilters({
  filters,
  onFilterChange,
  onReset,
  genres,
  decades,
}: FilterProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          placeholder="Search by title, genre, or year..."
          className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Sort */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
            <ArrowUpDown className="w-4 h-4" />
            Sort by
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sortBy || ''}
              onChange={(e) => onFilterChange('sortBy', e.target.value || null)}
              className="flex-1 rounded-lg border text-sm py-1.5"
            >
              <option value="">Default</option>
              <option value="rating">Rating</option>
              <option value="releaseDate">Release Date</option>
              <option value="title">Title</option>
              <option value="director">Most Films by Director</option>
            </select>
            <button
              onClick={() => onFilterChange('sortDirection', 
                filters.sortDirection === 'asc' ? 'desc' : 'asc'
              )}
              className="px-2 py-1 border rounded-lg hover:bg-gray-50"
              title="Toggle sort direction"
            >
              {filters.sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Genre filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
            <Filter className="w-4 h-4" />
            Genre
          </label>
          <select
            value={filters.genre || ''}
            onChange={(e) => onFilterChange('genre', e.target.value || null)}
            className="w-full rounded-lg border text-sm py-1.5"
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Decade filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
            <Filter className="w-4 h-4" />
            Decade
          </label>
          <select
            value={filters.decade || ''}
            onChange={(e) => onFilterChange('decade', e.target.value || null)}
            className="w-full rounded-lg border text-sm py-1.5"
          >
            <option value="">All Decades</option>
            {decades.map(decade => (
              <option key={decade} value={decade}>{decade}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset button */}
      {(filters.search || filters.sortBy || filters.genre || filters.decade) && (
        <div className="flex justify-end">
          <button
            onClick={onReset}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}