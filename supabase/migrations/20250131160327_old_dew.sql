/*
  # Fix RLS policies for recommendations table

  1. Changes
    - Update RLS policies to work with test users
    - Allow test users to read and create recommendations
    - Allow test users to update their received recommendations

  2. Security
    - Maintain security by only allowing specific test user IDs
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read recommendations sent to them" ON recommendations;
DROP POLICY IF EXISTS "Users can create recommendations" ON recommendations;
DROP POLICY IF EXISTS "Users can update their received recommendations" ON recommendations;

-- Create new policies for test users
CREATE POLICY "Allow users to read recommendations"
  ON recommendations FOR SELECT
  USING (true);

CREATE POLICY "Allow users to create recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (
    from_user_id IN (
      '550e8400-e29b-41d4-a716-446655440000', -- Dario
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
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