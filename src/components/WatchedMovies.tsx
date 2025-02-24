import React from 'react';
import { Film, User, Calendar, Star } from 'lucide-react';
import type { Movie } from '../lib/tmdb';
import { useAuth } from '../lib/auth';

interface WatchedMoviesProps {
  movies: Array<{
    id: string;
    movie_data: Movie;
    watched_at: string;
    user: {
      username: string;
      avatar_url: string;
    } | null;
    user_id: string;
    rating?: number;
  }>;
}

export function WatchedMovies({ movies }: WatchedMoviesProps) {
  const { getUsername } = useAuth();

  if (!movies?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No watched movies yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {movies.map(movie => (
        <div 
          key={movie.id}
          className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-sm"
        >
          {movie.movie_data.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.movie_data.poster_path}`}
              alt={movie.movie_data.title}
              className="w-16 h-24 object-cover rounded-lg shadow-sm"
            />
          ) : (
            <div className="w-16 h-24 bg-muted rounded-lg flex items-center justify-center">
              <Film className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">{movie.movie_data.title}</h3>
              {movie.rating && (
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{movie.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>
                  Watched by {movie.user?.username || getUsername(movie.user_id)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(movie.watched_at).toLocaleDateString('default', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {movie.movie_data.genres && (
              <div className="flex flex-wrap gap-2 mt-2">
                {movie.movie_data.genres.map(genre => (
                  <span
                    key={genre.id}
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}