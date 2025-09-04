import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Clock, Star, TrendingUp, Calendar, Users, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { MovieCard } from '../components/MovieCard';
import { StatCard } from '../components/StatCard';
import { RecentActivity } from '../components/RecentActivity';
import { UpcomingSchedule } from '../components/UpcomingSchedule';
import { PersonalizedRecommendations } from '../components/PersonalizedRecommendations';

export function Dashboard() {
  const { user } = useAuth();

  // Get user stats
  const { data: stats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      const [watchedCount, watchlistCount, avgRating, recentActivity] = await Promise.all([
        // Watched movies count
        supabase
          .from('watched_movies')
          .select('id', { count: 'exact' })
          .eq('user_id', user!.id),
        
        // Watchlist count
        supabase
          .from('personal_watchlist')
          .select('id', { count: 'exact' })
          .eq('user_id', user!.id)
          .not('want_to_see_rating', 'is', null),
        
        // Average rating
        supabase
          .from('ratings')
          .select('rating')
          .eq('user_id', user!.id),
        
        // Recent activity count (last 7 days)
        supabase
          .from('watched_movies')
          .select('id', { count: 'exact' })
          .eq('user_id', user!.id)
          .gte('watched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const avgRatingValue = avgRating.data?.length 
        ? avgRating.data.reduce((sum, r) => sum + r.rating, 0) / avgRating.data.length
        : 0;

      return {
        watchedCount: watchedCount.count || 0,
        watchlistCount: watchlistCount.count || 0,
        avgRating: avgRatingValue,
        recentActivity: recentActivity.count || 0
      };
    },
    enabled: Boolean(user)
  });

  // Get recently watched movies
  const { data: recentlyWatched } = useQuery({
    queryKey: ['recentlyWatched', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watched_movies')
        .select('*')
        .eq('user_id', user!.id)
        .order('watched_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(user)
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Your movie watching overview</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Film}
          title="Movies Watched"
          value={stats?.watchedCount || 0}
          subtitle="Total films"
          color="blue"
        />
        <StatCard
          icon={Clock}
          title="Watchlist"
          value={stats?.watchlistCount || 0}
          subtitle="To watch"
          color="purple"
        />
        <StatCard
          icon={Star}
          title="Avg Rating"
          value={stats?.avgRating ? stats.avgRating.toFixed(1) : '0.0'}
          subtitle="Out of 5"
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          title="This Week"
          value={stats?.recentActivity || 0}
          subtitle="Movies watched"
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recently Watched */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recently Watched</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            {recentlyWatched?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {recentlyWatched.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie.movie_data}
                    size="small"
                    showRating={true}
                    watchedAt={movie.watched_at}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No movies watched yet</p>
                <p className="text-sm mt-1">Start tracking your movie watching!</p>
              </div>
            )}
          </div>

          <PersonalizedRecommendations />
        </div>

        {/* Right Column - Activity & Schedule */}
        <div className="space-y-6">
          <RecentActivity />
          <UpcomingSchedule />
        </div>
      </div>
    </div>
  );
}