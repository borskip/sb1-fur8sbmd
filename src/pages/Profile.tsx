import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Star, Calendar, TrendingUp, Award, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { StatCard } from '../components/StatCard';
import { GenreChart } from '../components/GenreChart';
import { WatchingHistory } from '../components/WatchingHistory';

export function Profile() {
  const { user } = useAuth();

  // Get comprehensive user stats
  const { data: profileData } = useQuery({
    queryKey: ['profileData', user?.id],
    queryFn: async () => {
      const [watched, ratings, watchlist] = await Promise.all([
        supabase
          .from('watched_movies')
          .select('*')
          .eq('user_id', user!.id),
        
        supabase
          .from('ratings')
          .select('*')
          .eq('user_id', user!.id),
        
        supabase
          .from('personal_watchlist')
          .select('*')
          .eq('user_id', user!.id)
          .not('want_to_see_rating', 'is', null)
      ]);

      if (watched.error) throw watched.error;
      if (ratings.error) throw ratings.error;
      if (watchlist.error) throw watchlist.error;

      // Calculate stats
      const watchedMovies = watched.data || [];
      const userRatings = ratings.data || [];
      const userWatchlist = watchlist.data || [];

      // Genre analysis
      const genreStats = new Map<string, { count: number; totalRating: number; avgRating: number }>();
      watchedMovies.forEach(movie => {
        const rating = userRatings.find(r => r.movie_id === movie.movie_id)?.rating || 0;
        movie.movie_data.genres?.forEach((genre: any) => {
          const current = genreStats.get(genre.name) || { count: 0, totalRating: 0, avgRating: 0 };
          genreStats.set(genre.name, {
            count: current.count + 1,
            totalRating: current.totalRating + rating,
            avgRating: (current.totalRating + rating) / (current.count + 1)
          });
        });
      });

      // Top genres
      const topGenres = Array.from(genreStats.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, stats]) => ({ name, ...stats }));

      // Calculate averages
      const avgRating = userRatings.length 
        ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length
        : 0;

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = watchedMovies.filter(
        movie => new Date(movie.watched_at) > thirtyDaysAgo
      ).length;

      // Watching streak
      const sortedWatched = watchedMovies
        .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
      
      let currentStreak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const movie of sortedWatched) {
        const watchedDate = new Date(movie.watched_at);
        watchedDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - watchedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= currentStreak + 1) {
          currentStreak = Math.max(currentStreak, daysDiff + 1);
        } else {
          break;
        }
      }

      return {
        totalWatched: watchedMovies.length,
        totalRatings: userRatings.length,
        watchlistCount: userWatchlist.length,
        avgRating,
        recentActivity,
        currentStreak,
        topGenres,
        watchedMovies: watchedMovies.slice(0, 10) // Recent 10 for history
      };
    },
    enabled: Boolean(user)
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-16 h-16 rounded-full ring-4 ring-blue-100"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-gray-600">Movie enthusiast since 2024</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Film}
          title="Movies Watched"
          value={profileData?.totalWatched || 0}
          subtitle="Total films"
          color="blue"
        />
        <StatCard
          icon={Star}
          title="Average Rating"
          value={profileData?.avgRating ? profileData.avgRating.toFixed(1) : '0.0'}
          subtitle="Out of 5 stars"
          color="yellow"
        />
        <StatCard
          icon={Heart}
          title="Watchlist"
          value={profileData?.watchlistCount || 0}
          subtitle="Movies to watch"
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          title="This Month"
          value={profileData?.recentActivity || 0}
          subtitle="Movies watched"
          color="green"
        />
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Favorite Genres</h2>
          {profileData?.topGenres?.length ? (
            <GenreChart genres={profileData.topGenres} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Watch more movies to see your genre preferences</p>
            </div>
          )}
        </div>

        {/* Watching History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          {profileData?.watchedMovies?.length ? (
            <WatchingHistory movies={profileData.watchedMovies} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            (profileData?.totalWatched || 0) >= 10 
              ? 'border-yellow-200 bg-yellow-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                (profileData?.totalWatched || 0) >= 10 
                  ? 'bg-yellow-200 text-yellow-700' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Movie Buff</h3>
                <p className="text-sm text-gray-600">Watch 10 movies</p>
                <p className="text-xs text-gray-500">
                  {profileData?.totalWatched || 0}/10
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            (profileData?.avgRating || 0) >= 4 
              ? 'border-yellow-200 bg-yellow-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                (profileData?.avgRating || 0) >= 4 
                  ? 'bg-yellow-200 text-yellow-700' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">High Standards</h3>
                <p className="text-sm text-gray-600">4+ average rating</p>
                <p className="text-xs text-gray-500">
                  {profileData?.avgRating?.toFixed(1) || '0.0'}/5.0
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            (profileData?.currentStreak || 0) >= 7 
              ? 'border-yellow-200 bg-yellow-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                (profileData?.currentStreak || 0) >= 7 
                  ? 'bg-yellow-200 text-yellow-700' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Weekly Watcher</h3>
                <p className="text-sm text-gray-600">7-day streak</p>
                <p className="text-xs text-gray-500">
                  {profileData?.currentStreak || 0} days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}