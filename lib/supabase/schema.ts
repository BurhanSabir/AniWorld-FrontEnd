import { getSupabaseClient } from "./client"

/**
 * Database schema definition for the application
 * This helps ensure consistency across the application
 */
export const DB_SCHEMA = {
  TABLES: {
    PROFILES: "profiles",
    WATCHLIST: "watchlist",
    RATINGS: "ratings",
  },
  COLUMNS: {
    PROFILES: {
      ID: "id",
      USERNAME: "username",
      AVATAR_URL: "avatar_url",
      EMAIL: "email",
      BIO: "bio",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
    WATCHLIST: {
      ID: "id",
      USER_ID: "user_id",
      MEDIA_ID: "media_id",
      MEDIA_TYPE: "media_type",
      ADDED_AT: "added_at",
    },
    RATINGS: {
      ID: "id",
      USER_ID: "user_id",
      MEDIA_ID: "media_id",
      MEDIA_TYPE: "media_type",
      RATING: "rating",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },
}

/**
 * SQL statements to create the necessary tables if they don't exist
 */
const CREATE_WATCHLIST_TABLE = `
CREATE TABLE IF NOT EXISTS public.${DB_SCHEMA.TABLES.WATCHLIST} (
  ${DB_SCHEMA.COLUMNS.WATCHLIST.ID} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ${DB_SCHEMA.COLUMNS.WATCHLIST.USER_ID} UUID REFERENCES auth.users(id) NOT NULL,
  ${DB_SCHEMA.COLUMNS.WATCHLIST.MEDIA_ID} INTEGER NOT NULL,
  ${DB_SCHEMA.COLUMNS.WATCHLIST.MEDIA_TYPE} TEXT NOT NULL,
  ${DB_SCHEMA.COLUMNS.WATCHLIST.ADDED_AT} TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(${DB_SCHEMA.COLUMNS.WATCHLIST.USER_ID}, ${DB_SCHEMA.COLUMNS.WATCHLIST.MEDIA_ID}, ${DB_SCHEMA.COLUMNS.WATCHLIST.MEDIA_TYPE})
);

-- Add RLS policies for the watchlist table
ALTER TABLE public.${DB_SCHEMA.TABLES.WATCHLIST} ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own watchlist items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.WATCHLIST}' AND policyname = 'watchlist_select_policy'
  ) THEN
    CREATE POLICY watchlist_select_policy ON public.${DB_SCHEMA.TABLES.WATCHLIST}
      FOR SELECT
      USING (auth.uid() = ${DB_SCHEMA.COLUMNS.WATCHLIST.USER_ID});
  END IF;
END
$$;

-- Policy to allow users to insert only their own watchlist items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.WATCHLIST}' AND policyname = 'watchlist_insert_policy'
  ) THEN
    CREATE POLICY watchlist_insert_policy ON public.${DB_SCHEMA.TABLES.WATCHLIST}
      FOR INSERT
      WITH CHECK (auth.uid() = ${DB_SCHEMA.COLUMNS.WATCHLIST.USER_ID});
  END IF;
END
$$;

-- Policy to allow users to update only their own watchlist items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.WATCHLIST}' AND policyname = 'watchlist_update_policy'
  ) THEN
    CREATE POLICY watchlist_update_policy ON public.${DB_SCHEMA.TABLES.WATCHLIST}
      FOR UPDATE
      USING (auth.uid() = ${DB_SCHEMA.COLUMNS.WATCHLIST.USER_ID});
  END IF;
END
$$;

-- Policy to allow users to delete only their own watchlist items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.WATCHLIST}' AND policyname = 'watchlist_delete_policy'
  ) THEN
    CREATE POLICY watchlist_delete_policy ON public.${DB_SCHEMA.TABLES.WATCHLIST}
      FOR DELETE
      USING (auth.uid() = ${DB_SCHEMA.COLUMNS.WATCHLIST.USER_ID});
  END IF;
END
$$;
`

const CREATE_RATINGS_TABLE = `
CREATE TABLE IF NOT EXISTS public.${DB_SCHEMA.TABLES.RATINGS} (
  ${DB_SCHEMA.COLUMNS.RATINGS.ID} UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ${DB_SCHEMA.COLUMNS.RATINGS.USER_ID} UUID REFERENCES auth.users(id) NOT NULL,
  ${DB_SCHEMA.COLUMNS.RATINGS.MEDIA_ID} INTEGER NOT NULL,
  ${DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE} TEXT NOT NULL,
  ${DB_SCHEMA.COLUMNS.RATINGS.RATING} INTEGER NOT NULL,
  ${DB_SCHEMA.COLUMNS.RATINGS.CREATED_AT} TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ${DB_SCHEMA.COLUMNS.RATINGS.UPDATED_AT} TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(${DB_SCHEMA.COLUMNS.RATINGS.USER_ID}, ${DB_SCHEMA.COLUMNS.RATINGS.MEDIA_ID}, ${DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE})
);

-- Add RLS policies for the ratings table
ALTER TABLE public.${DB_SCHEMA.TABLES.RATINGS} ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.RATINGS}' AND policyname = 'ratings_select_policy'
  ) THEN
    CREATE POLICY ratings_select_policy ON public.${DB_SCHEMA.TABLES.RATINGS}
      FOR SELECT
      USING (auth.uid() = ${DB_SCHEMA.COLUMNS.RATINGS.USER_ID});
  END IF;
END
$$;

-- Policy to allow users to insert only their own ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.RATINGS}' AND policyname = 'ratings_insert_policy'
  ) THEN
    CREATE POLICY ratings_insert_policy ON public.${DB_SCHEMA.TABLES.RATINGS}
      FOR INSERT
      WITH CHECK (auth.uid() = ${DB_SCHEMA.COLUMNS.RATINGS.USER_ID});
  END IF;
END
$$;

-- Policy to allow users to update only their own ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.RATINGS}' AND policyname = 'ratings_update_policy'
  ) THEN
    CREATE POLICY ratings_update_policy ON public.${DB_SCHEMA.TABLES.RATINGS}
      FOR UPDATE
      USING (auth.uid() = ${DB_SCHEMA.COLUMNS.RATINGS.USER_ID});
  END IF;
END
$$;

-- Policy to allow users to delete only their own ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.RATINGS}' AND policyname = 'ratings_delete_policy'
  ) THEN
    CREATE POLICY ratings_delete_policy ON public.${DB_SCHEMA.TABLES.RATINGS}
      FOR DELETE
      USING (auth.uid() = ${DB_SCHEMA.COLUMNS.RATINGS.USER_ID});
  END IF;
END
$$;
`

const CREATE_PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS public.${DB_SCHEMA.TABLES.PROFILES} (
  ${DB_SCHEMA.COLUMNS.PROFILES.ID} UUID PRIMARY KEY REFERENCES auth.users(id),
  ${DB_SCHEMA.COLUMNS.PROFILES.USERNAME} TEXT,
  ${DB_SCHEMA.COLUMNS.PROFILES.AVATAR_URL} TEXT,
  ${DB_SCHEMA.COLUMNS.PROFILES.EMAIL} TEXT,
  ${DB_SCHEMA.COLUMNS.PROFILES.BIO} TEXT,
  ${DB_SCHEMA.COLUMNS.PROFILES.CREATED_AT} TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ${DB_SCHEMA.COLUMNS.PROFILES.UPDATED_AT} TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for the profiles table
ALTER TABLE public.${DB_SCHEMA.TABLES.PROFILES} ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select any profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.PROFILES}' AND policyname = 'profiles_select_policy'
  ) THEN
    CREATE POLICY profiles_select_policy ON public.${DB_SCHEMA.TABLES.PROFILES}
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- Policy to allow users to insert only their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.PROFILES}' AND policyname = 'profiles_insert_policy'
  ) THEN
    CREATE POLICY profiles_insert_policy ON public.${DB_SCHEMA.TABLES.PROFILES}
      FOR INSERT
      WITH CHECK (auth.uid() = ${DB_SCHEMA.COLUMNS.PROFILES.ID});
  END IF;
END
$$;

-- Policy to allow users to update only their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = '${DB_SCHEMA.TABLES.PROFILES}' AND policyname = 'profiles_update_policy'
  ) THEN
    CREATE POLICY profiles_update_policy ON public.${DB_SCHEMA.TABLES.PROFILES}
      FOR UPDATE
      USING (auth.uid() = ${DB_SCHEMA.COLUMNS.PROFILES.ID});
  END IF;
END
$$;
`

/**
 * Checks if a table has the expected columns
 * @param tableName The name of the table to check
 * @param expectedColumns Array of expected column names
 * @returns A promise that resolves to a boolean indicating if the table has all expected columns
 */
export async function tableHasColumns(tableName: string, expectedColumns: string[]): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Try to use the get_table_columns function if it exists
    const { data, error } = await supabase.rpc("get_table_columns", { table_name: tableName })

    if (error) {
      console.error(`Error fetching columns for ${tableName}:`, error)

      // Fallback: try to infer columns from a query
      const { data: sampleData, error: sampleError } = await supabase.from(tableName).select("*").limit(1)

      if (sampleError) {
        console.error(`Error fetching sample data from ${tableName}:`, sampleError)
        return false
      }

      if (!sampleData || sampleData.length === 0) {
        return false
      }

      const actualColumns = Object.keys(sampleData[0]).map((col) => col.toLowerCase())
      return expectedColumns.every((col) => actualColumns.includes(col.toLowerCase()))
    }

    if (!data || data.length === 0) {
      return false
    }

    const actualColumns = data.map((col: string) => col.toLowerCase())
    return expectedColumns.every((col) => actualColumns.includes(col.toLowerCase()))
  } catch (error) {
    console.error(`Error checking columns for ${tableName}:`, error)
    return false
  }
}

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns A promise that resolves to a boolean indicating if the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from(tableName).select("count").limit(1)

    return !error || !error.message.includes("does not exist")
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

/**
 * Creates all necessary database tables if they don't exist
 * @returns A promise that resolves to an object with the status of each table
 */
export async function setupDatabase(): Promise<{
  success: boolean
  watchlistTable: boolean
  ratingsTable: boolean
  profilesTable: boolean
  error?: any
  manualSetupRequired?: boolean
  setupInstructions?: string
}> {
  try {
    const supabase = getSupabaseClient()

    // First, try to use the execute_sql function if it exists
    const { error: functionCheckError } = await supabase.rpc("execute_sql", {
      query: "SELECT 1",
    })

    // If the function doesn't exist, we'll need to use a different approach
    if (functionCheckError && functionCheckError.message.includes("function execute_sql")) {
      console.log("execute_sql function not found, trying direct table creation...")

      // Try to create tables directly using Supabase's built-in methods
      // This is a limited approach that won't handle all the SQL we need
      // but it's better than nothing

      // Check if tables exist first
      const [watchlistExists, ratingsExists, profilesExists] = await Promise.all([
        tableExists(DB_SCHEMA.TABLES.WATCHLIST),
        tableExists(DB_SCHEMA.TABLES.RATINGS),
        tableExists(DB_SCHEMA.TABLES.PROFILES),
      ])

      // Check if tables have the expected columns
      const [watchlistHasColumns, ratingsHasColumns, profilesHasColumns] = await Promise.all([
        watchlistExists
          ? tableHasColumns(DB_SCHEMA.TABLES.WATCHLIST, [
              DB_SCHEMA.COLUMNS.WATCHLIST.ID,
              DB_SCHEMA.COLUMNS.WATCHLIST.USER_ID,
              DB_SCHEMA.COLUMNS.WATCHLIST.MEDIA_ID,
              DB_SCHEMA.COLUMNS.WATCHLIST.MEDIA_TYPE,
              DB_SCHEMA.COLUMNS.WATCHLIST.ADDED_AT,
            ])
          : false,
        ratingsExists
          ? tableHasColumns(DB_SCHEMA.TABLES.RATINGS, [
              DB_SCHEMA.COLUMNS.RATINGS.ID,
              DB_SCHEMA.COLUMNS.RATINGS.USER_ID,
              DB_SCHEMA.COLUMNS.RATINGS.MEDIA_ID,
              DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE,
              DB_SCHEMA.COLUMNS.RATINGS.RATING,
              DB_SCHEMA.COLUMNS.RATINGS.CREATED_AT,
              DB_SCHEMA.COLUMNS.RATINGS.UPDATED_AT,
            ])
          : false,
        profilesExists
          ? tableHasColumns(DB_SCHEMA.TABLES.PROFILES, [
              DB_SCHEMA.COLUMNS.PROFILES.ID,
              DB_SCHEMA.COLUMNS.PROFILES.USERNAME,
              DB_SCHEMA.COLUMNS.PROFILES.AVATAR_URL,
              DB_SCHEMA.COLUMNS.PROFILES.EMAIL,
              DB_SCHEMA.COLUMNS.PROFILES.BIO,
              DB_SCHEMA.COLUMNS.PROFILES.CREATED_AT,
              DB_SCHEMA.COLUMNS.PROFILES.UPDATED_AT,
            ])
          : false,
      ])

      // If tables exist but don't have the expected columns, we need to recreate them
      if (watchlistExists && !watchlistHasColumns) {
        console.warn(`Table ${DB_SCHEMA.TABLES.WATCHLIST} exists but doesn't have the expected columns`)
        // Add logic to handle this case (e.g., alter table, recreate table, etc.)
      }

      if (ratingsExists && !ratingsHasColumns) {
        console.warn(`Table ${DB_SCHEMA.TABLES.RATINGS} exists but doesn't have the expected columns`)
        // Add logic to handle this case
      }

      if (profilesExists && !profilesHasColumns) {
        console.warn(`Table ${DB_SCHEMA.TABLES.PROFILES} exists but doesn't have the expected columns`)
        // Add logic to handle this case
      }

      // If tables already exist, we're good
      if (watchlistExists && ratingsExists && profilesExists) {
        return {
          success: true,
          watchlistTable: true,
          ratingsTable: true,
          profilesTable: true,
        }
      }

      // We need to provide manual setup instructions
      const setupInstructions = `
# Database Setup Instructions

The application requires several database tables that couldn't be created automatically.
Please follow these steps to set up your database:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the following SQL code:

\`\`\`sql
-- Create the watchlist table
${CREATE_WATCHLIST_TABLE}

-- Create the ratings table
${CREATE_RATINGS_TABLE}

-- Create the profiles table
${CREATE_PROFILES_TABLE}

-- Grant necessary permissions
GRANT ALL ON TABLE public.watchlist TO authenticated;
GRANT ALL ON TABLE public.ratings TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
\`\`\`

5. Run the query
6. Refresh the application
      `

      return {
        success: false,
        watchlistTable: watchlistExists,
        ratingsTable: ratingsExists,
        profilesTable: profilesExists,
        manualSetupRequired: true,
        setupInstructions,
      }
    }

    // If we get here, the execute_sql function exists, so we can use it

    // Check if tables exist
    const [watchlistExists, ratingsExists, profilesExists] = await Promise.all([
      tableExists(DB_SCHEMA.TABLES.WATCHLIST),
      tableExists(DB_SCHEMA.TABLES.RATINGS),
      tableExists(DB_SCHEMA.TABLES.PROFILES),
    ])

    // Create tables if they don't exist
    const results = await Promise.all([
      !watchlistExists ? supabase.rpc("execute_sql", { query: CREATE_WATCHLIST_TABLE }) : { error: null },
      !ratingsExists ? supabase.rpc("execute_sql", { query: CREATE_RATINGS_TABLE }) : { error: null },
      !profilesExists ? supabase.rpc("execute_sql", { query: CREATE_PROFILES_TABLE }) : { error: null },
    ])

    const errors = results.map((r) => r.error).filter(Boolean)

    if (errors.length > 0) {
      console.error("Errors creating tables:", errors)
      return {
        success: false,
        watchlistTable: watchlistExists,
        ratingsTable: ratingsExists,
        profilesTable: profilesExists,
        error: errors[0],
        manualSetupRequired: true,
        setupInstructions: `
# Database Setup Instructions

The application encountered errors while trying to create the necessary database tables.
Please follow these steps to set up your database manually:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the following SQL code:

\`\`\`sql
-- Create the watchlist table
${CREATE_WATCHLIST_TABLE}

-- Create the ratings table
${CREATE_RATINGS_TABLE}

-- Create the profiles table
${CREATE_PROFILES_TABLE}

-- Grant necessary permissions
GRANT ALL ON TABLE public.watchlist TO authenticated;
GRANT ALL ON TABLE public.ratings TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
\`\`\`

5. Run the query
6. Refresh the application
        `,
      }
    }

    // Check if tables were created successfully
    const [watchlistCreated, ratingsCreated, profilesCreated] = await Promise.all([
      tableExists(DB_SCHEMA.TABLES.WATCHLIST),
      tableExists(DB_SCHEMA.TABLES.RATINGS),
      tableExists(DB_SCHEMA.TABLES.PROFILES),
    ])

    return {
      success: watchlistCreated && ratingsCreated && profilesCreated,
      watchlistTable: watchlistCreated,
      ratingsTable: ratingsCreated,
      profilesTable: profilesCreated,
    }
  } catch (error) {
    console.error("Error setting up database:", error)
    return {
      success: false,
      watchlistTable: false,
      ratingsTable: false,
      profilesTable: false,
      error,
      manualSetupRequired: true,
      setupInstructions: `
# Database Setup Instructions

The application encountered an error while trying to set up the database.
Please follow these steps to set up your database manually:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the following SQL code:

\`\`\`sql
-- Create the watchlist table
${CREATE_WATCHLIST_TABLE}

-- Create the ratings table
${CREATE_RATINGS_TABLE}

-- Create the profiles table
${CREATE_PROFILES_TABLE}

-- Grant necessary permissions
GRANT ALL ON TABLE public.watchlist TO authenticated;
GRANT ALL ON TABLE public.ratings TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
\`\`\`

5. Run the query
6. Refresh the application
      `,
    }
  }
}

/**
 * Checks the database schema and returns the status of each table
 * @returns A promise that resolves to an object with the status of each table
 */
export async function checkDatabaseSchema(): Promise<{
  watchlistTable: boolean
  ratingsTable: boolean
  profilesTable: boolean
}> {
  try {
    // Check if tables exist
    const [watchlistExists, ratingsExists, profilesExists] = await Promise.all([
      tableExists(DB_SCHEMA.TABLES.WATCHLIST),
      tableExists(DB_SCHEMA.TABLES.RATINGS),
      tableExists(DB_SCHEMA.TABLES.PROFILES),
    ])

    // Log status but don't treat as errors
    if (!watchlistExists) {
      console.log(`Table ${DB_SCHEMA.TABLES.WATCHLIST} does not exist - this is expected if setup hasn't been run`)
    }
    if (!ratingsExists) {
      console.log(`Table ${DB_SCHEMA.TABLES.RATINGS} does not exist - this is expected if setup hasn't been run`)
    }
    if (!profilesExists) {
      console.log(`Table ${DB_SCHEMA.TABLES.PROFILES} does not exist - this is expected if setup hasn't been run`)
    }

    return {
      watchlistTable: watchlistExists,
      ratingsTable: ratingsExists,
      profilesTable: profilesExists,
    }
  } catch (error) {
    console.error("Error checking database schema:", error)
    return {
      watchlistTable: false,
      ratingsTable: false,
      profilesTable: false,
    }
  }
}

export const checkAndCreateSchema = async () => {
  const schema = await checkDatabaseSchema()
  if (!schema.ratingsTable || !schema.watchlistTable || !schema.profilesTable) {
    await setupDatabase()
  }
  return schema
}
