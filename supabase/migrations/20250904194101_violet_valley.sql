-- =========================================================
-- Verification suite voor Movie Tracker schema (read-only)
-- =========================================================

-- 0) Migratiestatus (Supabase)
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- 1) Bestaan van vereiste tabellen
WITH req(table_name) AS (
  VALUES
    ('users'),
    ('personal_watchlist'),
    ('shared_watchlist'),
    ('watched_movies'),
    ('ratings'),
    ('recommendations'),
    ('tv_watchlist'),
    ('tv_ratings')
)
SELECT r.table_name,
       CASE WHEN t.tablename IS NULL THEN 'MISSING' ELSE 'OK' END AS status
FROM req r
LEFT JOIN pg_tables t
  ON t.schemaname = 'public' AND t.tablename = r.table_name
ORDER BY r.table_name;

-- 2) Vereiste kolommen aanwezig?
WITH req(table_name, column_name) AS (
  VALUES
    -- users
    ('users','id'), ('users','username'), ('users','avatar_url'), ('users','created_at'),
    -- personal_watchlist
    ('personal_watchlist','id'), ('personal_watchlist','user_id'), ('personal_watchlist','movie_id'),
    ('personal_watchlist','movie_data'), ('personal_watchlist','want_to_see_rating'), ('personal_watchlist','added_at'),
    -- shared_watchlist
    ('shared_watchlist','id'), ('shared_watchlist','movie_id'), ('shared_watchlist','movie_data'),
    ('shared_watchlist','added_by'), ('shared_watchlist','added_at'), ('shared_watchlist','scheduled_for'),
    -- watched_movies
    ('watched_movies','id'), ('watched_movies','user_id'), ('watched_movies','movie_id'),
    ('watched_movies','movie_data'), ('watched_movies','watched_at'), ('watched_movies','created_at'),
    -- ratings
    ('ratings','id'), ('ratings','user_id'), ('ratings','movie_id'),
    ('ratings','rating'), ('ratings','created_at'), ('ratings','updated_at'),
    -- recommendations
    ('recommendations','id'), ('recommendations','from_user_id'), ('recommendations','to_user_id'),
    ('recommendations','movie_data'), ('recommendations','status'), ('recommendations','created_at'),
    -- tv_watchlist
    ('tv_watchlist','id'), ('tv_watchlist','user_id'), ('tv_watchlist','show_id'),
    ('tv_watchlist','show_data'), ('tv_watchlist','want_to_see_rating'), ('tv_watchlist','added_at'),
    ('tv_watchlist','watched'), ('tv_watchlist','shared'), ('tv_watchlist','scheduled_for'),
    -- tv_ratings
    ('tv_ratings','id'), ('tv_ratings','user_id'), ('tv_ratings','show_id'),
    ('tv_ratings','rating'), ('tv_ratings','created_at'), ('tv_ratings','updated_at')
)
SELECT r.table_name, r.column_name,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'OK' END AS status
FROM req r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name  = r.table_name
 AND c.column_name = r.column_name
ORDER BY r.table_name, r.column_name;

-- 3) RLS status per tabel (TRUE verwacht)
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users','personal_watchlist','shared_watchlist',
    'watched_movies','ratings','recommendations',
    'tv_watchlist','tv_ratings'
  )
ORDER BY tablename;

-- 4) Overzicht alle policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5) Verwachte policies aanwezig?
WITH expected(table_name, policyname) AS (
  VALUES
    -- users
    ('users','users_read_all'),
    ('users','users_update_own'),
    -- personal_watchlist
    ('personal_watchlist','personal_watchlist_read_all'),
    ('personal_watchlist','personal_watchlist_manage_own'),
    -- shared_watchlist
    ('shared_watchlist','shared_watchlist_read_all'),
    ('shared_watchlist','shared_watchlist_insert'),
    ('shared_watchlist','shared_watchlist_update'),
    ('shared_watchlist','shared_watchlist_delete'),
    -- watched_movies
    ('watched_movies','watched_movies_read_all'),
    ('watched_movies','watched_movies_manage_own'),
    -- ratings
    ('ratings','ratings_read_all'),
    ('ratings','ratings_manage_own'),
    -- recommendations
    ('recommendations','recommendations_read_all'),
    ('recommendations','recommendations_create'),
    ('recommendations','recommendations_update_recipient'),
    -- tv_watchlist
    ('tv_watchlist','tv_watchlist_read_all'),
    ('tv_watchlist','tv_watchlist_manage_own'),
    -- tv_ratings
    ('tv_ratings','tv_ratings_read_all'),
    ('tv_ratings','tv_ratings_manage_own')
)
SELECT e.table_name, e.policyname,
       CASE WHEN p.policyname IS NULL THEN 'MISSING' ELSE 'OK' END AS status
FROM expected e
LEFT JOIN pg_policies p
  ON p.schemaname = 'public'
 AND p.tablename  = e.table_name
 AND p.policyname = e.policyname
ORDER BY e.table_name, e.policyname;

-- 6) Indexen aanwezig?
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'personal_watchlist','shared_watchlist','watched_movies',
    'ratings','recommendations','tv_watchlist','tv_ratings'
  )
ORDER BY tablename, indexname;

-- 7) Verwachte indexen aanwezig?
WITH expected(tablename, indexname) AS (
  VALUES
    ('personal_watchlist','idx_personal_watchlist_user_id'),
    ('personal_watchlist','idx_personal_watchlist_movie_id'),
    ('shared_watchlist','idx_shared_watchlist_movie_id'),
    ('watched_movies','idx_watched_movies_user_id'),
    ('watched_movies','idx_watched_movies_movie_id'),
    ('ratings','idx_ratings_user_id'),
    ('ratings','idx_ratings_movie_id'),
    ('recommendations','idx_recommendations_to_user'),
    ('tv_watchlist','idx_tv_watchlist_user_id'),
    ('tv_ratings','idx_tv_ratings_user_id')
)
SELECT e.tablename, e.indexname,
       CASE WHEN i.indexname IS NULL THEN 'MISSING' ELSE 'OK' END AS status
FROM expected e
LEFT JOIN pg_indexes i
  ON i.schemaname = 'public'
 AND i.tablename  = e.tablename
 AND i.indexname  = e.indexname
ORDER BY e.tablename, e.indexname;

-- 8) (Optioneel) Check of gen_random_uuid() beschikbaar is
SELECT proname AS function_name
FROM pg_proc
WHERE proname = 'gen_random_uuid';