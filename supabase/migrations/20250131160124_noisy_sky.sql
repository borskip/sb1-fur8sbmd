/*
  # Add recommendations table

  1. New Tables
    - `recommendations`
      - `id` (uuid, primary key)
      - `from_user_id` (uuid, references users)
      - `to_user_id` (uuid, references users)
      - `movie_data` (jsonb)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `recommendations` table
    - Add policies for users to manage recommendations
*/

CREATE TABLE recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id) NOT NULL,
  to_user_id uuid REFERENCES users(id) NOT NULL,
  movie_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read recommendations sent to them"
  ON recommendations FOR SELECT
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "Users can create recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update their received recommendations"
  ON recommendations FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());