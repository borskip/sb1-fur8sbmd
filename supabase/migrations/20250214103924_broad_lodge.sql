/*
  # Add watched movies table
  
  1. New Tables
    - `watched_movies` (if not exists)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `movie_id` (integer)
      - `movie_data` (jsonb)
      - `watched_at` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for test users
*/

DO $$ 
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'watched_movies'
  ) THEN
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
  END IF;
END $$;