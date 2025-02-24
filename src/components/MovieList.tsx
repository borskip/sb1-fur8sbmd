import React, { useState, useEffect, useMemo } from 'react';
import { Film, Star, StarHalf, Calendar, Edit2, ChevronDown, ChevronRight, UserPlus, Check, Trash2, Plus, GripVertical } from 'lucide-react';
import type { Movie } from '../lib/tmdb';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { MovieModal } from './MovieModal';
import { MovieFilters } from './MovieFilters';
import { useMovieFilters } from '../hooks/useMovieFilters';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function StarRating({ 
  value = 0, 
  max = 5, 
  onChange, 
  readonly = false,
  showEmpty = true,
  hideIfRated = false,
  size = 14,
  compact = false,
  label = ''
}: { 
  value?: number; 
  max?: number;
  onChange: (value: number) => void; 
  readonly?: boolean;
  showEmpty?: boolean;
  hideIfRated?: boolean;
  size?: number;
  compact?: boolean;
  label?: string;
}) {
  if (hideIfRated && value) return null;
  if (!showEmpty && !value) return null;

  const roundedValue = Math.round((value || 0) * 2) / 2;

  return (
    <div className="flex items-center space-x-2">
      {label && <span className="text-sm text-gray-500">{label}:</span>}
      <div className="flex items-center space-x-0.5">
        {[...Array(max)].map((_, i) => {
          const starValue = i + 1;
          const filled = roundedValue >= starValue;
          const halfFilled = roundedValue === starValue - 0.5;
          
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation(); // Prevent click from bubbling up
                if (!readonly) onChange(starValue);
              }}
              className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} 
                transition-transform focus:outline-none ${compact ? 'p-0.5' : 'p-1'}`}
              disabled={readonly}
            >
              {filled ? (
                <Star 
                  size={size} 
                  className="text-yellow-400 fill-yellow-400" 
                />
              ) : halfFilled ? (
                <StarHalf 
                  size={size} 
                  className="text-yellow-400 fill-yellow-400" 
                />
              ) : (
                <Star 
                  size={size} 
                  className="text-gray-300" 
                />
              )}
            </button>
          );
        })}
      </div>
      {value > 0 && (
        <span className="text-sm text-gray-500">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface SortableMovieCardProps {
  movie: Movie;
  rating?: number;
  averageRating?: number | null;
  voteCount?: number;
  watched?: boolean;
  onRate?: (movieId: number, rating: number) => void;
  onAddToShared?: (movie: Movie) => void;
  onRemove?: (movieId: number) => void;
  onToggleWatched?: (movie: Movie) => Promise<void>;
  showRemoveButton?: boolean;
  showRating?: boolean;
  isPersonalList?: boolean;
  isDragging?: boolean;
  ratingLabel?: string;
}

function SortableMovieCard({
  movie,
  rating,
  averageRating,
  voteCount = 0,
  watched,
  onRate,
  onAddToShared,
  onRemove,
  onToggleWatched,
  showRemoveButton,
  showRating,
  isPersonalList,
  isDragging,
  ratingLabel
}: SortableMovieCardProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: movie.id });

  const handleMovieClick = (event: React.MouseEvent, target: 'title' | 'card') => {
    if (target === 'title') {
      sessionStorage.setItem('lastClickPosition', JSON.stringify({
        x: event.clientX,
        y: event.clientY
      }));
      setSelectedMovie(movie);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex items-start p-3">
        {isPersonalList && (
          <button
            className="mt-2 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 flex items-start space-x-3">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
              className="w-16 h-24 object-cover rounded-lg shadow-sm"
            />
          ) : (
            <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 
                  className="font-medium text-gray-900 line-clamp-2 hover:text-primary cursor-pointer"
                  onClick={(e) => handleMovieClick(e, 'title')}
                >
                  {movie.title}
                </h3>
                {movie.release_date && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-1 ml-2">
                {onToggleWatched && (
                  <button
                    onClick={() => onToggleWatched(movie)}
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
                    onClick={() => onAddToShared(movie)}
                    className="p-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full"
                    title="Add to shared watchlist"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
                {onRemove && showRemoveButton && (
                  <button
                    onClick={() => onRemove(movie.id)}
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
                <StarRating
                  value={rating}
                  max={5}
                  onChange={(value) => onRate(movie.id, value)}
                  showEmpty={true}
                  compact={true}
                  label={ratingLabel || "Rating"}
                />
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

            {movie.genres && (
              <div className="flex flex-wrap gap-1 mt-2">
                {movie.genres.map(genre => (
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

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAddToPersonal={() => {}}
          onAddToPersonalWatchlist={() => {}}
          onAddToShared={onAddToShared}
        />
      )}
    </div>
  );
}

interface MovieListProps {
  title: string;
  description?: string;
  movies: Array<{
    movie: Movie | null;
    rating?: number;
    averageRating?: number;
    voteCount?: number;
    scheduledFor?: string;
    addedBy?: string;
    watched?: boolean;
  }>;
  onRate?: (movieId: number, rating: number) => void;
  onSchedule?: (movieId: number, date: string) => void;
  onAddToShared?: (movie: Movie) => void;
  onRemove?: (movieId: number) => void;
  onToggleWatched?: (movie: Movie) => Promise<void>;
  isShared?: boolean;
  ratingLabel?: string;
  showFilters?: boolean;
}

export function MovieList({
  title,
  description,
  movies,
  onRate,
  onSchedule,
  onAddToShared,
  onRemove,
  onToggleWatched,
  isShared,
  ratingLabel = "Rating",
  showFilters = false
}: MovieListProps) {
  const { user } = useAuth();
  const [manualOrder, setManualOrder] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredMovies,
    genres,
    decades,
    hasActiveFilters
  } = useMovieFilters(movies);

  // Initialize manual order when movies change
  useEffect(() => {
    const movieIds = movies
      .filter(m => m.movie?.id)
      .map(m => m.movie!.id);
    if (manualOrder.length === 0) {
      setManualOrder(movieIds);
    }
  }, [movies]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!hasActiveFilters) {
      setActiveId(event.active.id as number);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && !hasActiveFilters) {
      setManualOrder((items) => {
        const oldIndex = items.indexOf(active.id as number);
        const newIndex = items.indexOf(over.id as number);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Sort movies based on filters or manual order
  const sortedMovies = useMemo(() => {
    if (isShared || hasActiveFilters) {
      return filteredMovies;
    }

    // For personal list with no filters, maintain manual order
    return filteredMovies.sort((a, b) => {
      if (!a.movie || !b.movie) return 0;
      const aIndex = manualOrder.indexOf(a.movie.id);
      const bIndex = manualOrder.indexOf(b.movie.id);
      if (aIndex === -1 || bIndex === -1) return 0;
      return aIndex - bIndex;
    });
  }, [filteredMovies, manualOrder, isShared, hasActiveFilters]);

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
          {!isShared && !hasActiveFilters && (
            <p className="text-sm text-gray-500 mt-2">
              Tip: You can drag and drop movies to reorder them when no filters are active
            </p>
          )}
        </div>
      )}

      {!isShared ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={manualOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {sortedMovies.map(({ movie, rating, averageRating, voteCount, addedBy, watched }) => {
                if (!movie) return null;
                
                const showRemoveButton = isShared || (!isShared && addedBy === user?.id);
                const showRating = isShared ? !rating : true;

                return (
                  <SortableMovieCard
                    key={movie.id}
                    movie={movie}
                    rating={rating}
                    averageRating={averageRating}
                    voteCount={voteCount}
                    watched={watched}
                    onRate={onRate}
                    onAddToShared={onAddToShared}
                    onRemove={onRemove}
                    onToggleWatched={onToggleWatched}
                    showRemoveButton={showRemoveButton}
                    showRating={showRating}
                    isPersonalList={!isShared && !hasActiveFilters}
                    isDragging={movie.id === activeId}
                    ratingLabel={ratingLabel}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedMovies.map(({ movie, rating, averageRating, voteCount, addedBy, watched }) => {
            if (!movie) return null;
            
            const showRemoveButton = isShared || (!isShared && addedBy === user?.id);
            const showRating = isShared ? !rating : true;

            return (
              <SortableMovieCard
                key={movie.id}
                movie={movie}
                rating={rating}
                averageRating={averageRating}
                voteCount={voteCount}
                watched={watched}
                onRate={onRate}
                onAddToShared={onAddToShared}
                onRemove={onRemove}
                onToggleWatched={onToggleWatched}
                showRemoveButton={showRemoveButton}
                showRating={showRating}
                isPersonalList={false}
                ratingLabel={ratingLabel}
              />
            );
          })}
        </div>
      )}

      {filteredMovies.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No movies found matching your filters</p>
        </div>
      )}
    </div>
  );
}