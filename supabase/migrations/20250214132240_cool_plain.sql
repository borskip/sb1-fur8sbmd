-- Drop existing policy for managing shared watchlist
DROP POLICY IF EXISTS "Allow users to manage shared watchlist" ON shared_watchlist;

-- Create separate policies for different operations
CREATE POLICY "Allow users to insert into shared watchlist"
  ON shared_watchlist FOR INSERT
  WITH CHECK (
    added_by IN (
      '550e8400-e29b-41d4-a716-446655440000', -- Dario
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
      '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
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

-- Allow any test user to delete from shared watchlist
CREATE POLICY "Allow any user to delete from shared watchlist"
  ON shared_watchlist FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id IN (
        '550e8400-e29b-41d4-a716-446655440000', -- Dario
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8', -- Sep
        '7ba7b810-9dad-11d1-80b4-00c04fd430c8'  -- Rob
      )
    )
  );