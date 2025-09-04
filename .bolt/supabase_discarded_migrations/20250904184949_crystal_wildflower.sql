@@ .. @@
 -- Enable RLS on users table
 ALTER TABLE users ENABLE ROW LEVEL SECURITY;
 
--- Create policies for users table
-CREATE POLICY "Users can read all users"
-  ON users
-  FOR SELECT
-  TO authenticated
-  USING (true);
+-- Create policies for users table (handle duplicates)
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can read all users" ON users;
+  
+  -- Create the policy
+  CREATE POLICY "Users can read all users"
+    ON users
+    FOR SELECT
+    TO authenticated
+    USING (true);
+END $$;
 
-CREATE POLICY "Users can update their own profile"
-  ON users
-  FOR UPDATE
-  TO authenticated
-  USING (auth.uid() = id);
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can update their own profile" ON users;
+  
+  -- Create the policy
+  CREATE POLICY "Users can update their own profile"
+    ON users
+    FOR UPDATE
+    TO authenticated
+    USING (auth.uid() = id);
+END $$;
 
 -- Create personal_watchlist table
 CREATE TABLE IF NOT EXISTS personal_watchlist (
@@ .. @@
 -- Enable RLS on personal_watchlist table
 ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
 
--- Create policies for personal_watchlist table
-CREATE POLICY "Users can manage their own watchlist items"
-  ON personal_watchlist
-  FOR ALL
-  TO authenticated
-  USING (auth.uid() = user_id)
-  WITH CHECK (auth.uid() = user_id);
+-- Create policies for personal_watchlist table (handle duplicates)
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can manage their own watchlist items" ON personal_watchlist;
+  
+  -- Create the policy
+  CREATE POLICY "Users can manage their own watchlist items"
+    ON personal_watchlist
+    FOR ALL
+    TO authenticated
+    USING (auth.uid() = user_id)
+    WITH CHECK (auth.uid() = user_id);
+END $$;
 
-CREATE POLICY "Users can read all watchlists"
-  ON personal_watchlist
-  FOR SELECT
-  TO authenticated
-  USING (true);
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can read all watchlists" ON personal_watchlist;
+  
+  -- Create the policy
+  CREATE POLICY "Users can read all watchlists"
+    ON personal_watchlist
+    FOR SELECT
+    TO authenticated
+    USING (true);
+END $$;
 
 -- Create shared_watchlist table
 CREATE TABLE IF NOT EXISTS shared_watchlist (
@@ .. @@
 -- Enable RLS on shared_watchlist table
 ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
 
--- Create policies for shared_watchlist table
-CREATE POLICY "Users can read shared watchlist"
-  ON shared_watchlist
-  FOR SELECT
-  TO authenticated
-  USING (true);
+-- Create policies for shared_watchlist table (handle duplicates)
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can read shared watchlist" ON shared_watchlist;
+  
+  -- Create the policy
+  CREATE POLICY "Users can read shared watchlist"
+    ON shared_watchlist
+    FOR SELECT
+    TO authenticated
+    USING (true);
+END $$;
 
-CREATE POLICY "Users can manage shared watchlist"
-  ON shared_watchlist
-  FOR ALL
-  TO authenticated
-  USING (true)
-  WITH CHECK (true);
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can manage shared watchlist" ON shared_watchlist;
+  
+  -- Create the policy
+  CREATE POLICY "Users can manage shared watchlist"
+    ON shared_watchlist
+    FOR ALL
+    TO authenticated
+    USING (true)
+    WITH CHECK (true);
+END $$;
 
 -- Create watched_movies table
 CREATE TABLE IF NOT EXISTS watched_movies (
@@ .. @@
 -- Enable RLS on watched_movies table
 ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;
 
--- Create policies for watched_movies table
-CREATE POLICY "Users can manage their own watched movies"
-  ON watched_movies
-  FOR ALL
-  TO authenticated
-  USING (auth.uid() = user_id)
-  WITH CHECK (auth.uid() = user_id);
+-- Create policies for watched_movies table (handle duplicates)
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can manage their own watched movies" ON watched_movies;
+  
+  -- Create the policy
+  CREATE POLICY "Users can manage their own watched movies"
+    ON watched_movies
+    FOR ALL
+    TO authenticated
+    USING (auth.uid() = user_id)
+    WITH CHECK (auth.uid() = user_id);
+END $$;
 
-CREATE POLICY "Users can read all watched movies"
-  ON watched_movies
-  FOR SELECT
-  TO authenticated
-  USING (true);
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can read all watched movies" ON watched_movies;
+  
+  -- Create the policy
+  CREATE POLICY "Users can read all watched movies"
+    ON watched_movies
+    FOR SELECT
+    TO authenticated
+    USING (true);
+END $$;
 
 -- Create ratings table
 CREATE TABLE IF NOT EXISTS ratings (
@@ .. @@
 -- Enable RLS on ratings table
 ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
 
--- Create policies for ratings table
-CREATE POLICY "Users can manage their own ratings"
-  ON ratings
-  FOR ALL
-  TO authenticated
-  USING (auth.uid() = user_id)
-  WITH CHECK (auth.uid() = user_id);
+-- Create policies for ratings table (handle duplicates)
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;
+  
+  -- Create the policy
+  CREATE POLICY "Users can manage their own ratings"
+    ON ratings
+    FOR ALL
+    TO authenticated
+    USING (auth.uid() = user_id)
+    WITH CHECK (auth.uid() = user_id);
+END $$;
 
-CREATE POLICY "Users can read all ratings"
-  ON ratings
-  FOR SELECT
-  TO authenticated
-  USING (true);
+DO $$
+BEGIN
+  -- Drop existing policy if it exists
+  DROP POLICY IF EXISTS "Users can read all ratings" ON ratings;
+  
+  -- Create the policy
+  CREATE POLICY "Users can read all ratings"
+    ON ratings
+    FOR SELECT
+    TO authenticated
+    USING (true);
+END $$;