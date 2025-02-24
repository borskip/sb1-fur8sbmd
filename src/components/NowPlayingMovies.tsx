import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, ChevronLeft, ChevronRight, Clock, AlertCircle, Star, Award } from 'lucide-react';
import { getNowPlayingMovies, getMovieDetails } from '../lib/tmdb';
import type { Movie } from '../lib/tmdb';

export function NowPlayingMovies() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: movies, isLoading, error } = useQuery({
    queryKey: ['nowPlayingMovies'],
    queryFn: async () => {
      const movies = await getNowPlayingMovies();
      
      // Deduplicate movies by ID
      const uniqueMovies = Array.from(
        new Map(movies.map(movie => [movie.id, movie])).values()
      );
      
      // Get IMDb IDs for each movie
      const moviesWithImdbIds = await Promise.all(
        uniqueMovies.map(async (movie) => {
          try {
            const details = await getMovieDetails(movie.id);
            return {
              ...movie,
              imdb_id: details.imdb_id,
              imdbRating: details.imdbRating,
              metascore: details.metascore
            };
          } catch (error) {
            console.error(`Failed to get details for movie ${movie.id}:`, error);
            return movie;
          }
        })
      );
      return moviesWithImdbIds;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
        <div className="flex space-x-4 overflow-x-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={`skeleton-${i}`} className="flex-none w-64 space-y-4">
              <div className="aspect-[2/3] bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 md:p-6 mb-8">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load movies currently playing in theaters</p>
        </div>
      </div>
    );
  }

  if (!movies?.length) {
    return (
      <div className="card p-4 md:p-6 mb-8">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Film className="w-5 h-5" />
          <p>No movies currently playing in theaters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 md:p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Film className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Now Playing in Theaters</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {movies.map(movie => (
          <div 
            key={`now-playing-${movie.id}`}
            className="flex-none w-48 group relative"
            style={{ scrollSnapAlign: 'start' }}
          >
            <a 
              href={movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center">
                  <Film className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <div className="mt-3 space-y-2">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {movie.title}
                </h3>

                {movie.runtime && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{movie.runtime} min</span>
                  </div>
                )}

                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {movie.genres.map(genre => (
                      <span 
                        key={`genre-${movie.id}-${genre.id}`}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  {movie.imdbRating && (
                    <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-muted-foreground">IMDb: {movie.imdbRating}</span>
                    </div>
                  )}
                  {movie.metascore && (
                    <div className="flex items-center text-sm">
                      <Award className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-muted-foreground">Metacritic: {movie.metascore}</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}