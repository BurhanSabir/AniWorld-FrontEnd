import { getSupabaseClient } from "./client"

// Function to set up the database schema
export async function setupDatabase() {
  const supabase = getSupabaseClient()

  try {
    console.log("Setting up database schema...")

    // Create the stored procedure for creating the watchlist table
    const createProcedureSql = `
      CREATE OR REPLACE FUNCTION create_watchlist_table()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Create the watchlist table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.watchlist (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          media_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, media_id, media_type)
        );
        
        -- Add appropriate indexes for performance
        CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON public.watchlist (user_id);
        CREATE INDEX IF NOT EXISTS watchlist_media_idx ON public.watchlist (media_id, media_type);
        
        -- Add RLS (Row Level Security) policies
        ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
        
        -- Policy for watchlist: users can only see and modify their own entries
        DROP POLICY IF EXISTS watchlist_user_policy ON public.watchlist;
        CREATE POLICY watchlist_user_policy ON public.watchlist
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
        
        -- Grant access to authenticated users
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
        
        RETURN true;
      END;
      $$;
    `

    // Execute the SQL to create the stored procedure
    const { error: procedureError } = await supabase.rpc("exec_sql", { sql: createProcedureSql })

    if (procedureError) {
      console.error("Error creating stored procedure:", procedureError)

      // If we can't create the stored procedure, let's try a direct approach
      // This is a fallback and might not work depending on permissions
      console.log("Attempting direct table creation...")

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS public.watchlist (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          media_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, media_id, media_type)
        );
      `

      const { error: tableError } = await supabase.rpc("exec_sql", { sql: createTableSql })

      if (tableError) {
        console.error("Error creating table directly:", tableError)

        // If all else fails, provide clear instructions
        console.error(`
          Unable to automatically create the watchlist table. 
          Please run the following SQL in your Supabase SQL editor:
          
          CREATE TABLE IF NOT EXISTS public.watchlist (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            media_id INTEGER NOT NULL,
            media_type TEXT NOT NULL,
            added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, media_id, media_type)
          );
          
          -- Add appropriate indexes for performance
          CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON public.watchlist (user_id);
          CREATE INDEX IF NOT EXISTS watchlist_media_idx ON public.watchlist (media_id, media_type);
          
          -- Add RLS (Row Level Security) policies
          ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
          
          -- Policy for watchlist: users can only see and modify their own entries
          DROP POLICY IF EXISTS watchlist_user_policy ON public.watchlist;
          CREATE POLICY watchlist_user_policy ON public.watchlist
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
          
          -- Grant access to authenticated users
          GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
        `)

        return false
      }

      console.log("Table created directly successfully")
      return true
    }

    console.log("Stored procedure created successfully")

    // Now call the stored procedure to create the table
    const { error: callError } = await supabase.rpc("create_watchlist_table")

    if (callError) {
      console.error("Error calling create_watchlist_table procedure:", callError)
      return false
    }

    console.log("Database setup completed successfully")
    return true
  } catch (error) {
    console.error("Error setting up database:", error)
    return false
  }
}

// Function to execute SQL directly (requires admin privileges)
export async function executeSql(sql: string) {
  const supabase = getSupabaseClient()

  try {
    // This function requires the 'exec_sql' stored procedure to be available
    // which might not be the case in all Supabase instances
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error executing SQL:", error)
    return false
  }
}
