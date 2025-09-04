import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Star, Heart, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export function RecentActivity() {
  const { user, getUsername } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const [watched, ratings, watchlist] = await Promise.all([
        supabase
          .from('watched_movies')
          .select('*, movie_data')
          .gte('watched_at', sevenDaysAgo.toISOString())
          .order('watched_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('ratings')
          .select('*')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('personal_watchlist')
          .select('*')
          .not('want_to_see_rating', 'is', null)
          .gte('added_at', sevenDaysAgo.toISOString())
          .order('added_at', { ascending: false })
          .limit(10)
      ]);

      // Combine and sort all activities
      const allActivities = [
        ...(watched.data || []).map(item => ({
          type: 'watched' as const,
          user_id: item.user_id,
          movie: item.movie_data,
          timestamp: item.watched_at,
          id: `watched-${item.id}`
        })),
        ...(ratings.data || []).map(item => ({
          type: 'rated' as const,
          user_id: item.user_id,
          movie: { id: item.movie_id, title: `Movie ${item.movie_id}` }, // Simplified for now
          rating: item.rating,
          timestamp: item.created_at,
          id: `rated-${item.id}`
        })),
        ...(watchlist.data || []).map(item => ({
          type: 'added' as const,
          user_id: item.user_id,
          movie: item.movie_data,
          timestamp: item.added_at,
          id: `added-${item.id}`
        }))
      ];

      return allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);
    }
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'watched': return <Film className="w-4 h-4 text-green-500" />;
      case 'rated': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'added': return <Heart className="w-4 h-4 text-blue-500" />;
      default: return <Film className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    const username = getUsername(activity.user_id);
    switch (activity.type) {
      case 'watched':
        return `${username} watched ${activity.movie.title}`;
      case 'rated':
        return `${username} rated ${activity.movie.title} ${activity.rating}/5`;
      case 'added':
        return `${username} added ${activity.movie.title} to watchlist`;
      default:
        return '';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = (now.getTime() - time.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities?.length ? (
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}