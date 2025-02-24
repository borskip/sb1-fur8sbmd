import { useState, useCallback, useMemo } from 'react';
import type { Movie } from '../lib/tmdb';

interface MovieWithMeta {
  movie: Movie | null;
  rating?: number;
  addedAt?: string;
  watched?: boolean;
}

interface Filters {
  search: string;
  sortBy: 'rating' | 'releaseDate' | 'title' | 'director' | null;
  sortDirection: 'asc' | 'desc';
  genre: string | null;
  decade: string | null;
}

const defaultFilters: Filters = {
  search: '',
  sortBy: null,
  sortDirection: 'desc',
  genre: null,
  decade: null,
};

export function useMovieFilters(movies: MovieWithMeta[]) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // Extract unique genres from movies
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach(({ movie }) => {
      movie?.genres?.forEach(genre => {
        genreSet.add(genre.name);
      });
    });
    return Array.from(genreSet).sort();
  }, [movies]);

  // Extract unique decades from movies
  const decades = useMemo(() => {
    const decadeSet = new Set<string>();
    movies.forEach(({ movie }) => {
      if (movie?.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        const decade = `${Math.floor(year / 10) * 10}s`;
        decadeSet.add(decade);
      }
    });
    return Array.from(decadeSet).sort().reverse();
  }, [movies]);

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let result = movies.filter(({ movie }) => {
      if (!movie) return false;

      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = movie.title.toLowerCase().includes(searchLower);
        const genreMatch = movie.genres?.some(g => 
          g.name.toLowerCase().includes(searchLower)
        );
        const yearMatch = movie.release_date?.includes(searchLower);
        
        if (!titleMatch && !genreMatch && !yearMatch) return false;
      }

      // Genre filter
      if (filters.genre && !movie.genres?.some(g => g.name === filters.genre)) {
        return false;
      }

      // Decade filter
      if (filters.decade) {
        const year = new Date(movie.release_date).getFullYear();
        const decade = `${Math.floor(year / 10) * 10}s`;
        if (decade !== filters.decade) return false;
      }

      return true;
    });

    // Apply sorting if specified
    if (filters.sortBy) {
      result = [...result].sort((a, b) => {
        if (!a.movie || !b.movie) return 0;
        
        let comparison = 0;
        switch (filters.sortBy) {
          case 'rating':
            comparison = ((a.rating || 0) - (b.rating || 0));
            break;
          case 'releaseDate':
            comparison = (
              new Date(a.movie.release_date || 0).getTime() -
              new Date(b.movie.release_date || 0).getTime()
            );
            break;
          case 'title':
            comparison = a.movie.title.localeCompare(b.movie.title);
            break;
          case 'director': {
            const aDirector = a.movie.director || '';
            const bDirector = b.movie.director || '';
            comparison = aDirector.localeCompare(bDirector);
            break;
          }
        }
        return filters.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [movies, filters]);

  const updateFilter = useCallback((key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Check if any sorting or filtering is active
  const hasActiveFilters = useMemo(() => {
    return filters.sortBy !== null || 
           filters.search !== '' || 
           filters.genre !== null || 
           filters.decade !== null;
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredMovies,
    genres,
    decades,
    hasActiveFilters
  };
}