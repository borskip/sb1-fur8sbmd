/*
  # Complete Movie Tracker Database Schema

  1. New Tables
    - `users` - User profiles with authentication integration
    - `personal_watchlist` - Personal movie lists and watchlists with want-to-see ratings
    - `shared_watchlist` - Group shared movies for scheduling
    - `watched_movies` - Movies marked as watched by users
    - `ratings` - Movie ratings (1-5 stars) linked to personal watchlist
    - `recommendations` - Movie recommendations between users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading public data

  3. Relationships
    - Foreign keys between all related tables
    - Proper indexing for performance
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create personal watchlist table (handles both personal list and watchlist)
CREATE TABLE IF NOT EXISTS personal_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  added_at timestamptz DEFAULT now(),
  want_to_see_rating numeric(3,1) CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  movie_data jsonb,
  UNIQUE(user_id, movie_id)
);

-- Create shared watchlist table
CREATE TABLE IF NOT EXISTS shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer UNIQUE NOT NULL,
  added_by uuid NOT NULL REFERENCES users(id),
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz,
  movie_data jsonb
);

-- Create watched movies table
CREATE TABLE IF NOT EXISTS watched_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  movie_id integer NOT NULL,
  movie_data jsonb NOT NULL,
  watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Create ratings table with proper foreign key to personal_watchlist
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Personal watchlist policies
CREATE POLICY "Users can read all watchlists" ON personal_watchlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own watchlist items" ON personal_watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watchlist items" ON personal_watchlist FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watchlist items" ON personal_watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Shared watchlist policies
CREATE POLICY "Users can read shared watchlist" ON shared_watchlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert into shared watchlist" ON shared_watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);
CREATE POLICY "Users can update shared watchlist" ON shared_watchlist FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete from shared watchlist" ON shared_watchlist FOR DELETE TO authenticated USING (true);

-- Watched movies policies
CREATE POLICY "Users can read all watched movies" ON watched_movies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own watched movies" ON watched_movies FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Ratings policies
CREATE POLICY "Users can read all ratings" ON ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own ratings" ON ratings FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can read recommendations" ON recommendations FOR SELECT TO authenticated USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create recommendations" ON recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update their received recommendations" ON recommendations FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_user_id ON personal_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_watchlist_movie_id ON personal_watchlist(movie_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_user_id ON watched_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_movies_watched_at ON watched_movies(watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlist_scheduled ON shared_watchlist(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Insert test users
INSERT INTO users (id, username, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Dario', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Sep', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
  ('7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Rob', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face')
ON CONFLICT (id) DO NOTHING;