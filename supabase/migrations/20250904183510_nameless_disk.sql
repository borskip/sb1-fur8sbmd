/*
  # Fresh Movie Tracker Database Setup

  1. New Tables
    - `users` - User profiles
    - `personal_watchlist` - Personal movie lists and watchlists
    - `shared_watchlist` - Shared group watchlist
    - `watched_movies` - Movies marked as watched
    - `ratings` - Movie ratings (1-5 stars)
    - `recommendations` - Movie recommendations between users

  2. Security
    - Enable RLS on all tables
    - Add policies for test users
    - Allow reading all data for collaboration features
*/

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Personal watchlist (includes both personal list and watchlist with ratings)
CREATE TABLE IF NOT EXISTS personal_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  movie_id integer NOT NULL,
  movie_data jsonb,
  want_to_see_rating decimal(3,1) CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Shared watchlist
CREATE TABLE IF NOT EXISTS shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer NOT NULL,
  movie_data jsonb,
  added_by uuid REFERENCES users(id) NOT NULL,
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz,
  UNIQUE(movie_id)
);

-- Watched movies
CREATE TABLE IF NOT EXISTS watched_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  movie_id integer NOT NULL,
  movie_data jsonb NOT NULL,
  watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Movie ratings
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  movie_id integer NOT NULL,
  rating decimal(3,1) CHECK (rating >= 1.0 AND rating <= 5.0) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id) NOT NULL,
  to_user_id uuid REFERENCES users(id) NOT NULL,
  movie_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Create test users
DO $$
DECLARE
  dario_id uuid := '550e8400-e29b-41d4-a716-446655440000';
  sep_id uuid := '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  rob_id uuid := '7ba7b810-9dad-11d1-80b4-00c04fd430c8';
BEGIN
  -- Insert test users into public.users
  INSERT INTO users (id, username, avatar_url) VALUES
    (dario_id, 'dario', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dario&style=circle&backgroundColor=b6e3f4&hairColor=2c1b18&facialHairType=beardMedium&facialHairColor=2c1b18&skinColor=f8d25c'),
    (sep_id, 'sep', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sep&style=circle&backgroundColor=b6e3f4&hairColor=f9d71c&facialHairType=blank&skinColor=ffdbb4'),
    (rob_id, 'rob', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rob&style=circle&backgroundColor=b6e3f4&hairColor=000000&facialHairType=blank&skinColor=edb98a&eyes=happy')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- RLS Policies for users
CREATE POLICY "Allow users to read all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON users FOR UPDATE
  USING (
    id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

-- RLS Policies for personal_watchlist
CREATE POLICY "Allow users to read any watchlist"
  ON personal_watchlist FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage their watchlist"
  ON personal_watchlist FOR ALL
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

-- RLS Policies for shared_watchlist
CREATE POLICY "Allow users to read shared watchlist"
  ON shared_watchlist FOR SELECT
  USING (true);

CREATE POLICY "Allow users to insert into shared watchlist"
  ON shared_watchlist FOR INSERT
  WITH CHECK (
    added_by IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

CREATE POLICY "Allow users to update shared watchlist"
  ON shared_watchlist FOR UPDATE
  USING (
    added_by IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

CREATE POLICY "Allow any user to delete from shared watchlist"
  ON shared_watchlist FOR DELETE
  USING (true);

-- RLS Policies for watched_movies
CREATE POLICY "Allow users to read any watched movie"
  ON watched_movies FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage their watched movies"
  ON watched_movies FOR ALL
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

-- RLS Policies for ratings
CREATE POLICY "Allow users to read any rating"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage their ratings"
  ON ratings FOR ALL
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

-- RLS Policies for recommendations
CREATE POLICY "Allow users to read recommendations"
  ON recommendations FOR SELECT
  USING (true);

CREATE POLICY "Allow users to create recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (
    from_user_id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

CREATE POLICY "Allow users to update their recommendations"
  ON recommendations FOR UPDATE
  USING (
    to_user_id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );