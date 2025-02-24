-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read any watchlist" ON personal_watchlist;
DROP POLICY IF EXISTS "Allow users to add movies to their watchlist" ON personal_watchlist;
DROP POLICY IF EXISTS "Allow users to update their watchlist entries" ON personal_watchlist;
DROP POLICY IF EXISTS "Allow users to remove movies from their watchlist" ON personal_watchlist;

-- Create new policies that work with our test users
CREATE POLICY "Allow users to read any watchlist"
  ON personal_watchlist FOR SELECT
  USING (true);

CREATE POLICY "Allow users to add movies to their watchlist"
  ON personal_watchlist FOR INSERT
  WITH CHECK (
    -- Allow our test users to insert
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000', -- Dario
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
    )
  );

CREATE POLICY "Allow users to update their watchlist entries"
  ON personal_watchlist FOR UPDATE
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

CREATE POLICY "Allow users to remove movies from their watchlist"
  ON personal_watchlist FOR DELETE
  USING (
    user_id IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );

-- Also update shared watchlist policies
DROP POLICY IF EXISTS "Users can read shared watchlist" ON shared_watchlist;
DROP POLICY IF EXISTS "Users can manage shared watchlist" ON shared_watchlist;

CREATE POLICY "Allow users to read shared watchlist"
  ON shared_watchlist FOR SELECT
  USING (true);

CREATE POLICY "Allow users to manage shared watchlist"
  ON shared_watchlist FOR ALL
  USING (
    added_by IN (
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'
    )
  );