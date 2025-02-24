/*
  # Fresh start for watched movies
  
  1. Changes
    - Drop and recreate watched_movies table with clean state
    - Reset all policies
  
  2. Security
    - Re-enable RLS
    - Re-add policies for test users
*/

-- First clear any existing state
DROP TABLE IF EXISTS watched_movies CASCADE;

-- Create fresh watched_movies table
CREATE TABLE watched_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  movie_id integer NOT NULL,
  movie_data jsonb NOT NULL,
  watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Enable RLS
ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "Allow users to read any watched movie"
  ON watched_movies FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage their watched movies"
  ON watched_movies FOR ALL
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000', -- Dario
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
    )
  );