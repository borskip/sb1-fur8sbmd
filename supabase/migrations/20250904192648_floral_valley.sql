@@ .. @@
 -- Verification: Show all tables with RLS status
 SELECT 
   schemaname,
   tablename,
-  row_security as rls_enabled
-FROM information_schema.tables 
-WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
+  rowsecurity as rls_enabled
+FROM pg_tables 
+WHERE schemaname = 'public'
 ORDER BY tablename;
 
 -- Verification: Show all policies
@@ .. @@
   policyname,
   permissive,
   roles,
   cmd
 FROM pg_policies 
 WHERE schemaname = 'public'
 ORDER BY tablename, policyname;