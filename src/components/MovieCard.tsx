import React, { useState } from 'react';
import { Star, Clock, Calendar, Plus, Check, Heart, MoreHorizontal, Film } from 'lucide-react';
import type { Movie } from '../lib/tmdb';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../lib/auth';

interface MovieCardProps {
  movie: Movie;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  showQuickActions?: boolean;
  showRating?: boolean;
  rating?: number;
  addedAt?: string;
  watchedAt?: string;
  watched?: boolean;
}

export function MovieCard({
  movie,
  size = 'medium',
  onClick,
  showQuickActions = false,
  showRating = false,
  rating,
  addedAt,
  watchedAt,
  watched = false
}: MovieCardProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    addToPersonalWatchlist,
    addToPersonal,
    toggleWatched,
    rateMovie
  } = useWatchlist(user?.id || '');

  const sizeClasses = {
    small: 'w-32',
    medium: 'w-40',
    large: 'w-48'
  };

  const handleQuickAction = async (action: 'watchlist' | 'watched' | 'rate') => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    try {
      switch (action) {
        case 'watchlist':
          await addToPersonalWatchlist.mutateAsync(movie);
          break;
        case 'watched':
          await toggleWatched.mutateAsync(movie);
          break;
        case 'rate':
          // Open rating modal or quick rate
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    } finally {
      setIsLoading(false);
      setShowActions(false);
    }
  };

  return (
    <div className={`${sizeClasses[size]} group relative`}>
      {/* Movie Poster */}
      <div 
        className="aspect-[2/3] relative overflow-hidden rounded-lg shadow-md cursor-pointer transition-transform group-hover:scale-105"
        onClick={onClick}
      >
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Film className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Overlay with quick actions */}
        {showQuickActions && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAction('watchlist');
                }}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                title="Add to Watchlist"
                disabled={isLoading}
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAction('watched');
                }}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                title="Mark as Watched"
                disabled={isLoading}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Rating badge */}
        {showRating && rating && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
            <Star className="w-3 h-3 fill-current text-yellow-400" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Watched indicator */}
        {watched && (
          <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded-full">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
          {movie.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
          </span>
          {movie.vote_average && (
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-current text-yellow-400" />
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Additional metadata */}
        {(addedAt || watchedAt) && (
          <div className="text-xs text-gray-400">
            {watchedAt ? (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Watched {new Date(watchedAt).toLocaleDateString()}</span>
              </div>
            ) : addedAt ? (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Added {new Date(addedAt).toLocaleDateString()}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}