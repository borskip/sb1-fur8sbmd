@@ .. @@
 /*
-  # Consolidate and fix duplicate policies
+  # Policy Consolidation and Cleanup Migration
   
   1. Purpose
-    - Remove all existing policies to prevent duplicates
-    - Create clean, consistent policies with unique names
-    - Ensure RLS is properly configured
+    - This migration safely removes duplicate policies from previous migrations
+    - Creates clean, consistent policies with unique names  
+    - Can be run multiple times safely (idempotent)
+    - Does NOT affect table structure - only policies
   
   2. Tables Affected
     - users (with RLS policies)
@@ .. @@
     - tv_watchlist (with RLS policies)
     - tv_ratings (with RLS policies)
     - watched_movies (with RLS policies)
+
+  3. Migration Strategy
+    - This is a POLICY-ONLY migration
+    - Table structures remain unchanged
+    - Existing data is preserved
+    - Only policies are cleaned up and recreated
 */
 
-DO $$
-DECLARE
-    r RECORD;
-BEGIN
-    -- Remove all existing policies from all tables to prevent conflicts
-    FOR r IN (
-        SELECT schemaname, tablename, policyname 
-        FROM pg_policies 
-        WHERE schemaname = 'public'
-    ) LOOP
-        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
-                      r.policyname, r.schemaname, r.tablename);
-    END LOOP;
-END $$;
+-- Step 1: Clean up duplicate policies safely
+-- This removes policies that might have been created by previous migrations
+
+-- Users table policies
+DROP POLICY IF EXISTS "Users can read all users" ON users;
+DROP POLICY IF EXISTS "Users can update their own profile" ON users;
+DROP POLICY IF EXISTS "Allow users to read all users" ON users;
+DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
+
+-- Personal watchlist policies  
+DROP POLICY IF EXISTS "Users can manage their own watchlist items" ON personal_watchlist;
+DROP POLICY IF EXISTS "Users can read all watchlists" ON personal_watchlist;
+DROP POLICY IF EXISTS "Allow users to manage their watchlist" ON personal_watchlist;
+DROP POLICY IF EXISTS "Allow users to read any watchlist" ON personal_watchlist;
+
+-- Shared watchlist policies
+DROP POLICY IF EXISTS "Allow users to read shared watchlist" ON shared_watchlist;
+DROP POLICY IF EXISTS "Allow users to insert into shared watchlist" ON shared_watchlist;
+DROP POLICY IF EXISTS "Allow users to update shared watchlist" ON shared_watchlist;
+DROP POLICY IF EXISTS "Allow any user to delete from shared watchlist" ON shared_watchlist;
+
+-- Watched movies policies
+DROP POLICY IF EXISTS "Allow users to manage their watched movies" ON watched_movies;
+DROP POLICY IF EXISTS "Allow users to read any watched movie" ON watched_movies;
+
+-- Ratings policies
+DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;
+DROP POLICY IF EXISTS "Users can read all ratings" ON ratings;
+DROP POLICY IF EXISTS "Allow users to manage their ratings" ON ratings;
+DROP POLICY IF EXISTS "Allow users to read any rating" ON ratings;
+
+-- TV watchlist policies
+DROP POLICY IF EXISTS "Allow users to manage their TV watchlist" ON tv_watchlist;
+DROP POLICY IF EXISTS "Allow users to read any TV watchlist" ON tv_watchlist;
+
+-- TV ratings policies  
+DROP POLICY IF EXISTS "Allow users to manage their TV ratings" ON tv_ratings;
+DROP POLICY IF EXISTS "Allow users to read any TV rating" ON tv_ratings;
+
+-- Recommendations policies
+DROP POLICY IF EXISTS "Allow users to create recommendations" ON recommendations;
+DROP POLICY IF EXISTS "Allow users to read recommendations" ON recommendations;
+DROP POLICY IF EXISTS "Allow users to update their recommendations" ON recommendations;
+
+-- Step 2: Create clean, consistent policies with unique names