/*
  # Complete Movie Tracker Database Setup

  This migration creates all necessary tables, policies, and indexes for the Movie Tracker application.
  It uses IF NOT EXISTS checks to avoid conflicts with existing database objects.

  ## Tables Created:
  1. users - User profiles
  2. personal_watchlist - Individual user movie lists
  3. shared_watchlist - Shared group movie list
  4. watched_movies - Movies marked as watched
  5. ratings - User movie ratings
  6. recommendations - Movie recommendations between users
  7. tv_watchlist - TV show watchlist
  8. tv_ratings - TV show ratings

  ## Security:
  - RLS enabled on all tables
  - Policies for authenticated users
  - Proper foreign key constraints
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create personal_watchlist table
CREATE TABLE IF NOT EXISTS personal_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  added_at timestamptz DEFAULT now(),
  want_to_see_rating numeric(3,1) CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  movie_data jsonb,
  UNIQUE(user_id, movie_id)
);

-- Create shared_watchlist table
CREATE TABLE IF NOT EXISTS shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer UNIQUE NOT NULL,
  added_by uuid NOT NULL REFERENCES users(id),
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz,
  movie_data jsonb
);

-- Create watched_movies table
CREATE TABLE IF NOT EXISTS watched_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id integer NOT NULL,
  movie_data jsonb NOT NULL,
  watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  rating numeric(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id),
  to_user_id uuid NOT NULL REFERENCES users(id),
  movie_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Create tv_watchlist table
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

-- Create tv_ratings table
CREATE TABLE IF NOT EXISTS tv_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  show_id integer NOT NULL,
  rating numeric(3,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, show_id)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies (with checks to avoid duplicates)
DO $$
BEGIN
  -- Users policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_all') THEN
    CREATE POLICY "users_select_all" ON users FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_own') THEN
    CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;

  -- Personal watchlist policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_watchlist' AND policyname = 'personal_watchlist_select_all') THEN
    CREATE POLICY "personal_watchlist_select_all" ON personal_watchlist FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_watchlist' AND policyname = 'personal_watchlist_insert_own') THEN
    CREATE POLICY "personal_watchlist_insert_own" ON personal_watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_watchlist' AND policyname = 'personal_watchlist_update_own') THEN
    CREATE POLICY "personal_watchlist_update_own" ON personal_watchlist FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_watchlist' AND policyname = 'personal_watchlist_delete_own') THEN
    CREATE POLICY "personal_watchlist_delete_own" ON personal_watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- Shared watchlist policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_watchlist' AND policyname = 'shared_watchlist_select_all') THEN
    CREATE POLICY "shared_watchlist_select_all" ON shared_watchlist FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_watchlist' AND policyname = 'shared_watchlist_insert_auth') THEN
    CREATE POLICY "shared_watchlist_insert_auth" ON shared_watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_watchlist' AND policyname = 'shared_watchlist_update_auth') THEN
    CREATE POLICY "shared_watchlist_update_auth" ON shared_watchlist FOR UPDATE TO authenticated USING (auth.uid() = added_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_watchlist' AND policyname = 'shared_watchlist_delete_auth') THEN
    CREATE POLICY "shared_watchlist_delete_auth" ON shared_watchlist FOR DELETE TO authenticated USING (true);
  END IF;

  -- Watched movies policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watched_movies' AND policyname = 'watched_movies_select_all') THEN
    CREATE POLICY "watched_movies_select_all" ON watched_movies FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watched_movies' AND policyname = 'watched_movies_insert_own') THEN
    CREATE POLICY "watched_movies_insert_own" ON watched_movies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watched_movies' AND policyname = 'watched_movies_update_own') THEN
    CREATE POLICY "watched_movies_update_own" ON watched_movies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watched_movies' AND policyname = 'watched_movies_delete_own') THEN
    CREATE POLICY "watched_movies_delete_own" ON watched_movies FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- Ratings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_select_all') THEN
    CREATE POLICY "ratings_select_all" ON ratings FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_insert_own') THEN
    CREATE POLICY "ratings_insert_own" ON ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_update_own') THEN
    CREATE POLICY "ratings_update_own" ON ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_delete_own') THEN
    CREATE POLICY "ratings_delete_own" ON ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- Recommendations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'recommendations_select_all') THEN
    CREATE POLICY "recommendations_select_all" ON recommendations FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'recommendations_insert_own') THEN
    CREATE POLICY "recommendations_insert_own" ON recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'recommendations_update_recipient') THEN
    CREATE POLICY "recommendations_update_recipient" ON recommendations FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);
  END IF;

  -- TV watchlist policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_watchlist' AND policyname = 'tv_watchlist_select_all') THEN
    CREATE POLICY "tv_watchlist_select_all" ON tv_watchlist FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_watchlist' AND policyname = 'tv_watchlist_manage_own') THEN
    CREATE POLICY "tv_watchlist_manage_own" ON tv_watchlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- TV ratings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_ratings' AND policyname = 'tv_ratings_select_all') THEN
    CREATE POLICY "tv_ratings_select_all" ON tv_ratings FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_ratings' AND policyname = 'tv_ratings_manage_own') THEN
    CREATE POLICY "tv_ratings_manage_own" ON tv_ratings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_user_id ON personal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_movie_id ON personal_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_movie_id ON shared_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_scheduled ON shared_watchlist(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_watched_movies_user_id ON watched_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_movie_id ON watched_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_watched_at ON watched_movies(watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_to_user ON recommendations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_from_user ON recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_tv_watchlist_user_id ON tv_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_ratings_user_id ON tv_ratings(user_id);