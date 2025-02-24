/*
  # Clear all movie data
  
  This migration removes all movie-related data while preserving the database structure:
  1. Recommendations
  2. Ratings
  3. Personal watchlists
  4. Shared watchlist
*/

-- Clear all movie-related data
TRUNCATE TABLE recommendations CASCADE;
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE personal_watchlist CASCADE;
TRUNCATE TABLE shared_watchlist CASCADE;