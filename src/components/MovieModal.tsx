import React, { useState } from 'react';
import { X, Star, Calendar, Clock, Users, Heart, Check, Plus, Play, Award, DollarSign } from 'lucide-react';
import type { MovieDetails } from '../lib/tmdb';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../lib/auth';

interface MovieModalProps {
  movie: MovieDetails;
  onClose: () => void;
}

export function MovieModal({ movie, onClose }: MovieModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  
  const {
    addToPersonalWatchlist,
    addToPersonal,
    addToShared,
    toggleWatched,
    rateMovie
  } = useWatchlist(user?.id || '');

  const handleAction = async (action: 'watchlist' | 'watched' | 'shared') => {
    try {
      switch (action) {
        case 'watchlist':
          await addToPersonalWatchlist.mutateAsync(movie);
          break;
        case 'watched':
          await addToPersonal.mutateAsync(movie);
          await toggleWatched.mutateAsync(movie);
          if (rating > 0) {
            await rateMovie.mutateAsync({ movieId: movie.id, rating });
          }
          break;
        case 'shared':
          await addToShared.mutateAsync(movie);
          break;
      }
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const trailer = movie.videos?.results.find(
    video => video.site === 'YouTube' && video.type === 'Trailer'
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-64 bg-gradient-to-b from-gray-900 to-gray-800">
          {movie.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-full object-cover opacity-40"
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-3xl font-bold text-white mb-2">{movie.title}</h1>
            <div className="flex items-center space-x-4 text-gray-300">
              <span>{movie.release_date?.split('-')[0]}</span>
              {movie.runtime && (
                <>
                  <span>•</span>
                  <span>{movie.runtime} min</span>
                </>
              )}
              {movie.vote_average && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAction('watchlist')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>Add to Watchlist</span>
            </button>
            
            <button
              onClick={() => setIsRating(!isRating)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Mark as Watched</span>
            </button>
            
            <button
              onClick={() => handleAction('shared')}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Add to Shared</span>
            </button>

            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Watch Trailer</span>
              </a>
            )}
          </div>

          {/* Rating Section */}
          {isRating && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Rate this movie</h3>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <button
                  onClick={() => handleAction('watched')}
                  className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  disabled={rating === 0}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Overview */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
            <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
          </div>

          {/* Genres */}
          {movie.genres?.length && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {movie.genres.map(genre => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {movie.director && (
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Director</div>
                  <div className="font-medium text-gray-900">{movie.director}</div>
                </div>
              </div>
            )}
            
            {movie.actors && (
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Cast</div>
                  <div className="font-medium text-gray-900">{movie.actors}</div>
                </div>
              </div>
            )}

            {movie.boxOffice && (
              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Box Office</div>
                  <div className="font-medium text-gray-900">{movie.boxOffice}</div>
                </div>
              </div>
            )}

            {movie.awards && (
              <div className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Awards</div>
                  <div className="font-medium text-gray-900">{movie.awards}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}