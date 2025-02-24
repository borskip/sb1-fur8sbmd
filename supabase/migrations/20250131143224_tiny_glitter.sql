/*
  # Add movie data column to personal watchlist

  1. Changes
    - Add `movie_data` JSONB column to store movie details
    - This prevents having to make additional API calls to TMDB

  2. Notes
    - Uses JSONB for flexible movie data storage
    - Maintains existing data
*/

DO $$ 
BEGIN
  -- Add movie_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personal_watchlist' 
    AND column_name = 'movie_data'
  ) THEN
    ALTER TABLE personal_watchlist 
    ADD COLUMN movie_data JSONB;
  END IF;
END $$;