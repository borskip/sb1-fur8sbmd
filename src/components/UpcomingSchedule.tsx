import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Film, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function UpcomingSchedule() {
  const { data: scheduledMovies, isLoading } = useQuery({
    queryKey: ['upcomingSchedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_watchlist')
        .select('*')
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">Upcoming Schedule</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-12 h-18 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : scheduledMovies?.length ? (
        <div className="space-y-4">
          {scheduledMovies.map(movie => (
            <div key={movie.id} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <img
                src={`https://image.tmdb.org/t/p/w92${movie.movie_data.poster_path}`}
                alt={movie.movie_data.title}
                className="w-12 h-18 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {movie.movie_data.title}
                </h3>
                <p className="text-sm text-purple-600">
                  {new Date(movie.scheduled_for).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No scheduled movies</p>
          <p className="text-sm mt-1">Schedule movies with friends!</p>
        </div>
      )}
    </div>
  );
}