/*
  # Complete Movie Tracker Database Setup (Safe Version)
  
  This migration safely sets up the complete movie tracker schema by:
  1. Only creating tables/policies that don't exist
  2. Using IF NOT EXISTS where possible
  3. Using DO blocks for conditional policy creation
  
  Tables created:
  - users (with auth integration)
  - personal_watchlist (user's personal movie lists)
  - shared_watchlist (shared group watchlist)
  - watched_movies (movies marked as watched)
  - ratings (user movie ratings)
  - recommendations (movie recommendations between users)
  - tv_watchlist (TV show watchlist)
  - tv_ratings (TV show ratings)
  
  Security: RLS enabled on all tables with appropriate policies
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies (with safe creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_all') THEN
    CREATE POLICY "users_select_all" ON users FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_own') THEN
    CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- 2. PERSONAL WATCHLIST TABLE
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_user_id ON personal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_movie_id ON personal_watchlist(movie_id);

-- Personal watchlist policies
DO $$
BEGIN
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
END $$;

-- 3. SHARED WATCHLIST TABLE
CREATE TABLE IF NOT EXISTS shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer UNIQUE NOT NULL,
  added_by uuid NOT NULL REFERENCES users(id),
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz,
  movie_data jsonb
);

ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_movie_id ON shared_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_scheduled ON shared_watchlist(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Shared watchlist policies
DO $$
BEGIN
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
END $$;

-- 4. WATCHED MOVIES TABLE
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_watched_movies_user_id ON watched_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_movie_id ON watched_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_watched_at ON watched_movies(watched_at DESC);

-- Watched movies policies
DO $$
BEGIN
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
END $$;

-- 5. RATINGS TABLE
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);

-- Ratings policies
DO $$
BEGIN
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
END $$;

-- 6. RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id),
  to_user_id uuid NOT NULL REFERENCES users(id),
  movie_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_from_user ON recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_to_user ON recommendations(to_user_id);

-- Recommendations policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'recommendations_select_all') THEN
    CREATE POLICY "recommendations_select_all" ON recommendations FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'recommendations_insert_own') THEN
    CREATE POLICY "recommendations_insert_own" ON recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'recommendations_update_recipient') THEN
    CREATE POLICY "recommendations_update_recipient" ON recommendations FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);
  END IF;
END $$;

-- 7. TV WATCHLIST TABLE
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tv_watchlist_user_id ON tv_watchlist(user_id);

-- TV watchlist policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_watchlist' AND policyname = 'tv_watchlist_select_all') THEN
    CREATE POLICY "tv_watchlist_select_all" ON tv_watchlist FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_watchlist' AND policyname = 'tv_watchlist_manage_own') THEN
    CREATE POLICY "tv_watchlist_manage_own" ON tv_watchlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 8. TV RATINGS TABLE
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tv_ratings_user_id ON tv_ratings(user_id);

-- TV ratings policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_ratings' AND policyname = 'tv_ratings_select_all') THEN
    CREATE POLICY "tv_ratings_select_all" ON tv_ratings FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tv_ratings' AND policyname = 'tv_ratings_manage_own') THEN
    CREATE POLICY "tv_ratings_manage_own" ON tv_ratings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Movie Tracker database setup completed successfully!';
  RAISE NOTICE 'Created 8 tables with RLS policies and indexes.';
END $$;