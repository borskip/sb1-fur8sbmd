-- Diagnose: show all policies per table, sorted by name
SELECT 'ALL POLICIES:' as section;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Specific: where does this error come from?
SELECT 'DUPLICATE POLICY SEARCH:' as section;
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname = 'Users can read all users';

-- Show all policies on users table
SELECT 'USERS TABLE POLICIES:' as section;
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Show RLS status for all tables
SELECT 'RLS STATUS:' as section;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count policies per table
SELECT 'POLICY COUNT PER TABLE:' as section;
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- Show migration history
SELECT 'MIGRATION HISTORY:' as section;
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 10;