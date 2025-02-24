import { supabase } from '../lib/supabase';
import { getMovieDetails } from '../lib/tmdb';

export async function addMovieFromExtension(movieId: string, source: 'imdb' | 'tmdb') {
  try {
    // If it's an IMDB ID, we need to search TMDB first
    let tmdbId = source === 'tmdb' ? parseInt(movieId) : null;
    
    if (!tmdbId) {
      // TODO: Add IMDB to TMDB ID conversion
      // For now, return error for IMDB IDs
      throw new Error('IMDB IDs not supported yet');
    }

    // Get movie details from TMDB
    const movieDetails = await getMovieDetails(tmdbId);

    // Add to shared watchlist
    const { data, error } = await supabase
      .from('shared_watchlist')
      .insert({
        movie_id: tmdbId,
        movie_data: movieDetails
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to add movie:', error);
    throw error;
  }
}