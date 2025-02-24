import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Star, Calendar, Plus, ListPlus, Users, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Movie } from '../lib/tmdb';

interface Activity {
  id: string;
  type: 'watched' | 'rated' | 'added_personal' | 'added_watchlist' | 'added_shared' | 'scheduled';
  user_id: string;
  movie_data: Movie;
  created_at: string;
  rating?: number;
  scheduled_for?: string;
}

function ActivityIcon({ type }: { type: Activity['type'] }) {
  switch (type) {
    case 'watched':
      return <Film className="w-5 h-5 text-green-500" />;
    case 'rated':
      return <Star className="w-5 h-5 text-yellow-500" />;
    case 'added_personal':
      return <ListPlus className="w-5 h-5 text-blue-500" />;
    case 'added_watchlist':
      return <Plus className="w-5 h-5 text-indigo-500" />;
    case 'added_shared':
      return <Users className="w-5 h-5 text-violet-500" />;
    case 'scheduled':
      return <Calendar className="w-5 h-5 text-pink-500" />;
    default:
      return null;
  }
}

function formatRelativeTime(date: string) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInHours = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInHours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return activityDate.toLocaleDateString();
  }
}

function ActivityItem({ activity, username }: { activity: Activity; username: string }) {
  if (!activity.movie_data) return null;

  let message = '';
  switch (activity.type) {
    case 'watched':
      message = `watched ${activity.movie_data.title}`;
      break;
    case 'rated':
      message = `rated ${activity.movie_data.title} ${activity.rating}/5 stars`;
      break;
    case 'added_personal':
      message = `added ${activity.movie_data.title} to their personal list`;
      break;
    case 'added_watchlist':
      message = `added ${activity.movie_data.title} to their watchlist`;
      break;
    case 'added_shared':
      message = `added ${activity.movie_data.title} to the shared watchlist`;
      break;
    case 'scheduled':
      message = `scheduled ${activity.movie_data.title} for ${
        new Date(activity.scheduled_for!).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })
      }`;
      break;
  }

  return (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <ActivityIcon type={activity.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <p className="text-sm">
            <span className="font-medium text-primary">{username}</span>
            {' '}
            <span className="text-gray-900">{message}</span>
          </p>
          <time className="text-xs text-gray-500 whitespace-nowrap ml-4">
            {formatRelativeTime(activity.created_at)}
          </time>
        </div>
        <div className="mt-2 flex items-center space-x-3">
          {activity.movie_data.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${activity.movie_data.poster_path}`}
              alt={activity.movie_data.title}
              className="w-12 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center">
              <Film className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {activity.movie_data.title}
            </h4>
            {activity.movie_data.release_date && (
              <p className="text-xs text-gray-500">
                {new Date(activity.movie_data.release_date).getFullYear()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeeklyActivity() {
  const { getUsername } = useAuth();
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ['weeklyActivities'],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Get activities from different tables
      const [
        watchedMovies,
        personalList,
        personalWatchlist,
        sharedWatchlist,
        ratings
      ] = await Promise.all([
        // Watched movies
        supabase
          .from('watched_movies')
          .select('*')
          .gte('created_at', oneWeekAgo.toISOString())
          .order('created_at', { ascending: false }),
        
        // Personal list additions
        supabase
          .from('personal_watchlist')
          .select('*')
          .is('want_to_see_rating', null)
          .gte('added_at', oneWeekAgo.toISOString())
          .order('added_at', { ascending: false }),
        
        // Personal watchlist additions
        supabase
          .from('personal_watchlist')
          .select('*')
          .not('want_to_see_rating', 'is', null)
          .gte('added_at', oneWeekAgo.toISOString())
          .order('added_at', { ascending: false }),
        
        // Shared watchlist activities
        supabase
          .from('shared_watchlist')
          .select('*')
          .gte('added_at', oneWeekAgo.toISOString())
          .order('added_at', { ascending: false }),

        // Ratings (get movie data from personal_watchlist in a separate step)
        supabase
          .from('ratings')
          .select('*')
          .gte('created_at', oneWeekAgo.toISOString())
          .order('created_at', { ascending: false })
      ]);

      // Get movie data for ratings from personal_watchlist
      const ratingMovies = ratings.data?.length ? await supabase
        .from('personal_watchlist')
        .select('movie_id, movie_data')
        .in('movie_id', ratings.data.map(r => r.movie_id))
        .is('want_to_see_rating', null) : { data: [] };

      // Create a map of movie_id to movie_data for ratings
      const movieDataMap = new Map(
        ratingMovies.data?.map(m => [m.movie_id, m.movie_data]) || []
      );

      // Transform and combine activities
      const allActivities: Activity[] = [
        // Watched movies
        ...(watchedMovies.data || []).map(movie => ({
          id: `watched-${movie.id}`,
          type: 'watched' as const,
          user_id: movie.user_id,
          movie_data: movie.movie_data,
          created_at: movie.created_at
        })),
        
        // Ratings (only include those with movie data)
        ...(ratings.data || [])
          .filter(rating => movieDataMap.has(rating.movie_id))
          .map(rating => ({
            id: `rating-${rating.id}`,
            type: 'rated' as const,
            user_id: rating.user_id,
            movie_data: movieDataMap.get(rating.movie_id)!,
            rating: rating.rating,
            created_at: rating.created_at
          })),
        
        // Personal list additions
        ...(personalList.data || []).map(movie => ({
          id: `personal-${movie.id}`,
          type: 'added_personal' as const,
          user_id: movie.user_id,
          movie_data: movie.movie_data,
          created_at: movie.added_at
        })),
        
        // Personal watchlist additions
        ...(personalWatchlist.data || []).map(movie => ({
          id: `watchlist-${movie.id}`,
          type: 'added_watchlist' as const,
          user_id: movie.user_id,
          movie_data: movie.movie_data,
          created_at: movie.added_at
        })),
        
        // Shared watchlist activities
        ...(sharedWatchlist.data || []).map(movie => ({
          id: `shared-${movie.id}`,
          type: movie.scheduled_for ? 'scheduled' as const : 'added_shared' as const,
          user_id: movie.added_by,
          movie_data: movie.movie_data,
          created_at: movie.added_at,
          scheduled_for: movie.scheduled_for
        }))
      ];

      // Sort by date
      return allActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">This Week's Activity</h2>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="animate-pulse p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-start space-x-4">
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 bg-gray-200 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">This Week's Activity</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activity this week</p>
          <p className="text-sm mt-2">
            Start adding and rating movies to see them here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">This Week's Activity</h2>
      </div>
      <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2 space-y-2">
        {activities.map(activity => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            username={getUsername(activity.user_id)}
          />
        ))}
      </div>
    </div>
  );
}