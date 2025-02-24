import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, User, Film, ChevronLeft, ChevronRight, Tv } from 'lucide-react';
import { searchMovies, searchTVShows, getMovieDetails, getTVShowDetails, type Movie, type MovieDetails, type TVShow, type TVShowDetails } from '../lib/tmdb';
import { useQuery } from '@tanstack/react-query';
import { MovieModal } from './MovieModal';
import { TVShowModal } from './TVShowModal';
import { useDebouncedCallback } from 'use-debounce';

interface MovieSearchProps {
  onMovieSelect: (movie: Movie) => void;
  onAddToPersonal: (movie: Movie) => void;
  onAddToShared: (movie: Movie) => void;
  mediaType?: 'movies' | 'tv';
}

export function MovieSearch({ onMovieSelect, onAddToPersonal, onAddToShared, mediaType = 'movies' }: MovieSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [selectedShow, setSelectedShow] = useState<TVShowDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedSetQuery = useDebouncedCallback(
    (value: string) => {
      setQuery(value);
      setShowResults(value.length > 2);
    },
    300
  );

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['mediaSearch', mediaType, query],
    queryFn: () => mediaType === 'movies' ? searchMovies(query) : searchTVShows(query),
    enabled: query.length > 2,
  });

  // Handle click outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key to close results
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMovieClick = useCallback(async (movie: Movie) => {
    try {
      const details = await getMovieDetails(movie.id);
      setSelectedMovie(details);
      setError(null);
      setShowResults(false); // Hide search results when movie is selected
    } catch (err) {
      console.error('Failed to get movie details:', err);
      setError('Failed to load movie details');
    }
  }, []);

  const handleShowClick = useCallback(async (show: TVShow) => {
    try {
      const details = await getTVShowDetails(show.id);
      setSelectedShow(details);
      setError(null);
      setShowResults(false); // Hide search results when show is selected
    } catch (err) {
      console.error('Failed to get show details:', err);
      setError('Failed to load show details');
    }
  }, []);

  const handleAddToPersonal = async (movie: Movie) => {
    try {
      await onAddToPersonal(movie);
      setSelectedMovie(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add movie');
    }
  };

  const handleAddToPersonalWatchlist = async (movie: Movie) => {
    try {
      await onMovieSelect(movie);
      setSelectedMovie(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add movie');
    }
  };

  const handleAddToShared = async (movie: Movie) => {
    try {
      await onAddToShared(movie);
      setSelectedMovie(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add movie');
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Get the appropriate media items based on type
  const mediaItems = mediaType === 'movies' 
    ? searchResults?.movies || []
    : searchResults?.shows || [];

  const showPersonInfo = searchResults?.person && mediaItems.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto relative" ref={searchContainerRef}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <input
          ref={inputRef}
          type="text"
          onChange={(e) => debouncedSetQuery(e.target.value)}
          onFocus={() => query.length > 2 && setShowResults(true)}
          placeholder={mediaType === 'movies' 
            ? "Search movies, actors, or years..." 
            : "Search TV shows, actors, or years..."}
          className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg text-sm"
        />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}
      
      {/* Search results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          {/* Loading state */}
          {isLoading && query.length > 2 && (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-start space-x-3">
                  <div className="w-14 h-20 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Person info */}
          {showPersonInfo && (
            <div className="p-4 bg-violet-50 rounded-t-lg flex items-center space-x-4">
              {searchResults.person.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${searchResults.person.profile_path}`}
                  alt={searchResults.person.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-violet-400" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-violet-900">{searchResults.person.name}</h3>
                <p className="text-sm text-violet-700">
                  Known for: {searchResults.person.known_for_department}
                </p>
                <p className="text-sm text-violet-600">
                  Showing {mediaItems.length} most recent {mediaType === 'movies' ? 'movies' : 'TV shows'}
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {mediaItems.length > 0 && (
            <div className="relative">
              {/* Scroll buttons */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={() => scroll('left')}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={() => scroll('right')}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Results container */}
              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide"
                style={{ 
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <div className="inline-flex space-x-4 px-8 py-4 min-w-full">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => mediaType === 'movies' 
                        ? handleMovieClick(item as Movie)
                        : handleShowClick(item as TVShow)
                      }
                      className="flex-none w-[300px] bg-white border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className="flex space-x-4">
                        {item.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                            alt={mediaType === 'movies' ? (item as Movie).title : (item as TVShow).name}
                            className="w-16 h-24 object-cover rounded-lg shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            {mediaType === 'movies' ? (
                              <Film className="w-6 h-6 text-gray-400" />
                            ) : (
                              <Tv className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 line-clamp-1">
                            {mediaType === 'movies' ? (item as Movie).title : (item as TVShow).name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {mediaType === 'movies' 
                              ? (item as Movie).release_date?.split('-')[0]
                              : (item as TVShow).first_air_date?.split('-')[0]
                            }
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {item.overview}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No results */}
          {!isLoading && query.length > 2 && mediaItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {mediaType === 'movies' ? (
                <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
              ) : (
                <Tv className="w-12 h-12 mx-auto mb-4 opacity-50" />
              )}
              <p>No {mediaType === 'movies' ? 'movies' : 'TV shows'} found matching your search</p>
            </div>
          )}
        </div>
      )}

      {/* Movie modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => {
            setSelectedMovie(null);
            setError(null);
          }}
          onAddToPersonal={() => handleAddToPersonal(selectedMovie)}
          onAddToPersonalWatchlist={() => handleAddToPersonalWatchlist(selectedMovie)}
          onAddToShared={() => handleAddToShared(selectedMovie)}
          error={error}
        />
      )}

      {/* TV Show modal */}
      {selectedShow && (
        <TVShowModal
          show={selectedShow}
          onClose={() => {
            setSelectedShow(null);
            setError(null);
          }}
          onAddToPersonal={() => {}}
          onAddToPersonalWatchlist={() => {}}
          onAddToShared={() => {}}
          error={error}
        />
      )}
    </div>
  );
}