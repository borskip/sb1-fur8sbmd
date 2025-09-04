@@ .. @@
 -- Insert test users
 INSERT INTO users (id, username, avatar_url) VALUES
   ('550e8400-e29b-41d4-a716-446655440000', 'Dario', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dario&style=circle&backgroundColor=b6e3f4&hairColor=2c1b18&facialHairType=beardMedium&facialHairColor=2c1b18&skinColor=f8d25c'),
   ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Sep', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sep&style=circle&backgroundColor=b6e3f4&hairColor=f9d71c&facialHairType=blank&skinColor=ffdbb4'),
   ('7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Rob', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rob&style=circle&backgroundColor=b6e3f4&hairColor=000000&facialHairType=blank&skinColor=edb98a&eyes=happy')
 ON CONFLICT (id) DO NOTHING;
+
+-- ✅ VERIFICATION QUERIES - Run these to check if migration was successful
+-- Check if all tables exist
+SELECT 
+  schemaname,
+  tablename,
+  tableowner
+FROM pg_tables 
+WHERE schemaname = 'public' 
+  AND tablename IN ('users', 'personal_watchlist', 'shared_watchlist', 'watched_movies', 'ratings')
+ORDER BY tablename;
+
+-- Check if RLS is enabled on all tables
+SELECT 
+  schemaname,
+  tablename,
+  rowsecurity as rls_enabled
+FROM pg_tables 
+WHERE schemaname = 'public' 
+  AND tablename IN ('users', 'personal_watchlist', 'shared_watchlist', 'watched_movies', 'ratings')
+ORDER BY tablename;
+
+-- Check policies
+SELECT 
+  schemaname,
+  tablename,
+  policyname,
+  permissive,
+  roles,
+  cmd
+FROM pg_policies 
+WHERE schemaname = 'public'
+ORDER BY tablename, policyname;
+
+-- Check test users
+SELECT id, username, created_at FROM users ORDER BY username;
+
+-- Check foreign key constraints
+SELECT
+  tc.table_name,
+  tc.constraint_name,
+  tc.constraint_type,
+  kcu.column_name,
+  ccu.table_name AS foreign_table_name,
+  ccu.column_name AS foreign_column_name
+FROM information_schema.table_constraints AS tc
+JOIN information_schema.key_column_usage AS kcu
+  ON tc.constraint_name = kcu.constraint_name
+  AND tc.table_schema = kcu.table_schema
+JOIN information_schema.constraint_column_usage AS ccu
+  ON ccu.constraint_name = tc.constraint_name
+  AND ccu.table_schema = tc.table_schema
+WHERE tc.constraint_type = 'FOREIGN KEY'
+  AND tc.table_schema = 'public'
+ORDER BY tc.table_name, tc.constraint_name;