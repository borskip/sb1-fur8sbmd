/*
  # Movie Tracker Initial Schema

  1. New Tables
    - users
      - id (uuid, from auth)
      - username (text)
      - avatar_url (text)
    - personal_watchlist
      - id (uuid)
      - user_id (uuid, references users)
      - movie_id (integer, from TMDB)
      - added_at (timestamp)
    - shared_watchlist
      - id (uuid)
      - movie_id (integer, from TMDB)
      - added_by (uuid, references users)
      - added_at (timestamp)
      - scheduled_for (timestamp)
    - ratings
      - id (uuid)
      - user_id (uuid, references users)
      - movie_id (integer, from TMDB)
      - rating (integer, 1-5)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can read all data
    - Users can only modify their own data
*/

-- Users table (extends auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Personal watchlist
CREATE TABLE personal_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  movie_id integer NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Shared watchlist
CREATE TABLE shared_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id integer NOT NULL,
  added_by uuid REFERENCES users(id) NOT NULL,
  added_at timestamptz DEFAULT now(),
  scheduled_for timestamptz,
  UNIQUE(movie_id)
);

-- Movie ratings
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  movie_id integer NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read all personal watchlists"
  ON personal_watchlist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their personal watchlist"
  ON personal_watchlist FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read shared watchlist"
  ON shared_watchlist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage shared watchlist"
  ON shared_watchlist FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own ratings"
  ON ratings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);