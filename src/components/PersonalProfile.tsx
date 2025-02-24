import React, { useMemo } from 'react';
import { Film, Star, User, Clock, Award, TrendingUp, Heart } from 'lucide-react';
import type { Movie } from '../lib/tmdb';

interface MovieWithRating {
  movie: Movie;
  rating?: number;
}

function analyzeMovies(movies: MovieWithRating[]) {
  const validMovies = movies.filter(m => m.movie && m.rating);
  
  // Get favorite genres
  const genreRatings = new Map<string, { total: number; count: number }>();
  validMovies.forEach(({ movie, rating }) => {
    movie.genres?.forEach(genre => {
      const current = genreRatings.get(genre.name) || { total: 0, count: 0 };
      genreRatings.set(genre.name, {
        total: current.total + (rating || 0),
        count: current.count + 1
      });
    });
  });

  const favoriteGenres = Array.from(genreRatings.entries())
    .map(([genre, { total, count }]) => ({
      name: genre,
      averageRating: total / count,
      count
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3);

  // Get favorite actors and directors
  const actorRatings = new Map<string, { total: number; count: number; movies: string[] }>();
  const directorRatings = new Map<string, { total: number; count: number; movies: string[] }>();

  validMovies.forEach(({ movie, rating }) => {
    if (movie.actors) {
      movie.actors.split(', ').forEach(actor => {
        const current = actorRatings.get(actor) || { total: 0, count: 0, movies: [] };
        actorRatings.set(actor, {
          total: current.total + (rating || 0),
          count: current.count + 1,
          movies: [...current.movies, movie.title]
        });
      });
    }

    if (movie.director) {
      movie.director.split(', ').forEach(director => {
        const current = directorRatings.get(director) || { total: 0, count: 0, movies: [] };
        directorRatings.set(director, {
          total: current.total + (rating || 0),
          count: current.count + 1,
          movies: [...current.movies, movie.title]
        });
      });
    }
  });

  const favoriteActors = Array.from(actorRatings.entries())
    .filter(([_, { count }]) => count >= 2) // At least 2 movies
    .map(([name, { total, count, movies }]) => ({
      name,
      averageRating: total / count,
      count,
      movies
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3);

  const favoriteDirectors = Array.from(directorRatings.entries())
    .filter(([_, { count }]) => count >= 2) // At least 2 movies
    .map(([name, { total, count, movies }]) => ({
      name,
      averageRating: total / count,
      count,
      movies
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3);

  // Get watching patterns
  const decades = new Map<string, number>();
  validMovies.forEach(({ movie }) => {
    if (movie.release_date) {
      const year = new Date(movie.release_date).getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      decades.set(decade, (decades.get(decade) || 0) + 1);
    }
  });

  const favoriteDecades = Array.from(decades.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  // Calculate average rating
  const averageRating = validMovies.length > 0
    ? validMovies.reduce((sum, { rating }) => sum + (rating || 0), 0) / validMovies.length
    : 0;

  return {
    favoriteGenres,
    favoriteActors,
    favoriteDirectors,
    favoriteDecades,
    averageRating,
    totalMovies: validMovies.length
  };
}

function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  subtext 
}: { 
  icon: React.ElementType; 
  title: string; 
  value: string | number; 
  subtext?: string;
}) {
  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && (
        <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
}

export function PersonalProfile({ movies }: { movies: MovieWithRating[] }) {
  const analysis = useMemo(() => analyzeMovies(movies), [movies]);

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-medium text-foreground mb-2">No Movies Yet</h2>
        <p className="text-muted-foreground">
          Start adding movies to your personal list to see insights about your taste in movies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Film}
          title="Movies Watched"
          value={analysis.totalMovies}
          subtext="in your personal list"
        />
        <StatCard
          icon={Star}
          title="Average Rating"
          value={analysis.averageRating.toFixed(1)}
          subtext="out of 5 stars"
        />
        <StatCard
          icon={Clock}
          title="Favorite Era"
          value={analysis.favoriteDecades[0]?.[0] || 'N/A'}
          subtext={`${analysis.favoriteDecades[0]?.[1] || 0} movies from this decade`}
        />
      </div>

      {/* Favorite Genres */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Favorite Genres</h2>
        </div>
        <div className="space-y-4">
          {analysis.favoriteGenres.map(genre => (
            <div key={genre.name} className="flex items-center justify-between">
              <span className="font-medium">{genre.name}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {genre.count} movies
                </span>
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-medium">{genre.averageRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite Directors */}
      {analysis.favoriteDirectors.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Favorite Directors</h2>
          </div>
          <div className="space-y-6">
            {analysis.favoriteDirectors.map(director => (
              <div key={director.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{director.name}</span>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{director.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notable movies: {director.movies.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Actors */}
      {analysis.favoriteActors.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Favorite Actors</h2>
          </div>
          <div className="space-y-6">
            {analysis.favoriteActors.map(actor => (
              <div key={actor.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{actor.name}</span>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{actor.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notable movies: {actor.movies.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watching Trends */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Movie Watching Trends</h2>
        </div>
        <div className="prose prose-sm">
          <p className="text-muted-foreground">
            You tend to watch movies from the {analysis.favoriteDecades[0]?.[0] || 'recent'} era, 
            with a particular interest in {analysis.favoriteGenres[0]?.name.toLowerCase()} and {analysis.favoriteGenres[1]?.name.toLowerCase()} films. 
            {analysis.favoriteDirectors.length > 0 && ` You seem to enjoy the work of ${analysis.favoriteDirectors[0].name}, 
            having rated their films an average of ${analysis.favoriteDirectors[0].averageRating.toFixed(1)} stars.`}
          </p>
        </div>
      </div>
    </div>
  );
}