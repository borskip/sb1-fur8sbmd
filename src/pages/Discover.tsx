import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, Calendar, Award, Sparkles, Filter } from 'lucide-react';
import { searchMovies, getNowPlayingMovies, getUpcomingMovies, getMostAnticipatedMovies } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import { SearchBar } from '../components/SearchBar';
import { MovieModal } from '../components/MovieModal';
import { useDebouncedCallback } from 'use-debounce';
import type { Movie, MovieDetails } from '../lib/tmdb';

export function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'now-playing' | 'upcoming' | 'anticipated'>('trending');

  const debouncedSearch = useDebouncedCallback(setSearchQuery, 300);

  // Search results
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['movieSearch', searchQuery],
    queryFn: () => searchMovies(searchQuery),
    enabled: searchQuery.length > 2,
  });

  // Now playing movies
  const { data: nowPlaying, isLoading: isLoadingNowPlaying } = useQuery({
    queryKey: ['nowPlaying'],
    queryFn: getNowPlayingMovies,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Upcoming movies
  const { data: upcoming, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcoming'],
    queryFn: () => getUpcomingMovies(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Most anticipated
  const { data: anticipated, isLoading: isLoadingAnticipated } = useQuery({
    queryKey: ['anticipated'],
    queryFn: getMostAnticipatedMovies,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const tabs = [
    { id: 'now-playing', label: 'Now Playing', icon: TrendingUp, data: nowPlaying, loading: isLoadingNowPlaying },
    { id: 'upcoming', label: 'Coming Soon', icon: Calendar, data: upcoming, loading: isLoadingUpcoming },
    { id: 'anticipated', label: 'Most Anticipated', icon: Award, data: anticipated, loading: isLoadingAnticipated },
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discover Movies</h1>
          <p className="text-gray-600 mt-1">Find your next favorite film</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <SearchBar
          onSearch={debouncedSearch}
          placeholder="Search for movies, actors, directors..."
          isLoading={isSearching}
        />

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Search Results for "{searchQuery}"
            </h3>
            {isSearching ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-gray-200 rounded-lg mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : searchResults?.movies.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.movies.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => setSelectedMovie(movie)}
                    showQuickActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No movies found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Browse Categories */}
      {!searchQuery && (
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tab Navigation */}
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
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {currentTab.loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-gray-200 rounded-lg mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : currentTab.data?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {currentTab.data.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => setSelectedMovie(movie)}
                    showQuickActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <currentTab.icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No movies available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}