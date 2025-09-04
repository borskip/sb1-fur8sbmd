@@ .. @@
 -- Enable RLS on users table
 ALTER TABLE users ENABLE ROW LEVEL SECURITY;
 
--- Create policies for users table (handle duplicates)
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can read all users" ON users;
-  
-  -- Create the policy
-  CREATE POLICY "Users can read all users"
-    ON users
-    FOR SELECT
-    TO authenticated
-    USING (true);
-END $$;
+-- Create policies for users table (idempotent)
+DROP POLICY IF EXISTS "Users can read all users" ON users;
+CREATE POLICY "Users can read all users"
+  ON users
+  FOR SELECT
+  TO authenticated
+  USING (true);
 
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can update their own profile" ON users;
-  
-  -- Create the policy
-  CREATE POLICY "Users can update their own profile"
-    ON users
-    FOR UPDATE
-    TO authenticated
-    USING (auth.uid() = id);
-END $$;
+DROP POLICY IF EXISTS "Users can update their own profile" ON users;
+CREATE POLICY "Users can update their own profile"
+  ON users
+  FOR UPDATE
+  TO authenticated
+  USING (auth.uid() = id);
 
 -- Create personal_watchlist table
 CREATE TABLE IF NOT EXISTS personal_watchlist (
@@ .. @@
 -- Enable RLS on personal_watchlist table
 ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
 
--- Create policies for personal_watchlist table (handle duplicates)
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can manage their own watchlist items" ON personal_watchlist;
-  
-  -- Create the policy
-  CREATE POLICY "Users can manage their own watchlist items"
-    ON personal_watchlist
-    FOR ALL
-    TO authenticated
-    USING (auth.uid() = user_id)
-    WITH CHECK (auth.uid() = user_id);
-END $$;
+-- Create policies for personal_watchlist table (idempotent)
+DROP POLICY IF EXISTS "Users can manage their own watchlist items" ON personal_watchlist;
+CREATE POLICY "Users can manage their own watchlist items"
+  ON personal_watchlist
+  FOR ALL
+  TO authenticated
+  USING (auth.uid() = user_id)
+  WITH CHECK (auth.uid() = user_id);
 
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can read all watchlists" ON personal_watchlist;
-  
-  -- Create the policy
-  CREATE POLICY "Users can read all watchlists"
-    ON personal_watchlist
-    FOR SELECT
-    TO authenticated
-    USING (true);
-END $$;
+DROP POLICY IF EXISTS "Users can read all watchlists" ON personal_watchlist;
+CREATE POLICY "Users can read all watchlists"
+  ON personal_watchlist
+  FOR SELECT
+  TO authenticated
+  USING (true);
 
 -- Create shared_watchlist table
 CREATE TABLE IF NOT EXISTS shared_watchlist (
@@ .. @@
 -- Enable RLS on shared_watchlist table
 ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
 
--- Create policies for shared_watchlist table (handle duplicates)
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can read shared watchlist" ON shared_watchlist;
-  
-  -- Create the policy
-  CREATE POLICY "Users can read shared watchlist"
-    ON shared_watchlist
-    FOR SELECT
-    TO authenticated
-    USING (true);
-END $$;
+-- Create policies for shared_watchlist table (idempotent)
+DROP POLICY IF EXISTS "Users can read shared watchlist" ON shared_watchlist;
+CREATE POLICY "Users can read shared watchlist"
+  ON shared_watchlist
+  FOR SELECT
+  TO authenticated
+  USING (true);
 
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can manage shared watchlist" ON shared_watchlist;
-  
-  -- Create the policy
-  CREATE POLICY "Users can manage shared watchlist"
-    ON shared_watchlist
-    FOR ALL
-    TO authenticated
-    USING (true)
-    WITH CHECK (true);
-END $$;
+DROP POLICY IF EXISTS "Users can manage shared watchlist" ON shared_watchlist;
+CREATE POLICY "Users can manage shared watchlist"
+  ON shared_watchlist
+  FOR ALL
+  TO authenticated
+  USING (true)
+  WITH CHECK (true);
 
 -- Create watched_movies table
 CREATE TABLE IF NOT EXISTS watched_movies (
@@ .. @@
 -- Enable RLS on watched_movies table
 ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;
 
--- Create policies for watched_movies table (handle duplicates)
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can manage their own watched movies" ON watched_movies;
-  
-  -- Create the policy
-  CREATE POLICY "Users can manage their own watched movies"
-    ON watched_movies
-    FOR ALL
-    TO authenticated
-    USING (auth.uid() = user_id)
-    WITH CHECK (auth.uid() = user_id);
-END $$;
+-- Create policies for watched_movies table (idempotent)
+DROP POLICY IF EXISTS "Users can manage their own watched movies" ON watched_movies;
+CREATE POLICY "Users can manage their own watched movies"
+  ON watched_movies
+  FOR ALL
+  TO authenticated
+  USING (auth.uid() = user_id)
+  WITH CHECK (auth.uid() = user_id);
 
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can read all watched movies" ON watched_movies;
-  
-  -- Create the policy
-  CREATE POLICY "Users can read all watched movies"
-    ON watched_movies
-    FOR SELECT
-    TO authenticated
-    USING (true);
-END $$;
+DROP POLICY IF EXISTS "Users can read all watched movies" ON watched_movies;
+CREATE POLICY "Users can read all watched movies"
+  ON watched_movies
+  FOR SELECT
+  TO authenticated
+  USING (true);
 
 -- Create ratings table
 CREATE TABLE IF NOT EXISTS ratings (
@@ .. @@
 -- Enable RLS on ratings table
 ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
 
--- Create policies for ratings table (handle duplicates)
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;
-  
-  -- Create the policy
-  CREATE POLICY "Users can manage their own ratings"
-    ON ratings
-    FOR ALL
-    TO authenticated
-    USING (auth.uid() = user_id)
-    WITH CHECK (auth.uid() = user_id);
-END $$;
+-- Create policies for ratings table (idempotent)
+DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;
+CREATE POLICY "Users can manage their own ratings"
+  ON ratings
+  FOR ALL
+  TO authenticated
+  USING (auth.uid() = user_id)
+  WITH CHECK (auth.uid() = user_id);
 
-DO $$
-BEGIN
-  -- Drop existing policy if it exists
-  DROP POLICY IF EXISTS "Users can read all ratings" ON ratings;
-  
-  -- Create the policy
-  CREATE POLICY "Users can read all ratings"
-    ON ratings
-    FOR SELECT
-    TO authenticated
-    USING (true);
-END $$;
+DROP POLICY IF EXISTS "Users can read all ratings" ON ratings;
+CREATE POLICY "Users can read all ratings"
+  ON ratings
+  FOR SELECT
+  TO authenticated
+  USING (true);
 
 -- Insert test users (only if they don't exist)
 INSERT INTO users (id, username, avatar_url)
@@ .. @@
   ('7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Rob', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rob&style=circle&backgroundColor=b6e3f4&hairColor=000000&facialHairType=blank&skinColor=edb98a&eyes=happy')
 ON CONFLICT (id) DO NOTHING;