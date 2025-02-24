import React, { useState, useEffect, useRef } from 'react';
import { X, BookmarkCheck, Star, Film, PlayCircle, Award, DollarSign, Users, Video, Trophy, Heart, ExternalLink, MessageSquare } from 'lucide-react';
import type { MovieDetails } from '../lib/tmdb';
import { useAuth } from '../lib/auth';

interface MovieModalProps {
  movie: MovieDetails;
  onClose: () => void;
  onAddToPersonal: () => void;
  onAddToPersonalWatchlist: () => void;
  onAddToShared: () => void;
  error?: string | null;
  fromUser?: string;
}

function RatingBadge({ 
  rating, 
  source, 
  icon: Icon,
  url
}: { 
  rating: string | undefined;
  source: string;
  icon: React.ElementType;
  url?: string;
}) {
  if (!rating) return null;

  const content = (
    <div className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <Icon className="w-6 h-6 text-primary" />
      <div>
        <div className="text-lg font-bold">{rating}</div>
        <div className="text-sm text-gray-600">{source}</div>
      </div>
      {url && <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />}
    </div>
  );

  if (url) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}

export function MovieModal({
  movie,
  onClose,
  onAddToPersonal,
  onAddToPersonalWatchlist,
  onAddToShared,
  error,
  fromUser
}: MovieModalProps) {
  const { getUsername } = useAuth();
  const [showReviews, setShowReviews] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get trailer
  const trailer = movie.videos?.results.find(
    video => video.site === 'YouTube' && video.type === 'Trailer'
  );

  // Handle click position for animation
  useEffect(() => {
    const lastClick = sessionStorage.getItem('lastClickPosition');
    if (lastClick) {
      const { x, y } = JSON.parse(lastClick);
      const modal = document.getElementById('movie-modal-content');
      if (modal) {
        modal.style.transformOrigin = `${x}px ${y}px`;
      }
      sessionStorage.removeItem('lastClickPosition');
    }
  }, []);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        ref={modalRef}
        id="movie-modal-content"
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
      >
        {/* Header with backdrop */}
        <div className="relative h-[300px] bg-gradient-to-b from-gray-900 to-gray-800">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-full object-cover opacity-40"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-20 h-20 text-gray-600" />
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <a
              href={movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block group"
            >
              <h2 className="text-3xl font-bold text-white group-hover:text-primary transition-colors">
                {movie.title}
              </h2>
            </a>
            <div className="flex flex-wrap items-center gap-3 text-gray-300 mt-2">
              <span>{movie.release_date?.split('-')[0]}</span>
              {movie.runtime > 0 && (
                <>
                  <span>•</span>
                  <span>{movie.runtime} min</span>
                </>
              )}
              {movie.rated && (
                <>
                  <span>•</span>
                  <span>{movie.rated}</span>
                </>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full transition-colors shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User recommendation */}
          {fromUser && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <p className="text-violet-700">
                Recommended by {getUsername(fromUser)}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {/* Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RatingBadge
              rating={movie.imdbRating ? `${movie.imdbRating}/10` : undefined}
              source="IMDb"
              icon={Star}
              url={movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}` : undefined}
            />
            <RatingBadge
              rating={movie.metascore ? `${movie.metascore}/100` : undefined}
              source="Metacritic"
              icon={Award}
              url={movie.imdb_id ? `https://www.metacritic.com/movie/${movie.imdb_id}` : undefined}
            />
            <RatingBadge
              rating={movie.rottenTomatoesRating}
              source="Rotten Tomatoes"
              icon={Trophy}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4">
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Watch Trailer</span>
              </a>
            )}
            <button
              onClick={() => setShowReviews(true)}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Read Reviews</span>
            </button>
          </div>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map(genre => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Overview */}
          <p className="text-gray-700 leading-relaxed">{movie.overview}</p>

          {/* Cast & Crew */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {movie.director && (
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Director</div>
                  <div className="text-gray-900">{movie.director}</div>
                </div>
              </div>
            )}
            {movie.actors && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Cast</div>
                  <div className="text-gray-900">{movie.actors}</div>
                </div>
              </div>
            )}
          </div>

          {/* Awards & Box Office */}
          {(movie.awards || movie.boxOffice) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {movie.awards && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500">Awards</div>
                    <div className="text-gray-900">{movie.awards}</div>
                  </div>
                </div>
              )}
              {movie.boxOffice && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500">Box Office</div>
                    <div className="text-gray-900">{movie.boxOffice}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <button
              onClick={onAddToPersonal}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!error}
            >
              <BookmarkCheck className="w-5 h-5" />
              <span>Add to Personal List</span>
            </button>
            <button
              onClick={onAddToPersonalWatchlist}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!error}
            >
              <Heart className="w-5 h-5" />
              <span>Add to Watchlist</span>
            </button>
            <button
              onClick={onAddToShared}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!error}
            >
              <Users className="w-5 h-5" />
              <span>Add to Shared</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}