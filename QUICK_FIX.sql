-- QUICK FIX: Run this to manually drop all match_summaries functions
-- Then run the full migration file

-- This will drop ALL versions of match_summaries
DO $$
DECLARE
  func_record RECORD;
BEGIN
  RAISE NOTICE 'Searching for match_summaries functions...';

  FOR func_record IN
    SELECT
      p.oid::regprocedure::text as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'match_summaries'
      AND n.nspname = 'public'
  LOOP
    EXECUTE 'DROP FUNCTION ' || func_record.func_signature;
    RAISE NOTICE 'Dropped: %', func_record.func_signature;
  END LOOP;

  RAISE NOTICE 'Done! All match_summaries functions have been dropped.';
  RAISE NOTICE 'Now run the full migration file.';
END $$;
