-- Function to get column names for a table
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
