/*
  # Complete Movie Tracker Database Schema
  
  This migration creates the complete database schema for the Movie Tracker application.
  
  ## Tables Created:
  1. users - User profiles linked to Supabase auth
  2. personal_watchlist - Personal movie lists and watchlists  
  3. shared_watchlist - Shared group watchlist
  4. watched_movies - Movies marked as watched
  5. ratings - Movie ratings (1-5 stars)
  6. recommendations - Movie recommendations between users
  7. tv_watchlist - TV show watchlists
  8. tv_ratings - TV show ratings
  
  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - Public read access for shared content
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (linked to Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_read_all" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- 2. Personal watchlist (both regular list and watchlist with ratings)
CREATE TABLE IF NOT EXISTS personal_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id integer NOT NULL,
  movie_data jsonb,
  want_to_see_rating numeric(3,1) CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;

-- Personal watchlist policies
CREATE POLICY "personal_watchlist_read_all" ON personal_watchlist
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "personal_watchlist_manage_own" ON personal_watchlist
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Shared watchlist
CREATE TABLE IF NOT EXISTS shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer UNIQUE NOT NULL,
  movie_data jsonb,
  added_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz
);

ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;

-- Shared watchlist policies
CREATE POLICY "shared_watchlist_read_all" ON shared_watchlist
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "shared_watchlist_insert" ON shared_watchlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "shared_watchlist_update" ON shared_watchlist
  FOR UPDATE TO authenticated
  USING (auth.uid() = added_by);

CREATE POLICY "shared_watchlist_delete" ON shared_watchlist
  FOR DELETE TO authenticated
  USING (true); -- Anyone can remove from shared list

-- 4. Watched movies
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

-- Watched movies policies
CREATE POLICY "watched_movies_read_all" ON watched_movies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "watched_movies_manage_own" ON watched_movies
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Movie ratings
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id integer NOT NULL,
  rating numeric(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Ratings policies
CREATE POLICY "ratings_read_all" ON ratings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "ratings_manage_own" ON ratings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Recommendations policies
CREATE POLICY "recommendations_read_all" ON recommendations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "recommendations_create" ON recommendations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "recommendations_update_recipient" ON recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id);

-- 7. TV Watchlist
CREATE TABLE IF NOT EXISTS tv_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- TV watchlist policies
CREATE POLICY "tv_watchlist_read_all" ON tv_watchlist
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tv_watchlist_manage_own" ON tv_watchlist
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. TV Ratings
CREATE TABLE IF NOT EXISTS tv_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id integer NOT NULL,
  rating numeric(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, show_id)
);

ALTER TABLE tv_ratings ENABLE ROW LEVEL SECURITY;

-- TV ratings policies
CREATE POLICY "tv_ratings_read_all" ON tv_ratings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tv_ratings_manage_own" ON tv_ratings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_user_id ON personal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_movie_id ON personal_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_movie_id ON shared_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_user_id ON watched_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_movie_id ON watched_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_to_user ON recommendations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_tv_watchlist_user_id ON tv_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_ratings_user_id ON tv_ratings(user_id);

-- Verification queries
SELECT 'Schema created successfully!' as status;
SELECT table_name, row_security FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'users', 'personal_watchlist', 'shared_watchlist', 'watched_movies', 
  'ratings', 'recommendations', 'tv_watchlist', 'tv_ratings'
);
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;