import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Film } from 'lucide-react';
import { getRecommendedMovies } from '../lib/tmdb';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { MovieCard } from './MovieCard';

export function PersonalizedRecommendations() {
  const { user } = useAuth();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['personalizedRecommendations', user?.id],
    queryFn: async () => {
      // Get user's highly rated movies
      const { data: ratings } = await supabase
        .from('ratings')
        .select('movie_id, rating')
        .eq('user_id', user!.id)
        .gte('rating', 4.0);

      if (!ratings?.length) return [];

      // Get watched movie IDs to exclude
      const { data: watched } = await supabase
        .from('watched_movies')
        .select('movie_id')
        .eq('user_id', user!.id);

      const watchedIds = watched?.map(w => w.movie_id) || [];
      const favoriteIds = ratings.map(r => r.movie_id);

      // Get recommendations
      const recommendations = await getRecommendedMovies(favoriteIds, watchedIds);
      return recommendations.slice(0, 6);
    },
    enabled: Boolean(user)
  });

  if (!recommendations?.length && !isLoading) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-200 rounded-lg mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : recommendations?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recommendations.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              showQuickActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Rate some movies to get personalized recommendations</p>
        </div>
      )}
    </div>
  );
}