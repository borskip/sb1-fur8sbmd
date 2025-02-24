/*
  # Add TV Show Support

  1. New Tables
    - `tv_watchlist`: For tracking TV shows in personal and shared watchlists
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `show_id` (integer)
      - `show_data` (jsonb)
      - `want_to_see_rating` (decimal)
      - `added_at` (timestamptz)
      - `watched` (boolean)
      - `shared` (boolean)
      - `scheduled_for` (timestamptz)

    - `tv_ratings`: For TV show ratings
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `show_id` (integer)
      - `rating` (decimal)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create TV watchlist table
CREATE TABLE tv_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  show_id integer NOT NULL,
  show_data jsonb NOT NULL,
  want_to_see_rating decimal(3,1) CHECK (want_to_see_rating >= 1.0 AND want_to_see_rating <= 10.0),
  added_at timestamptz DEFAULT now(),
  watched boolean DEFAULT false,
  shared boolean DEFAULT false,
  scheduled_for timestamptz,
  UNIQUE(user_id, show_id)
);

-- Create TV ratings table
CREATE TABLE tv_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  show_id integer NOT NULL,
  rating decimal(3,1) CHECK (rating >= 1.0 AND rating <= 5.0) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, show_id)
);

-- Enable RLS
ALTER TABLE tv_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for TV watchlist
CREATE POLICY "Allow users to read any TV watchlist"
  ON tv_watchlist FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage their TV watchlist"
  ON tv_watchlist FOR ALL
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000', -- Dario
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
    )
  );

-- Create policies for TV ratings
CREATE POLICY "Allow users to read any TV rating"
  ON tv_ratings FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage their TV ratings"
  ON tv_ratings FOR ALL
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000', -- Dario
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
    )
  );