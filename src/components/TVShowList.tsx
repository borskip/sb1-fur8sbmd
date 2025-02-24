import React, { useState } from 'react';
import { Film, Star, Calendar, Edit2, ChevronDown, ChevronRight, UserPlus, Check, Trash2, Plus, GripVertical, Tv } from 'lucide-react';
import type { TVShow } from '../lib/tmdb';
import { useAuth } from '../lib/auth';
import { TVShowModal } from './TVShowModal';
import { MovieFilters } from './MovieFilters';
import { useMovieFilters } from '../hooks/useMovieFilters';

interface TVShowListProps {
  title: string;
  description?: string;
  shows: Array<{
    show: TVShow | null;
    rating?: number;
    averageRating?: number;
    voteCount?: number;
    addedBy?: string;
    watched?: boolean;
  }>;
  onRate?: (showId: number, rating: number) => void;
  onAddToShared?: (show: TVShow) => void;
  onRemove?: (showId: number) => void;
  onToggleWatched?: (show: TVShow) => Promise<void>;
  isShared?: boolean;
  ratingLabel?: string;
  showFilters?: boolean;
}

export function TVShowList({
  title,
  description,
  shows,
  onRate,
  onAddToShared,
  onRemove,
  onToggleWatched,
  isShared,
  ratingLabel = "Rating",
  showFilters = false
}: TVShowListProps) {
  const { user } = useAuth();
  const [selectedShow, setSelectedShow] = useState<TVShow | null>(null);
  
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredMovies: filteredShows,
    genres,
    decades,
    hasActiveFilters
  } = useMovieFilters(shows.map(s => ({
    movie: s.show ? {
      ...s.show,
      title: s.show.name,
      release_date: s.show.first_air_date
    } : null,
    rating: s.rating,
    addedAt: undefined,
    watched: s.watched
  })));

  if (!shows?.length) {
    return (
      <div className="text-center py-12">
        <Tv className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-medium text-foreground mb-2">No TV Shows Yet</h2>
        <p className="text-muted-foreground">
          Start adding TV shows to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {showFilters && (
        <div className="mb-6">
          <MovieFilters
            filters={filters}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            genres={genres}
            decades={decades}
          />
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredShows.map(({ movie: show, rating, averageRating, voteCount, addedBy, watched }) => {
          if (!show) return null;
          
          const showRemoveButton = isShared || (!isShared && addedBy === user?.id);
          const showRating = isShared ? !rating : true;

          return (
            <div
              key={show.id}
              className="flex flex-col bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-start p-3">
                <div className="flex-1 flex items-start space-x-3">
                  {show.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                      alt={show.name}
                      className="w-16 h-24 object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Tv className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 
                          className="font-medium text-gray-900 line-clamp-2 hover:text-primary cursor-pointer"
                          onClick={() => setSelectedShow(show)}
                        >
                          {show.name}
                        </h3>
                        {show.first_air_date && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {new Date(show.first_air_date).getFullYear()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {onToggleWatched && (
                          <button
                            onClick={() => onToggleWatched(show)}
                            className={`p-1 rounded-full transition-colors ${
                              watched
                                ? 'bg-green-100 text-green-600'
                                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            }`}
                            title={watched ? 'Watched' : 'Mark as watched'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onAddToShared && (
                          <button
                            onClick={() => onAddToShared(show)}
                            className="p-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full"
                            title="Add to shared watchlist"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onRemove && showRemoveButton && (
                          <button
                            onClick={() => onRemove(show.id)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ratings section */}
                    <div className="mt-2 space-y-1">
                      {onRate && showRating && (
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <div className="text-sm">
                            {rating ? rating.toFixed(1) : 'Not rated'} {ratingLabel && `(${ratingLabel})`}
                          </div>
                        </div>
                      )}
                      {averageRating !== null && averageRating !== undefined && voteCount > 0 && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{Number(averageRating).toFixed(1)} average</span>
                          <span>•</span>
                          <span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                        </div>
                      )}
                    </div>

                    {show.genres && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {show.genres.map(genre => (
                          <span
                            key={genre.id}
                            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedShow && (
        <TVShowModal
          show={selectedShow}
          onClose={() => setSelectedShow(null)}
          onAddToPersonal={() => {}}
          onAddToPersonalWatchlist={() => {}}
          onAddToShared={onAddToShared}
        />
      )}
    </div>
  );
}