import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Sparkles, Star, Info, Plus, BookmarkCheck, X } from 'lucide-react';
import type { Movie } from '../lib/tmdb';
import { getRecommendedMovies } from '../lib/tmdb';
import { MovieModal } from './MovieModal';

interface MovieWithRating {
  movie: Movie;
  rating?: number;
}

function calculateMovieScore(movie: Movie, watchedMovies: MovieWithRating[]): number {
  let score = 0;

  // Get all highly rated movies (3.5+ stars)
  const highlyRated = watchedMovies.filter(m => m.rating && m.rating >= 3.5);
  
  // Calculate genre match score
  const genreMatches = highlyRated.filter(({ movie: watched }) =>
    movie.genres?.some(g => watched.genres?.some(wg => wg.id === g.id))
  );

  genreMatches.forEach(({ rating, movie: watched }) => {
    // Add score based on rating and recency
    const ratingScore = (rating || 0) * 0.2; // Scale rating to 0-1 range
    const monthsAgo = watched.release_date 
      ? (Date.now() - new Date(watched.release_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 0;
    const recencyBonus = Math.max(0, 1 - (monthsAgo / 12)); // Higher score for movies watched in last year
    
    score += ratingScore * (1 + recencyBonus);

    // Bonus for matching multiple genres
    const matchingGenres = movie.genres?.filter(g => 
      watched.genres?.some(wg => wg.id === g.id)
    ).length || 0;
    if (matchingGenres > 1) {
      score += matchingGenres * 0.2;
    }
  });

  // Director match bonus
  const directorMatch = highlyRated.find(({ movie: watched }) =>
    movie.director && watched.director === movie.director
  );
  if (directorMatch) {
    score += (directorMatch.rating || 0) * 0.3;
  }

  // Actor match bonus
  const actorMatches = highlyRated.filter(({ movie: watched }) => {
    const movieActors = new Set(movie.actors?.split(', '));
    const watchedActors = new Set(watched.actors?.split(', '));
    return Array.from(movieActors).some(actor => watchedActors.has(actor));
  });
  actorMatches.forEach(({ rating }) => {
    score += (rating || 0) * 0.2;
  });

  // Adjust score based on movie's own ratings
  if (movie.vote_average) {
    score *= (movie.vote_average / 10); // Scale down impact of TMDB rating
  }

  return score;
}

interface RecommendationReason {
  type: 'genre' | 'director' | 'actor' | 'similar';
  description: string;
}

function getRecommendationReason(movie: Movie, watchedMovies: MovieWithRating[]): RecommendationReason {
  // Find a highly rated movie with matching genres
  const genreMatch = watchedMovies.find(({ movie: watched, rating }) => {
    if (!rating || rating < 4) return false;
    return movie.genres?.some(g => watched.genres?.some(wg => wg.id === g.id));
  });

  if (genreMatch) {
    const matchingGenres = movie.genres?.filter(g => 
      genreMatch.movie.genres?.some(wg => wg.id === g.id)
    );
    return {
      type: 'genre',
      description: `Because you rated ${genreMatch.movie.title} highly, which shares the ${
        matchingGenres?.map(g => g.name.toLowerCase()).join(' and ')
      } genre${matchingGenres?.length === 1 ? '' : 's'}`
    };
  }

  // Check for same director
  const directorMatch = watchedMovies.find(({ movie: watched, rating }) => {
    if (!rating || rating < 4) return false;
    return movie.director && watched.director === movie.director;
  });

  if (directorMatch) {
    return {
      type: 'director',
      description: `From ${movie.director}, director of ${directorMatch.movie.title} which you rated highly`
    };
  }

  // Check for common actors
  const actorMatch = watchedMovies.find(({ movie: watched, rating }) => {
    if (!rating || rating < 4) return false;
    const movieActors = new Set(movie.actors?.split(', '));
    const watchedActors = new Set(watched.actors?.split(', '));
    return Array.from(movieActors).some(actor => watchedActors.has(actor));
  });

  if (actorMatch) {
    const commonActors = movie.actors?.split(', ')
      .filter(actor => actorMatch.movie.actors?.includes(actor));
    return {
      type: 'actor',
      description: `Starring ${commonActors?.[0]}, who you enjoyed in ${actorMatch.movie.title}`
    };
  }

  // Default to general similarity
  return {
    type: 'similar',
    description: 'Based on your watching history and ratings'
  };
}

export function MovieRecommendations({ 
  watchedMovies,
  onAddToPersonal,
  onAddToPersonalWatchlist,
  onAddToShared
}: {
  watchedMovies: MovieWithRating[];
  onAddToPersonal: (movie: Movie) => void;
  onAddToPersonalWatchlist: (movie: Movie) => void;
  onAddToShared: (movie: Movie) => void;
}) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [hiddenMovies, setHiddenMovies] = useState<Set<number>>(new Set());

  // Get movie IDs from movies rated 3.5+ stars
  const favoriteMovieIds = watchedMovies
    .filter(m => m.rating && m.rating >= 3.5)
    .map(m => m.movie.id);

  // Get IDs of all watched movies to exclude from recommendations
  const watchedMovieIds = watchedMovies.map(m => m.movie.id);

  // Get recommendations and sort by calculated score
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['movieRecommendations', favoriteMovieIds, watchedMovieIds],
    queryFn: async () => {
      const movies = await getRecommendedMovies(favoriteMovieIds, watchedMovieIds);
      
      // Calculate scores and sort
      return movies
        .map(movie => ({
          movie,
          score: calculateMovieScore(movie, watchedMovies)
        }))
        .sort((a, b) => b.score - a.score)
        .map(({ movie }) => movie);
    },
    enabled: favoriteMovieIds.length > 0,
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // Filter out hidden movies
  const visibleRecommendations = recommendations?.filter(
    movie => !hiddenMovies.has(movie.id)
  );

  if (watchedMovies.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-medium text-foreground mb-2">No Recommendations Yet</h2>
        <p className="text-muted-foreground">
          Add some movies to your personal list to get personalized recommendations.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-muted rounded-lg mb-4" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!visibleRecommendations?.length) {
    return (
      <div className="text-center py-12">
        <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-medium text-foreground mb-2">No More Recommendations</h2>
        <p className="text-muted-foreground">
          We've run out of recommendations based on your preferences.
          Try adding more movies to your list!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleRecommendations.map(movie => {
          const reason = getRecommendationReason(movie, watchedMovies);
          
          return (
            <div 
              key={movie.id}
              className="group relative bg-card rounded-lg overflow-hidden border transition-all hover:shadow-lg"
            >
              {/* Remove button */}
              <button
                onClick={() => setHiddenMovies(prev => new Set([...prev, movie.id]))}
                className="absolute top-2 right-2 z-10 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                title="Remove from recommendations"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Movie Poster */}
              <div className="aspect-[2/3] relative overflow-hidden">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Film className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-white/10 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Movie Info */}
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1 line-clamp-1">{movie.title}</h3>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                  {movie.release_date && (
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  )}
                  {movie.vote_average && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 flex-shrink-0 mt-1" />
                  <p className="line-clamp-2">{reason.description}</p>
                </div>

                {/* Action buttons */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => onAddToPersonalWatchlist(movie)}
                    className="w-full flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Watchlist</span>
                  </button>
                  <button
                    onClick={() => onAddToPersonal(movie)}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Add to Personal List</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAddToPersonal={() => onAddToPersonal(selectedMovie)}
          onAddToPersonalWatchlist={() => onAddToPersonalWatchlist(selectedMovie)}
          onAddToShared={() => onAddToShared(selectedMovie)}
        />
      )}
    </div>
  );
}