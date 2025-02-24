/*
  # Clear all data from database
  
  This migration removes all data from the following tables while preserving their structure:
  - recommendations
  - ratings
  - personal_watchlist
  - shared_watchlist
*/

-- Clear all data
TRUNCATE TABLE recommendations CASCADE;
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE personal_watchlist CASCADE;
TRUNCATE TABLE shared_watchlist CASCADE;