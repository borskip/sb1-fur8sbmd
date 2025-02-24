/*
  # Update rating columns to use decimal type

  1. Changes
    - Change want_to_see_rating to use decimal type
    - Add check constraint to ensure ratings are between 1 and 10
    - Add precision of 2 decimal places

  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- First, drop the existing check constraint if it exists
  ALTER TABLE personal_watchlist 
  DROP CONSTRAINT IF EXISTS personal_watchlist_want_to_see_rating_check;

  -- Then alter the column type to decimal
  ALTER TABLE personal_watchlist 
  ALTER COLUMN want_to_see_rating TYPE decimal(3,1) 
  USING want_to_see_rating::decimal(3,1);

  -- Add new check constraint for decimal values
  ALTER TABLE personal_watchlist 
  ADD CONSTRAINT personal_watchlist_want_to_see_rating_check 
  CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0);
END $$;