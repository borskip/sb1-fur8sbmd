/*
  # Clear shared watchlist

  1. Changes
    - Removes all movies from the shared watchlist table
    - Keeps the table structure intact
    - Does not affect other tables
*/

-- Clear all movies from shared watchlist
TRUNCATE TABLE shared_watchlist;