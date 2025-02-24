import React from 'react';
import { Film, Calendar } from 'lucide-react';
import type { Movie } from '../lib/tmdb';

interface ScheduleDashboardProps {
  movies: Array<{
    movie: Movie;
    scheduledFor?: string | null;
    averageRating?: number | null;
    voteCount?: number;
  }>;
}

export function ScheduleDashboard({ movies }: ScheduleDashboardProps) {
  // Only include movies that have a valid scheduledFor date
  const scheduledMovies = movies.filter(m => m.scheduledFor && m.movie);
  
  if (scheduledMovies.length === 0) {
    return null;
  }

  // Group movies by month
  const moviesByMonth = scheduledMovies.reduce((acc, movie) => {
    if (!movie.scheduledFor) return acc;
    
    const date = new Date(movie.scheduledFor);
    const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push({
      ...movie,
      date: date.toLocaleDateString('default', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    });
    
    return acc;
  }, {} as Record<string, any[]>);

  // Sort months chronologically
  const sortedMonths = Object.keys(moviesByMonth).sort((a, b) => {
    const dateA = new Date(moviesByMonth[a][0].scheduledFor);
    const dateB = new Date(moviesByMonth[b][0].scheduledFor);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="card p-4 md:p-6 mb-8">
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Movie Schedule</h2>
      </div>
      
      <div className="space-y-8">
        {sortedMonths.map(month => (
          <div key={month}>
            <h3 className="text-lg font-medium text-foreground mb-4">{month}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {moviesByMonth[month]
                .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
                .map(movie => (
                  <div 
                    key={movie.movie.id} 
                    className="movie-card p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      {movie.movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.movie.poster_path}`}
                          alt={movie.movie.title}
                          className="w-16 h-24 object-cover rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-muted rounded-lg flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground line-clamp-2">{movie.movie.title}</h4>
                        <p className="text-sm text-primary mt-1">{movie.date}</p>
                        {typeof movie.averageRating === 'number' && typeof movie.voteCount === 'number' && (
                          <div className="text-sm text-muted-foreground mt-2">
                            Rating: {movie.averageRating.toFixed(1)} / 10
                            <br />
                            {movie.voteCount} {movie.voteCount === 1 ? 'vote' : 'votes'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}