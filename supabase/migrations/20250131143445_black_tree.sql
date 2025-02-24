/*
  # Fix RLS policies for personal_watchlist table

  1. Changes
    - Drop existing RLS policies for personal_watchlist
    - Create new, more permissive policies for authenticated users
  
  2. Security
    - Allow authenticated users to insert their own records
    - Allow users to read all records
    - Allow users to update/delete their own records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all watchlists" ON personal_watchlist;
DROP POLICY IF EXISTS "Users can insert their own watchlist items" ON personal_watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist items" ON personal_watchlist;
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON personal_watchlist;

-- Create new policies with better names and clearer permissions
CREATE POLICY "Allow users to read any watchlist"
  ON personal_watchlist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to add movies to their watchlist"
  ON personal_watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their watchlist entries"
  ON personal_watchlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to remove movies from their watchlist"
  ON personal_watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);