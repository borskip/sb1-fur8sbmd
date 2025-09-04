@@ .. @@
 /*
-  # Complete Movie Tracker Database Schema
+  # Complete Movie Tracker Database Schema - Single Source of Truth
   
   This migration sets up the complete database schema for the movie tracker application.
   
@@ .. @@
   6. Verification queries to confirm setup
   
   ## Security
-  - Row Level Security (RLS) enabled on all tables
-  - Policies for authenticated users to manage their own data
-  - Public read access where appropriate
+  - All policies use DROP IF EXISTS to prevent duplicates
+  - This migration can be run multiple times safely
+  - Single source of truth for all policies
 */
 
+-- First, clean up any existing policies from previous migrations
+DROP POLICY IF EXISTS "Users can read all users" ON users;
+DROP POLICY IF EXISTS "Users can update their own profile" ON users;
+DROP POLICY IF EXISTS "Users can manage their own watchlist items" ON personal_watchlist;
+DROP POLICY IF EXISTS "Users can read all watchlists" ON personal_watchlist;
+DROP POLICY IF EXISTS "Users can read shared watchlist" ON shared_watchlist;
+DROP POLICY IF EXISTS "Users can manage shared watchlist" ON shared_watchlist;
+DROP POLICY IF EXISTS "Users can manage their own watched movies" ON watched_movies;
+DROP POLICY IF EXISTS "Users can read all watched movies" ON watched_movies;
+DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;
+DROP POLICY IF EXISTS "Users can read all ratings" ON ratings;
+
+-- Also clean up any policies with different names that might exist
+DROP POLICY IF EXISTS "Allow users to read any watchlist" ON personal_watchlist;
+DROP POLICY IF EXISTS "Allow users to manage their watchlist" ON personal_watchlist;
+DROP POLICY IF EXISTS "Allow users to read shared watchlist" ON shared_watchlist;
+DROP POLICY IF EXISTS "Allow users to manage shared watchlist" ON shared_watchlist;
+DROP POLICY IF EXISTS "Allow users to manage their watched movies" ON watched_movies;
+DROP POLICY IF EXISTS "Allow users to read any watched movie" ON watched_movies;
+DROP POLICY IF EXISTS "Allow users to manage their ratings" ON ratings;
+DROP POLICY IF EXISTS "Allow users to read any rating" ON ratings;
+
 -- Create users table
 CREATE TABLE IF NOT EXISTS users (
@@ .. @@
 -- Enable RLS on users table
 ALTER TABLE users ENABLE ROW LEVEL SECURITY;
 
--- Create policies for users table (handle duplicates)
-DROP POLICY IF EXISTS "Users can read all users" ON users;
+-- Create policies for users table
 CREATE POLICY "Users can read all users"
   ON users
   FOR SELECT
   TO authenticated
   USING (true);
 
-DROP POLICY IF EXISTS "Users can update their own profile" ON users;
 CREATE POLICY "Users can update their own profile"
   ON users
   FOR UPDATE
@@ .. @@
 -- Enable RLS on personal_watchlist table
 ALTER TABLE personal_watchlist ENABLE ROW LEVEL SECURITY;
 
--- Create policies for personal_watchlist table (handle duplicates)
-DROP POLICY IF EXISTS "Users can manage their own watchlist items" ON personal_watchlist;
+-- Create policies for personal_watchlist table
 CREATE POLICY "Users can manage their own watchlist items"
   ON personal_watchlist
   FOR ALL
@@ .. @@
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can read all watchlists" ON personal_watchlist;
 CREATE POLICY "Users can read all watchlists"
   ON personal_watchlist
   FOR SELECT
@@ .. @@
 -- Enable RLS on shared_watchlist table
 ALTER TABLE shared_watchlist ENABLE ROW LEVEL SECURITY;
 
--- Create policies for shared_watchlist table (handle duplicates)
-DROP POLICY IF EXISTS "Users can read shared watchlist" ON shared_watchlist;
+-- Create policies for shared_watchlist table
 CREATE POLICY "Users can read shared watchlist"
   ON shared_watchlist
   FOR SELECT
   TO authenticated
   USING (true);
 
-DROP POLICY IF EXISTS "Users can manage shared watchlist" ON shared_watchlist;
 CREATE POLICY "Users can manage shared watchlist"
   ON shared_watchlist
   FOR ALL
@@ .. @@
 -- Enable RLS on watched_movies table
 ALTER TABLE watched_movies ENABLE ROW LEVEL SECURITY;
 
--- Create policies for watched_movies table (handle duplicates)
-DROP POLICY IF EXISTS "Users can manage their own watched movies" ON watched_movies;
+-- Create policies for watched_movies table
 CREATE POLICY "Users can manage their own watched movies"
   ON watched_movies
   FOR ALL
@@ .. @@
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can read all watched movies" ON watched_movies;
 CREATE POLICY "Users can read all watched movies"
   ON watched_movies
   FOR SELECT
@@ .. @@
 -- Enable RLS on ratings table
 ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
 
--- Create policies for ratings table (handle duplicates)
-DROP POLICY IF EXISTS "Users can manage their own ratings" ON ratings;
+-- Create policies for ratings table
 CREATE POLICY "Users can manage their own ratings"
   ON ratings
   FOR ALL
@@ .. @@
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can read all ratings" ON ratings;
 CREATE POLICY "Users can read all ratings"
   ON ratings
   FOR SELECT