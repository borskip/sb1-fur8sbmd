/*
  # Create watched movies table
  
  1. Changes
    - Create watched_movies table for tracking watched movies
    - Add foreign key relationship to users table
    - Add unique constraint on user_id and movie_id
  
  2. Security
    - Enable RLS
    - Add policies for test users to read and manage their watched movies
    
  3. Structure
    - id: UUID primary key
    - user_id: UUID foreign key to users table
    - movie_id: Integer for TMDB movie ID
    - movie_data: JSONB for movie details
    - watched_at: Timestamp for when movie was watched
    - created_at: Timestamp for record creation
*/

DO $$ 
BEGIN
  -- Drop existing table and policies if they exist
  DROP TABLE IF EXISTS watched_movies CASCADE;

  -- Create the table
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
END $$;