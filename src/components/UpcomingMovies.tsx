import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, ChevronLeft, ChevronRight, Star, Award, Clapperboard } from 'lucide-react';
import { getUpcomingMovies, getMostAnticipatedMovies, getUpcomingArthouseMovies } from '../lib/tmdb';
import type { Movie } from '../lib/tmdb';
import { useAuth } from '../lib/auth';

function MovieRow({ 
  title, 
  icon: Icon, 
  movies, 
  isLoading 
}: { 
  title: string; 
  icon: React.ElementType; 
  movies?: Movie[]; 
  isLoading: boolean;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
            <div key={i} className="flex-none w-48 space-y-4">
              <div className="aspect-[2/3] bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!movies?.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">{title}</h2>
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
            key={movie.id} 
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
              
              <div className="mt-3">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {movie.title}
                </h3>
                {movie.release_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(movie.release_date).toLocaleDateString('default', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UpcomingMovies() {
  const { user } = useAuth();
  
  const { data: recommendedMovies, isLoading: isLoadingRecommended } = useQuery({
    queryKey: ['upcomingMovies', user?.id],
    queryFn: () => getUpcomingMovies(user?.id),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: anticipatedMovies, isLoading: isLoadingAnticipated } = useQuery({
    queryKey: ['anticipatedMovies'],
    queryFn: getMostAnticipatedMovies,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: arthouseMovies, isLoading: isLoadingArthouse } = useQuery({
    queryKey: ['arthouseMovies'],
    queryFn: getUpcomingArthouseMovies,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return (
    <>
      <MovieRow
        title={user ? 'Recommended Upcoming Movies' : 'Coming Soon to Theaters'}
        icon={Film}
        movies={recommendedMovies}
        isLoading={isLoadingRecommended}
      />
      
      <MovieRow
        title="Most Anticipated Movies This Year"
        icon={Star}
        movies={anticipatedMovies}
        isLoading={isLoadingAnticipated}
      />
      
      <MovieRow
        title="Upcoming Arthouse Movies"
        icon={Clapperboard}
        movies={arthouseMovies}
        isLoading={isLoadingArthouse}
      />
    </>
  );
}