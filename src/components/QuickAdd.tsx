import React, { useState } from 'react';
import { X, Search, Plus, Heart, Check, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchMovies } from '../lib/tmdb';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../lib/auth';
import { useDebouncedCallback } from 'use-debounce';
import type { Movie } from '../lib/tmdb';

interface QuickAddProps {
  onClose: () => void;
}

export function QuickAdd({ onClose }: QuickAddProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<'watchlist' | 'watched' | null>(null);
  const [rating, setRating] = useState(0);
  
  const {
    addToPersonalWatchlist,
    addToPersonal,
    toggleWatched,
    rateMovie
  } = useWatchlist(user?.id || '');

  const debouncedSetQuery = useDebouncedCallback(setQuery, 300);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['quickSearch', query],
    queryFn: () => searchMovies(query),
    enabled: query.length > 2,
  });

  const handleAddMovie = async (movie: Movie, action: 'watchlist' | 'watched') => {
    try {
      if (action === 'watchlist') {
        await addToPersonalWatchlist.mutateAsync(movie);
      } else {
        await addToPersonal.mutateAsync(movie);
        await toggleWatched.mutateAsync(movie);
        if (rating > 0) {
          await rateMovie.mutateAsync({ movieId: movie.id, rating });
        }
      }
      onClose();
    } catch (error) {
      console.error('Failed to add movie:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Add Movie</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              onChange={(e) => debouncedSetQuery(e.target.value)}
              placeholder="Search for a movie..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="w-16 h-24 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults?.movies.length ? (
            <div className="p-4 space-y-3">
              {searchResults.movies.slice(0, 8).map(movie => (
                <div
                  key={movie.id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    className="w-12 h-18 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{movie.title}</h3>
                    <p className="text-sm text-gray-500">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddMovie(movie, 'watchlist')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Add to Watchlist"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAction('watched');
                        // Show rating selector
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Mark as Watched"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length > 2 ? (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No movies found for "{query}"</p>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search for movies</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}