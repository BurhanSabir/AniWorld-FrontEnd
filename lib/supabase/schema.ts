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
 * Executes a SQL query using the Supabase client
 * @param sql The SQL query to execute
 * @returns A promise that resolves when the query is complete
 */
export async function executeSql(sql: string): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc("execute_sql", { query: sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in executeSql:", error)
    return { success: false, error }
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
}> {
  try {
    // Check if the execute_sql function exists, and create it if it doesn't
    const supabase = getSupabaseClient()
    const { error: functionCheckError } = await supabase.rpc("execute_sql", {
      query: "SELECT 1",
    })

    // If the function doesn't exist, we need to create it
    if (functionCheckError && functionCheckError.message.includes("function execute_sql")) {
      console.log("Creating execute_sql function...")
      // We need to use a direct SQL query to create the function
      // This requires admin privileges, so we'll just log an error if it fails
      console.error(
        "The execute_sql function does not exist. Please create it with the following SQL:",
        `
        CREATE OR REPLACE FUNCTION execute_sql(query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE query;
        END;
        $$;
        `,
      )
      return {
        success: false,
        watchlistTable: false,
        ratingsTable: false,
        profilesTable: false,
        error: "execute_sql function does not exist",
      }
    }

    // Check if tables exist
    const [watchlistExists, ratingsExists, profilesExists] = await Promise.all([
      tableExists(DB_SCHEMA.TABLES.WATCHLIST),
      tableExists(DB_SCHEMA.TABLES.RATINGS),
      tableExists(DB_SCHEMA.TABLES.PROFILES),
    ])

    // Create tables if they don't exist
    const results = await Promise.all([
      !watchlistExists ? executeSql(CREATE_WATCHLIST_TABLE) : { success: true },
      !ratingsExists ? executeSql(CREATE_RATINGS_TABLE) : { success: true },
      !profilesExists ? executeSql(CREATE_PROFILES_TABLE) : { success: true },
    ])

    return {
      success: results.every((r) => r.success),
      watchlistTable: watchlistExists || results[0].success,
      ratingsTable: ratingsExists || results[1].success,
      profilesTable: profilesExists || results[2].success,
      error: results.find((r) => !r.success)?.error,
    }
  } catch (error) {
    console.error("Error setting up database:", error)
    return {
      success: false,
      watchlistTable: false,
      ratingsTable: false,
      profilesTable: false,
      error,
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
