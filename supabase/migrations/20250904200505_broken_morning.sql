/*
  # Complete Movie Tracker Database Setup

  1. New Tables
    - `users` - User profiles with username and avatar
    - `personal_watchlist` - Personal movie lists with want-to-see ratings
    - `shared_watchlist` - Shared group watchlist with scheduling
    - `watched_movies` - Movies that users have watched
    - `ratings` - User ratings for watched movies (1-5 stars)
    - `recommendations` - Movie recommendations between users
    - `tv_watchlist` - TV show watchlist functionality
    - `tv_ratings` - TV show ratings

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for authenticated users
    - Proper foreign key constraints

  3. Performance
    - Add indexes for common queries
    - Optimize for user-based filtering
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
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

-- Personal watchlist table
CREATE TABLE IF NOT EXISTS personal_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  added_at timestamptz DEFAULT now(),
  want_to_see_rating numeric(3,1) CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  movie_data jsonb,
  UNIQUE(user_id, movie_id)
);

ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watchlist"
  ON personal_watchlist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all watchlists"
  ON personal_watchlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Shared watchlist table
CREATE TABLE IF NOT EXISTS shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer UNIQUE NOT NULL,
  added_by uuid NOT NULL REFERENCES users(id),
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz,
  movie_data jsonb
);

ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read shared watchlist"
  ON shared_watchlist
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert into shared watchlist"
  ON shared_watchlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Users can update shared watchlist"
  ON shared_watchlist
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = added_by);

CREATE POLICY "Users can delete from shared watchlist"
  ON shared_watchlist
  FOR DELETE
  TO authenticated
  USING (true);

-- Watched movies table
CREATE TABLE IF NOT EXISTS watched_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id integer NOT NULL,
  movie_data jsonb NOT NULL,
  watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watched movies"
  ON watched_movies
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all watched movies"
  ON watched_movies
  FOR SELECT
  TO authenticated
  USING (true);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  rating numeric(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ratings"
  ON ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id),
  to_user_id uuid NOT NULL REFERENCES users(id),
  movie_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create recommendations"
  ON recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can read recommendations"
  ON recommendations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their received recommendations"
  ON recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id);

-- TV Watchlist table
CREATE TABLE IF NOT EXISTS tv_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  show_id integer NOT NULL,
  show_data jsonb NOT NULL,
  want_to_see_rating numeric(3,1) CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  added_at timestamptz DEFAULT now(),
  watched boolean DEFAULT false,
  shared boolean DEFAULT false,
  scheduled_for timestamptz,
  UNIQUE(user_id, show_id)
);

ALTER TABLE tv_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own TV watchlist"
  ON tv_watchlist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all TV watchlists"
  ON tv_watchlist
  FOR SELECT
  TO authenticated
  USING (true);

-- TV Ratings table
CREATE TABLE IF NOT EXISTS tv_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  show_id integer NOT NULL,
  rating numeric(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, show_id)
);

ALTER TABLE tv_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own TV ratings"
  ON tv_ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all TV ratings"
  ON tv_ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_user_id ON personal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_movie_id ON personal_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_movie_id ON shared_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_scheduled ON shared_watchlist(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_watched_movies_user_id ON watched_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_movie_id ON watched_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_watched_at ON watched_movies(watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_from_user ON recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_to_user ON recommendations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_tv_watchlist_user_id ON tv_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_ratings_user_id ON tv_ratings(user_id);