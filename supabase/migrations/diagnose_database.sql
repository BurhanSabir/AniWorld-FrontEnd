-- Diagnose the watchlist table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'watchlist';

-- Check if the watchlist table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'watchlist'
);

-- Create a function to get table columns if it doesn't exist
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS text[] 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  columns text[];
BEGIN
  SELECT array_agg(column_name::text) INTO columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = $1;
  
  RETURN columns;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns TO authenticated;
