/*
  # Add want to see rating to personal watchlist

  1. Changes
    - Add `want_to_see_rating` column to `personal_watchlist` table
      - Integer between 1 and 10
      - Nullable (not all watchlist items need a rating)

  2. Notes
    - Uses a safe ALTER TABLE operation
    - Maintains existing data
    - Adds check constraint for valid rating values
*/

DO $$ 
BEGIN
  -- Add want_to_see_rating column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personal_watchlist' 
    AND column_name = 'want_to_see_rating'
  ) THEN
    ALTER TABLE personal_watchlist 
    ADD COLUMN want_to_see_rating integer 
    CHECK (want_to_see_rating >= 1 AND want_to_see_rating <= 10);
  END IF;
END $$;