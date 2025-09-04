/*
  # Movie Tracker Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
    
    - `personal_watchlist`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `movie_id` (integer)
      - `movie_data` (jsonb, stores TMDB movie data)
      - `added_at` (timestamp)
      - `want_to_see_rating` (decimal 1-10, optional for watchlist vs personal list)
    
    - `shared_watchlist`
      - `id` (uuid, primary key)
      - `movie_id` (integer, unique)
      - `movie_data` (jsonb, stores TMDB movie data)
      - `added_by` (uuid, references users)
      - `added_at` (timestamp)
      - `scheduled_for` (timestamp, optional)
    
    - `watched_movies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `movie_id` (integer)
      - `movie_data` (jsonb, stores TMDB movie data)
      - `watched_at` (timestamp)
    
    - `ratings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `movie_id` (integer)
      - `rating` (integer 1-5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading shared data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create personal_watchlist table
CREATE TABLE IF NOT EXISTS personal_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  movie_data jsonb NOT NULL,
  added_at timestamptz DEFAULT now(),
  want_to_see_rating decimal CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their personal watchlist"
  ON personal_watchlist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read all personal watchlists"
  ON personal_watchlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Create shared_watchlist table
CREATE TABLE IF NOT EXISTS shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer UNIQUE NOT NULL,
  movie_data jsonb NOT NULL,
  added_by uuid NOT NULL REFERENCES users(id),
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz
);

ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage shared watchlist"
  ON shared_watchlist
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read shared watchlist"
  ON shared_watchlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Create watched_movies table
CREATE TABLE IF NOT EXISTS watched_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  movie_data jsonb NOT NULL,
  watched_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their watched movies"
  ON watched_movies
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read all watched movies"
  ON watched_movies
  FOR SELECT
  TO authenticated
  USING (true);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ratings"
  ON ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read all ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_user_id ON personal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_movie_id ON personal_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_movie_id ON shared_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_user_id ON watched_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_movie_id ON watched_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);

-- Insert some test users (these will only be inserted if they don't exist)
INSERT INTO users (id, username, avatar_url) VALUES 
  ('7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'dario', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
  ('8ca8c920-9dad-11d1-80b4-00c04fd430c9', 'sep', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
  ('9db9da30-9dad-11d1-80b4-00c04fd430ca', 'rob', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face')
ON CONFLICT (id) DO NOTHING;