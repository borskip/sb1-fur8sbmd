import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Heart, Check, Star, Filter, Grid, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { MovieCard } from '../components/MovieCard';
import { MovieFilters } from '../components/MovieFilters';
import { useMovieFilters } from '../hooks/useMovieFilters';

export function MyMovies() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched'>('watchlist');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get watchlist
  const { data: watchlist } = useQuery({
    queryKey: ['myWatchlist', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_watchlist')
        .select('*')
        .eq('user_id', user!.id)
        .not('want_to_see_rating', 'is', null)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(user)
  });

  // Get watched movies with ratings
  const { data: watched } = useQuery({
    queryKey: ['myWatched', user?.id],
    queryFn: async () => {
      const [watchedMovies, ratings] = await Promise.all([
        supabase
          .from('watched_movies')
          .select('*')
          .eq('user_id', user!.id)
          .order('watched_at', { ascending: false }),
        
        supabase
          .from('ratings')
          .select('*')
          .eq('user_id', user!.id)
      ]);

      if (watchedMovies.error) throw watchedMovies.error;
      if (ratings.error) throw ratings.error;

      // Combine watched movies with their ratings
      const ratingMap = new Map(ratings.data?.map(r => [r.movie_id, r.rating]) || []);
      
      return watchedMovies.data?.map(movie => ({
        ...movie,
        rating: ratingMap.get(movie.movie_id)
      })) || [];
    },
    enabled: Boolean(user)
  });

  const currentMovies = activeTab === 'watchlist' ? watchlist : watched;
  
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredMovies,
    genres,
    decades
  } = useMovieFilters(
    currentMovies?.map(m => ({
      movie: m.movie_data,
      rating: activeTab === 'watchlist' ? m.want_to_see_rating : m.rating,
      addedAt: m.added_at || m.watched_at,
      watched: activeTab === 'watched'
    })) || []
  );

  const tabs = [
    { id: 'watchlist', label: 'Watchlist', icon: Heart, count: watchlist?.length || 0 },
    { id: 'watched', label: 'Watched', icon: Check, count: watched?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Movies</h1>
          <p className="text-gray-600 mt-1">Your personal movie collection</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <MovieFilters
            filters={filters}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            genres={genres}
            decades={decades}
          />
        </div>

        {/* Movies Grid/List */}
        <div className="p-6">
          {filteredMovies.length ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredMovies.map(({ movie, rating, addedAt, watched }) => (
                  <MovieCard
                    key={movie?.id}
                    movie={movie!}
                    rating={rating}
                    addedAt={addedAt}
                    watched={watched}
                    showQuickActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMovies.map(({ movie, rating, addedAt, watched }) => (
                  <div
                    key={movie?.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie?.poster_path}`}
                      alt={movie?.title}
                      className="w-12 h-18 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{movie?.title}</h3>
                      <p className="text-sm text-gray-500">
                        {movie?.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}
                      </p>
                    </div>
                    {rating && (
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {addedAt ? new Date(addedAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No movies in your {activeTab}</p>
              <p className="text-sm mt-1">
                {activeTab === 'watchlist' 
                  ? 'Add movies you want to watch'
                  : 'Mark movies as watched to see them here'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}