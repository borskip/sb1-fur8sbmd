/*
  # Clear shared watchlist and ratings

  1. Changes
    - Removes all movies from the shared watchlist
    - Removes all want-to-see ratings for shared watchlist movies
*/

-- Clear all want-to-see ratings from personal watchlist
DELETE FROM personal_watchlist
WHERE want_to_see_rating IS NOT NULL;

-- Clear all movies from shared watchlist
TRUNCATE TABLE shared_watchlist;