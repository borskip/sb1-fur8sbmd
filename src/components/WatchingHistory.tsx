import React from 'react';
import { Film, Star, Calendar } from 'lucide-react';

interface WatchingHistoryProps {
  movies: Array<{
    movie_data: any;
    watched_at: string;
    rating?: number;
  }>;
}

export function WatchingHistory({ movies }: WatchingHistoryProps) {
  return (
    <div className="space-y-3">
      {movies.map((movie, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <img
            src={`https://image.tmdb.org/t/p/w92${movie.movie_data.poster_path}`}
            alt={movie.movie_data.title}
            className="w-10 h-15 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {movie.movie_data.title}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(movie.watched_at).toLocaleDateString()}</span>
              {movie.rating && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-current text-yellow-400" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}