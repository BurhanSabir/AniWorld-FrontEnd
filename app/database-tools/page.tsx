import type { Metadata } from "next"
import { DatabaseDiagnostic } from "@/components/database-diagnostic"
import { DatabaseRepair } from "@/components/database-repair"

export const metadata: Metadata = {
  title: "Database Tools - AniWorld",
  description: "Database diagnostic and repair tools for AniWorld",
}

export default function DatabaseToolsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Database Tools</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Diagnostic</h2>
          <DatabaseDiagnostic />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Repair</h2>
          <DatabaseRepair />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Manual Setup Instructions</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p>
            If you're experiencing issues with the database setup, you can manually create the required tables by
            following these steps:
          </p>

          <ol>
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to the SQL Editor</li>
            <li>Create a new query</li>
            <li>
              Copy and paste the SQL code from <code>supabase/migrations/create_tables.sql</code>
            </li>
            <li>Run the query</li>
            <li>Refresh the application</li>
          </ol>

          <p>Additionally, you need to create a helper function for the application to work properly:</p>

          <pre className="bg-muted p-4 rounded-md overflow-auto">
            <code>{`
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

-- Function to execute arbitrary SQL (requires admin privileges)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
            `}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
