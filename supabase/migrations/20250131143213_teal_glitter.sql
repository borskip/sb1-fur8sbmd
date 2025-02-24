/*
  # Query to check Rob's personal watchlist

  This query will show:
  1. All movies in Rob's personal watchlist
  2. Their want-to-see ratings (if any)
  3. When they were added
*/

SELECT 
  pw.*,
  u.username
FROM personal_watchlist pw
JOIN users u ON u.id = pw.user_id
WHERE u.username = 'rob'
ORDER BY pw.added_at DESC;