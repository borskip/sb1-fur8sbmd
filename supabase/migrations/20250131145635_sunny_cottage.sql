/*
  # Update ratings table to support decimal values

  1. Changes
    - Modify `rating` column to use decimal(3,1) type
    - Update check constraint to allow values between 1.0 and 5.0
    - Ensure smooth conversion of existing data

  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- First, drop the existing check constraint if it exists
  ALTER TABLE ratings 
  DROP CONSTRAINT IF EXISTS ratings_rating_check;

  -- Then alter the column type to decimal
  ALTER TABLE ratings 
  ALTER COLUMN rating TYPE decimal(3,1) 
  USING rating::decimal(3,1);

  -- Add new check constraint for decimal values
  ALTER TABLE ratings 
  ADD CONSTRAINT ratings_rating_check 
  CHECK (rating >= 1.0 AND rating <= 5.0);
END $$;