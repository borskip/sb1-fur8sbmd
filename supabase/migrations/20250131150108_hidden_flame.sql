/*
  # Add movie_data column to shared_watchlist table

  1. Changes
    - Add JSONB column `movie_data` to `shared_watchlist` table to store movie details
    
  2. Notes
    - Using JSONB for flexible movie data storage
    - Column can be null initially for backward compatibility
*/

DO $$ 
BEGIN
  -- Add movie_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shared_watchlist' 
    AND column_name = 'movie_data'
  ) THEN
    ALTER TABLE shared_watchlist 
    ADD COLUMN movie_data JSONB;
  END IF;
END $$;