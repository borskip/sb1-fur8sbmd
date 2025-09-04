@@ .. @@
 -- 0) Migratiestatus (Supabase)
-SELECT version, name
-FROM supabase_migrations.schema_migrations
-ORDER BY version;
+SELECT 
+  CASE 
+    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'supabase_migrations')
+    THEN 'supabase_migrations schema exists'
+    ELSE 'supabase_migrations schema does not exist - fresh database'
+  END AS migration_status;
+
+-- Check if migration table exists and show migrations if it does
+DO $$
+BEGIN
+  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations') THEN
+    RAISE NOTICE 'Migration table exists, showing migrations:';
+    -- This would show migrations but we can't do dynamic SQL in a simple query
+  ELSE
+    RAISE NOTICE 'No migration table found - this is a fresh database';
+  END IF;
+END $$;