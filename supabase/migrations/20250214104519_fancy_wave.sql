/*
  # Fix watched movies table and relationships
  
  1. Changes
    - Drop and recreate watched_movies table with proper relationships
    - Add RLS policies
    - Fix user relationship query
  
  2. Security
    - Enable RLS
    - Add policies for test users
*/

-- First drop the table if it exists
DROP TABLE IF EXISTS watched_movies CASCADE;

-- Create watched_movies table
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

-- Create policies for test users
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