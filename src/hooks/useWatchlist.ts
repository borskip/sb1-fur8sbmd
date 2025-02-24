import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Movie } from '../lib/tmdb';

export function useWatchlist(userId: string) {
  const queryClient = useQueryClient();

  // Get personal list
  const { data: personalList } = useQuery({
    queryKey: ['personalList', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get personal list movies
      const { data: movies, error: moviesError } = await supabase
        .from('personal_watchlist')
        .select('*')
        .eq('user_id', userId)
        .is('want_to_see_rating', null);

      if (moviesError) throw moviesError;

      // Get watched status for each movie
      const { data: watchedMovies, error: watchedError } = await supabase
        .from('watched_movies')
        .select('movie_id')
        .eq('user_id', userId);

      if (watchedError) throw watchedError;

      // Get ratings for each movie
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('movie_id, rating')
        .eq('user_id', userId);

      if (ratingsError) throw ratingsError;

      // Create maps for efficient lookup
      const watchedMovieIds = new Set(watchedMovies?.map(m => m.movie_id));
      const ratingMap = new Map(ratings?.map(r => [r.movie_id, r.rating]));

      // Add watched status and ratings to each movie
      return movies?.map(movie => ({
        ...movie,
        watched: watchedMovieIds.has(movie.movie_id),
        rating: ratingMap.get(movie.movie_id)
      })) || [];
    },
    enabled: Boolean(userId)
  });

  // Get personal watchlist
  const { data: personalWatchlist } = useQuery({
    queryKey: ['personalWatchlist', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('personal_watchlist')
        .select('*')
        .eq('user_id', userId)
        .not('want_to_see_rating', 'is', null);

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(userId)
  });

  // Get watched movies with ratings
  const { data: watchedMovies } = useQuery({
    queryKey: ['watchedMovies'],
    queryFn: async () => {
      const { data: watched, error: watchedError } = await supabase
        .from('watched_movies')
        .select(`
          *,
          user:users!watched_movies_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .order('watched_at', { ascending: false })
        .limit(50);

      if (watchedError) throw watchedError;

      // Get ratings for watched movies
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('movie_id, rating');

      if (ratingsError) throw ratingsError;

      // Create a map of movie IDs to ratings
      const ratingMap = new Map(ratings?.map(r => [r.movie_id, r.rating]) || []);

      // Add ratings to watched movies
      return watched?.map(movie => ({
        ...movie,
        rating: ratingMap.get(movie.movie_id)
      })) || [];
    }
  });

  // Get all want to see ratings for shared list
  const { data: allWantToSeeRatings } = useQuery({
    queryKey: ['allWantToSeeRatings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_watchlist')
        .select('movie_id, want_to_see_rating, user_id')
        .not('want_to_see_rating', 'is', null);

      if (error) throw error;
      return data || [];
    }
  });

  // Get shared watchlist
  const { data: sharedWatchlist } = useQuery({
    queryKey: ['sharedWatchlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_watchlist')
        .select(`
          *,
          users!shared_watchlist_added_by_fkey (
            username,
            avatar_url
          )
        `);

      if (error) throw error;

      // Calculate average want to see rating for each movie
      return (data || []).map(movie => {
        const ratings = allWantToSeeRatings?.filter(r => r.movie_id === movie.movie_id) || [];
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.want_to_see_rating || 0), 0) / ratings.length
          : null;
        
        const userRating = ratings.find(r => r.user_id === userId)?.want_to_see_rating;
        
        return {
          ...movie,
          averageWantToSeeRating: averageRating,
          userWantToSeeRating: userRating,
          voteCount: ratings.length
        };
      });
    },
    enabled: Boolean(allWantToSeeRatings)
  });

  // Get ratings
  const { data: ratings } = useQuery({
    queryKey: ['ratings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(userId)
  });

  // Add to personal list
  const addToPersonal = useMutation({
    mutationFn: async (movie: Movie) => {
      if (!userId) throw new Error('No user selected');

      // Check if movie already exists in personal list (without want_to_see_rating)
      const { data: existing } = await supabase
        .from('personal_watchlist')
        .select('*')
        .eq('user_id', userId)
        .eq('movie_id', movie.id)
        .is('want_to_see_rating', null);

      if (existing && existing.length > 0) {
        throw new Error('Movie already in your personal list');
      }

      const { data, error } = await supabase
        .from('personal_watchlist')
        .insert({
          user_id: userId,
          movie_id: movie.id,
          movie_data: movie
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalList', userId] });
    },
  });

  // Add to personal watchlist
  const addToPersonalWatchlist = useMutation({
    mutationFn: async (movie: Movie) => {
      if (!userId) throw new Error('No user selected');

      // Check if movie already exists in watchlist (with want_to_see_rating)
      const { data: existing } = await supabase
        .from('personal_watchlist')
        .select('*')
        .eq('user_id', userId)
        .eq('movie_id', movie.id)
        .not('want_to_see_rating', 'is', null);

      if (existing && existing.length > 0) {
        throw new Error('Movie already in your watchlist');
      }

      const { data, error } = await supabase
        .from('personal_watchlist')
        .insert({
          user_id: userId,
          movie_id: movie.id,
          want_to_see_rating: 5.0, // Default rating
          movie_data: movie
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalWatchlist', userId] });
      queryClient.invalidateQueries({ queryKey: ['allWantToSeeRatings'] });
      queryClient.invalidateQueries({ queryKey: ['sharedWatchlist'] });
    },
  });

  // Add to shared watchlist
  const addToShared = useMutation({
    mutationFn: async (movie: Movie) => {
      if (!userId) throw new Error('No user selected');

      // Check if movie already exists in shared watchlist
      const { data: existing } = await supabase
        .from('shared_watchlist')
        .select('*')
        .eq('movie_id', movie.id);

      if (existing && existing.length > 0) {
        throw new Error('Movie already in shared watchlist');
      }

      const { data, error } = await supabase
        .from('shared_watchlist')
        .insert({
          movie_id: movie.id,
          added_by: userId,
          movie_data: movie
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedWatchlist'] });
    },
  });

  // Rate movie
  const rateMovie = useMutation({
    mutationFn: async ({ movieId, rating }: { movieId: number; rating: number }) => {
      if (!userId) throw new Error('No user selected');
      
      // Convert rating to a decimal with one decimal place
      const normalizedRating = parseFloat(rating.toFixed(1));
      
      // Ensure rating is between 1 and 5
      const clampedRating = Math.min(5, Math.max(1, normalizedRating));
      
      // First check if a rating exists
      const { data: existingRatings } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('movie_id', movieId);

      if (existingRatings && existingRatings.length > 0) {
        // Update existing rating
        const { data, error } = await supabase
          .from('ratings')
          .update({ rating: clampedRating })
          .eq('id', existingRatings[0].id)
          .select();

        if (error) throw error;
        return data;
      } else {
        // Insert new rating
        const { data, error } = await supabase
          .from('ratings')
          .insert({
            user_id: userId,
            movie_id: movieId,
            rating: clampedRating
          })
          .select();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings', userId] });
      queryClient.invalidateQueries({ queryKey: ['watchedMovies'] });
    },
  });

  // Rate want to see
  const rateWantToSee = useMutation({
    mutationFn: async ({ movieId, rating }: { movieId: number; rating: number }) => {
      if (!userId) throw new Error('No user selected');
      
      // Convert rating to a decimal with one decimal place
      const normalizedRating = parseFloat(rating.toFixed(1));
      
      // Ensure rating is between 1.0 and 10.0
      const clampedRating = Math.min(10.0, Math.max(1.0, normalizedRating));
      
      // Check if the user already has a watchlist entry for this movie
      const { data: existingEntries, error: queryError } = await supabase
        .from('personal_watchlist')
        .select('id, movie_data')
        .eq('user_id', userId)
        .eq('movie_id', movieId);

      if (queryError) throw queryError;

      // Get the movie data from shared watchlist if we need to create a new entry
      let movieData;
      if (!existingEntries?.length) {
        const { data: sharedMovie } = await supabase
          .from('shared_watchlist')
          .select('movie_data')
          .eq('movie_id', movieId)
          .single();
        
        movieData = sharedMovie?.movie_data;
      }

      if (existingEntries?.length) {
        // Update existing entry
        const { data, error } = await supabase
          .from('personal_watchlist')
          .update({ want_to_see_rating: clampedRating })
          .eq('id', existingEntries[0].id)
          .select();

        if (error) throw error;
        return data;
      } else if (movieData) {
        // Create new entry with movie data from shared watchlist
        const { data, error } = await supabase
          .from('personal_watchlist')
          .insert({
            user_id: userId,
            movie_id: movieId,
            want_to_see_rating: clampedRating,
            movie_data: movieData
          })
          .select();

        if (error) throw error;
        return data;
      } else {
        throw new Error('Movie not found in shared watchlist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalWatchlist', userId] });
      queryClient.invalidateQueries({ queryKey: ['allWantToSeeRatings'] });
      queryClient.invalidateQueries({ queryKey: ['sharedWatchlist'] });
    },
  });

  // Schedule movie
  const scheduleMovie = useMutation({
    mutationFn: async ({ movieId, date }: { movieId: number; date: string }) => {
      if (!userId) throw new Error('No user selected');
      
      // Ensure we have a valid date
      const scheduledDate = new Date(date);
      if (isNaN(scheduledDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Set time to noon to avoid timezone issues
      scheduledDate.setHours(12, 0, 0, 0);

      const { data, error } = await supabase
        .from('shared_watchlist')
        .update({ scheduled_for: scheduledDate.toISOString() })
        .eq('movie_id', movieId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedWatchlist'] });
    },
  });

  // Toggle watched status
  const toggleWatched = useMutation({
    mutationFn: async (movie: Movie) => {
      if (!userId) throw new Error('No user selected');

      // Check if movie is already marked as watched
      const { data: existing } = await supabase
        .from('watched_movies')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movie.id);

      if (existing?.length) {
        // Remove from watched movies
        const { error } = await supabase
          .from('watched_movies')
          .delete()
          .eq('id', existing[0].id);

        if (error) throw error;
      } else {
        // Add to watched movies
        const { error } = await supabase
          .from('watched_movies')
          .insert({
            user_id: userId,
            movie_id: movie.id,
            movie_data: movie
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalList', userId] });
      queryClient.invalidateQueries({ queryKey: ['watchedMovies'] });
    },
  });

  // Remove from personal list
  const removeFromPersonal = useMutation({
    mutationFn: async (movieId: number) => {
      if (!userId) throw new Error('No user selected');

      // Start a batch of operations
      const batch = [];

      // 1. Remove from personal watchlist
      batch.push(
        supabase
          .from('personal_watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('movie_id', movieId)
      );

      // 2. Remove any ratings
      batch.push(
        supabase
          .from('ratings')
          .delete()
          .eq('user_id', userId)
          .eq('movie_id', movieId)
      );

      // 3. Remove from watched movies
      batch.push(
        supabase
          .from('watched_movies')
          .delete()
          .eq('user_id', userId)
          .eq('movie_id', movieId)
      );

      // Execute all operations
      const results = await Promise.all(batch);

      // Check for errors
      const errors = results.filter(r => r.error).map(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to remove movie: ${errors.map(e => e.message).join(', ')}`);
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['personalList', userId] });
      queryClient.invalidateQueries({ queryKey: ['personalWatchlist', userId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', userId] });
      queryClient.invalidateQueries({ queryKey: ['watchedMovies'] });
    },
  });

  // Remove from shared list
  const removeFromShared = useMutation({
    mutationFn: async (movieId: number) => {
      if (!userId) throw new Error('No user selected');

      // Start a batch of operations
      const batch = [];

      // 1. Remove from shared watchlist
      batch.push(
        supabase
          .from('shared_watchlist')
          .delete()
          .eq('movie_id', movieId)
      );

      // 2. Remove any want-to-see ratings from all users' personal watchlists
      batch.push(
        supabase
          .from('personal_watchlist')
          .delete()
          .eq('movie_id', movieId)
          .not('want_to_see_rating', 'is', null)
      );

      // Execute all operations
      const results = await Promise.all(batch);

      // Check for errors
      const errors = results.filter(r => r.error).map(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to remove movie: ${errors.map(e => e.message).join(', ')}`);
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['sharedWatchlist'] });
      queryClient.invalidateQueries({ queryKey: ['personalWatchlist'] });
      queryClient.invalidateQueries({ queryKey: ['allWantToSeeRatings'] });
    },
  });

  return {
    personalList,
    personalWatchlist,
    sharedWatchlist,
    watchedMovies,
    ratings,
    addToPersonal,
    addToPersonalWatchlist,
    addToShared,
    removeFromPersonal,
    removeFromShared,
    rateMovie,
    rateWantToSee,
    scheduleMovie,
    toggleWatched,
  };
}