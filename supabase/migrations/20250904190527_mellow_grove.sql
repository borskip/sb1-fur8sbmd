/*
  # Fix Policy Conflicts - Definitive Solution
  
  This migration resolves all policy conflicts by:
  1. Dropping ALL existing policies that might conflict
  2. Creating clean, uniquely named policies
  3. Ensuring RLS is properly configured
  4. Making the migration idempotent (safe to run multiple times)
*/

-- Step 1: Drop ALL existing policies to prevent any conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Get all policies in the public schema
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        -- Drop each policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;

-- Step 3: Create clean, uniquely named policies

-- Users table policies
CREATE POLICY "policy_users_read_all" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "policy_users_update_own" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Ratings table policies
CREATE POLICY "policy_ratings_manage_own" 
  ON ratings FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "policy_ratings_read_all" 
  ON ratings FOR SELECT 
  TO authenticated 
  USING (true);

-- Personal watchlist policies
CREATE POLICY "policy_personal_watchlist_manage_own" 
  ON personal_watchlist FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "policy_personal_watchlist_read_all" 
  ON personal_watchlist FOR SELECT 
  TO authenticated 
  USING (true);

-- Shared watchlist policies
CREATE POLICY "policy_shared_watchlist_read_all" 
  ON shared_watchlist FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "policy_shared_watchlist_insert" 
  ON shared_watchlist FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "policy_shared_watchlist_update" 
  ON shared_watchlist FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = added_by);

CREATE POLICY "policy_shared_watchlist_delete" 
  ON shared_watchlist FOR DELETE 
  TO authenticated 
  USING (true);

-- Recommendations policies
CREATE POLICY "policy_recommendations_create" 
  ON recommendations FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "policy_recommendations_read_all" 
  ON recommendations FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "policy_recommendations_update_received" 
  ON recommendations FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = to_user_id);

-- TV watchlist policies
CREATE POLICY "policy_tv_watchlist_manage_own" 
  ON tv_watchlist FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "policy_tv_watchlist_read_all" 
  ON tv_watchlist FOR SELECT 
  TO authenticated 
  USING (true);

-- TV ratings policies
CREATE POLICY "policy_tv_ratings_manage_own" 
  ON tv_ratings FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "policy_tv_ratings_read_all" 
  ON tv_ratings FOR SELECT 
  TO authenticated 
  USING (true);

-- Watched movies policies
CREATE POLICY "policy_watched_movies_manage_own" 
  ON watched_movies FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "policy_watched_movies_read_all" 
  ON watched_movies FOR SELECT 
  TO authenticated 
  USING (true);

-- Step 4: Verify the fix worked
DO $$
DECLARE
    policy_count INTEGER;
    duplicate_count INTEGER;
BEGIN
    -- Count total policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Check for any duplicate policy names
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT policyname, COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        GROUP BY policyname 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Total policies created: %', policy_count;
    RAISE NOTICE 'Duplicate policies found: %', duplicate_count;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Still have duplicate policies - manual intervention needed';
    END IF;
END $$;