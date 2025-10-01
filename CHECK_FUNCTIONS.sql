-- Run this FIRST to see what match_summaries functions exist in your database
-- This will help diagnose the "function name is not unique" error

-- 1. List ALL match_summaries functions with their full signatures
SELECT
  p.oid::regprocedure::text as full_signature,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.pronargs as num_args
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'match_summaries'
  AND n.nspname = 'public'
ORDER BY p.pronargs;

-- Expected output:
-- If you see multiple rows, that's why you get "function name is not unique"
-- You should see something like:
--   full_signature                                          | arguments                                          | num_args
--   match_summaries(vector,double precision,integer,uuid)   | query_embedding vector, match_threshold double...  | 4
--   match_summaries(vector,double precision,integer,uuid,uuid) | query_embedding vector, match_threshold double...| 5
