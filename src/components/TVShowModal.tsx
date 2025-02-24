import React, { useState, useEffect, useRef } from 'react';
import { X, BookmarkCheck, Star, Tv, PlayCircle, Award, Users, Video, Trophy, Heart, ExternalLink, MessageSquare, Calendar } from 'lucide-react';
import type { TVShowDetails } from '../lib/tmdb';
import { useAuth } from '../lib/auth';

interface TVShowModalProps {
  show: TVShowDetails;
  onClose: () => void;
  onAddToPersonal: () => void;
  onAddToPersonalWatchlist: () => void;
  onAddToShared: () => void;
  error?: string | null;
  fromUser?: string;
}

export function TVShowModal({
  show,
  onClose,
  onAddToPersonal,
  onAddToPersonalWatchlist,
  onAddToShared,
  error,
  fromUser
}: TVShowModalProps) {
  const { getUsername } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  // Get trailer
  const trailer = show.videos?.results.find(
    video => video.site === 'YouTube' && video.type === 'Trailer'
  );

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
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
      >
        {/* Header with backdrop */}
        <div className="relative h-[300px] bg-gradient-to-b from-gray-900 to-gray-800">
          {show.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/original${show.poster_path}`}
              alt={show.name}
              className="w-full h-full object-cover opacity-40"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv className="w-20 h-20 text-gray-600" />
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <h2 className="text-3xl font-bold text-white">
              {show.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-gray-300 mt-2">
              <span>{show.first_air_date?.split('-')[0]}</span>
              {show.number_of_seasons > 0 && (
                <>
                  <span>•</span>
                  <span>{show.number_of_seasons} {show.number_of_seasons === 1 ? 'Season' : 'Seasons'}</span>
                </>
              )}
              {show.status && (
                <>
                  <span>•</span>
                  <span>{show.status}</span>
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

          {/* Overview */}
          <p className="text-gray-700 leading-relaxed">{show.overview}</p>

          {/* Networks */}
          {show.networks && show.networks.length > 0 && (
            <div className="flex items-start gap-3">
              <Tv className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <div className="text-sm text-gray-500">Networks</div>
                <div className="text-gray-900">
                  {show.networks.map(network => network.name).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Next Episode */}
          {show.next_episode_to_air && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <div className="text-sm text-gray-500">Next Episode</div>
                <div className="text-gray-900">
                  Season {show.next_episode_to_air.season_number}, 
                  Episode {show.next_episode_to_air.episode_number}:
                  {' '}{show.next_episode_to_air.name}
                  <div className="text-sm text-gray-500">
                    Airs on {new Date(show.next_episode_to_air.air_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Genres */}
          {show.genres && show.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {show.genres.map(genre => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {genre.name}
                </span>
              ))}
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