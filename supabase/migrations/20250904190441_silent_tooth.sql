-- Diagnose: toon alle policies per tabel, gesorteerd op naam
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Specifiek: waar komt deze fout vandaan?
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname = 'Users can read all users';

-- Extra diagnostics: alle policies op users tabel
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Toon alle tabellen met RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;