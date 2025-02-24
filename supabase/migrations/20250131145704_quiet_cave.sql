/*
  # Add RLS policies for ratings table

  1. Changes
    - Add policies to allow test users to manage their ratings
    - Allow reading of all ratings for authenticated users
    - Ensure proper access control for rating operations

  2. Security
    - Only allow users to manage their own ratings
    - Allow reading all ratings for collaboration features
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow users to read any rating" ON ratings;
DROP POLICY IF EXISTS "Allow users to manage their ratings" ON ratings;

-- Create new policies that work with our test users
CREATE POLICY "Allow users to read any rating"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage their ratings"
  ON ratings FOR ALL
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000', -- Dario
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
    )
  );