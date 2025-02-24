import { supabase } from './supabase';
import type { Movie, TVShow } from './tmdb';

// Movie-related functions (existing code)...

// TV Show functions
export async function addTVShowToPersonal(userId: string, show: TVShow) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .insert({
      user_id: userId,
      show_id: show.id,
      show_data: show,
      shared: false
    });

  if (error) throw error;
  return data;
}

export async function addTVShowToPersonalWatchlist(userId: string, show: TVShow) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .insert({
      user_id: userId,
      show_id: show.id,
      show_data: show,
      want_to_see_rating: 5.0, // Default rating
      shared: false
    });

  if (error) throw error;
  return data;
}

export async function addTVShowToShared(userId: string, show: TVShow) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .insert({
      user_id: userId,
      show_id: show.id,
      show_data: show,
      shared: true
    });

  if (error) throw error;
  return data;
}

export async function rateTVShow(userId: string, showId: number, rating: number) {
  const { data, error } = await supabase
    .from('tv_ratings')
    .upsert({
      user_id: userId,
      show_id: showId,
      rating: Math.min(5, Math.max(1, Math.round(rating * 10) / 10))
    });

  if (error) throw error;
  return data;
}

export async function rateTVShowWantToSee(userId: string, showId: number, rating: number) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .update({ want_to_see_rating: Math.min(10, Math.max(1, Math.round(rating * 10) / 10)) })
    .eq('user_id', userId)
    .eq('show_id', showId);

  if (error) throw error;
  return data;
}

export async function scheduleTVShow(showId: number, date: string) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .update({ scheduled_for: date })
    .eq('show_id', showId)
    .eq('shared', true);

  if (error) throw error;
  return data;
}

export async function getTVShowList(userId: string) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .select('*')
    .eq('user_id', userId)
    .eq('shared', false)
    .is('want_to_see_rating', null);

  if (error) throw error;
  return data;
}

export async function getTVShowWatchlist(userId: string) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .select('*')
    .eq('user_id', userId)
    .eq('shared', false)
    .not('want_to_see_rating', 'is', null);

  if (error) throw error;
  return data;
}

export async function getSharedTVShowWatchlist() {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .select(`
      *,
      users:user_id (
        username,
        avatar_url
      )
    `)
    .eq('shared', true);

  if (error) throw error;
  return data;
}

export async function getTVShowRatings(userId: string) {
  const { data, error } = await supabase
    .from('tv_ratings')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function getTVShowWantToSeeRatings(userId: string) {
  const { data, error } = await supabase
    .from('tv_watchlist')
    .select('show_id, want_to_see_rating')
    .eq('user_id', userId)
    .not('want_to_see_rating', 'is', null);

  if (error) throw error;
  return data;
}