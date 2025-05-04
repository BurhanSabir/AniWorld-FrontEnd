import { getSupabaseClient } from "./client"
import { DB_SCHEMA } from "./schema"
import { inspectTable, fixTableSchema } from "./inspect"

/**
 * Repairs the watchlist table schema
 * @returns A promise that resolves to a boolean indicating if the repair was successful
 */
export async function repairWatchlistTable(): Promise<{
  success: boolean
  message: string
  details?: string[]
}> {
  try {
    const supabase = getSupabaseClient()

    // First, inspect the table
    const expectedColumns = ["id", "user_id", "media_id", "media_type", "added_at"]

    const inspection = await inspectTable(DB_SCHEMA.TABLES.WATCHLIST, expectedColumns)

    if (!inspection.exists) {
      // Table doesn't exist, create it
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${DB_SCHEMA.TABLES.WATCHLIST} (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          media_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, media_id, media_type)
        );
        
        -- Add RLS policies
        ALTER TABLE ${DB_SCHEMA.TABLES.WATCHLIST} ENABLE ROW LEVEL SECURITY;
        
        -- Policy to allow users to select only their own watchlist items
        CREATE POLICY watchlist_select_policy ON ${DB_SCHEMA.TABLES.WATCHLIST}
          FOR SELECT
          USING (auth.uid() = user_id);
          
        -- Policy to allow users to insert only their own watchlist items
        CREATE POLICY watchlist_insert_policy ON ${DB_SCHEMA.TABLES.WATCHLIST}
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
          
        -- Policy to allow users to update only their own watchlist items
        CREATE POLICY watchlist_update_policy ON ${DB_SCHEMA.TABLES.WATCHLIST}
          FOR UPDATE
          USING (auth.uid() = user_id);
          
        -- Policy to allow users to delete only their own watchlist items
        CREATE POLICY watchlist_delete_policy ON ${DB_SCHEMA.TABLES.WATCHLIST}
          FOR DELETE
          USING (auth.uid() = user_id);
      `

      const { error } = await supabase.rpc("execute_sql", {
        query: createTableSQL,
      })

      if (error) {
        return {
          success: false,
          message: "Failed to create watchlist table",
          details: [error.message],
        }
      }

      return {
        success: true,
        message: "Watchlist table created successfully",
        details: ["Created table with all required columns"],
      }
    }

    // Table exists but might have issues
    if (inspection.missingColumns.length > 0) {
      // Add missing columns
      const columnDefinitions: Record<string, string> = {
        id: "UUID PRIMARY KEY DEFAULT uuid_generate_v4()",
        user_id: "UUID REFERENCES auth.users(id) NOT NULL",
        media_id: "INTEGER NOT NULL",
        media_type: "TEXT NOT NULL",
        added_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
      }

      const success = await fixTableSchema(DB_SCHEMA.TABLES.WATCHLIST, columnDefinitions)

      if (!success) {
        return {
          success: false,
          message: "Failed to repair watchlist table",
          details: [`Missing columns: ${inspection.missingColumns.join(", ")}`],
        }
      }

      return {
        success: true,
        message: "Watchlist table repaired successfully",
        details: [`Added missing columns: ${inspection.missingColumns.join(", ")}`],
      }
    }

    return {
      success: true,
      message: "Watchlist table is correctly configured",
      details: ["All expected columns exist", `Found columns: ${inspection.columns.join(", ")}`],
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Error repairing watchlist table",
      details: [error.message],
    }
  }
}

/**
 * Repairs the ratings table schema
 * @returns A promise that resolves to a boolean indicating if the repair was successful
 */
export async function repairRatingsTable(): Promise<{
  success: boolean
  message: string
  details?: string[]
}> {
  try {
    const supabase = getSupabaseClient()

    // First, inspect the table
    const expectedColumns = ["id", "user_id", "media_id", "media_type", "rating", "created_at", "updated_at"]

    const inspection = await inspectTable(DB_SCHEMA.TABLES.RATINGS, expectedColumns)

    if (!inspection.exists) {
      // Table doesn't exist, create it
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${DB_SCHEMA.TABLES.RATINGS} (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          media_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          rating INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, media_id, media_type)
        );
        
        -- Add RLS policies
        ALTER TABLE ${DB_SCHEMA.TABLES.RATINGS} ENABLE ROW LEVEL SECURITY;
        
        -- Policy to allow users to select only their own ratings
        CREATE POLICY ratings_select_policy ON ${DB_SCHEMA.TABLES.RATINGS}
          FOR SELECT
          USING (auth.uid() = user_id);
          
        -- Policy to allow users to insert only their own ratings
        CREATE POLICY ratings_insert_policy ON ${DB_SCHEMA.TABLES.RATINGS}
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
          
        -- Policy to allow users to update only their own ratings
        CREATE POLICY ratings_update_policy ON ${DB_SCHEMA.TABLES.RATINGS}
          FOR UPDATE
          USING (auth.uid() = user_id);
          
        -- Policy to allow users to delete only their own ratings
        CREATE POLICY ratings_delete_policy ON ${DB_SCHEMA.TABLES.RATINGS}
          FOR DELETE
          USING (auth.uid() = user_id);
      `

      const { error } = await supabase.rpc("execute_sql", {
        query: createTableSQL,
      })

      if (error) {
        return {
          success: false,
          message: "Failed to create ratings table",
          details: [error.message],
        }
      }

      return {
        success: true,
        message: "Ratings table created successfully",
        details: ["Created table with all required columns"],
      }
    }

    // Table exists but might have issues
    if (inspection.missingColumns.length > 0) {
      // Add missing columns
      const columnDefinitions: Record<string, string> = {
        id: "UUID PRIMARY KEY DEFAULT uuid_generate_v4()",
        user_id: "UUID REFERENCES auth.users(id) NOT NULL",
        media_id: "INTEGER NOT NULL",
        media_type: "TEXT NOT NULL",
        rating: "INTEGER NOT NULL",
        created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
        updated_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
      }

      const success = await fixTableSchema(DB_SCHEMA.TABLES.RATINGS, columnDefinitions)

      if (!success) {
        return {
          success: false,
          message: "Failed to repair ratings table",
          details: [`Missing columns: ${inspection.missingColumns.join(", ")}`],
        }
      }

      return {
        success: true,
        message: "Ratings table repaired successfully",
        details: [`Added missing columns: ${inspection.missingColumns.join(", ")}`],
      }
    }

    return {
      success: true,
      message: "Ratings table is correctly configured",
      details: ["All expected columns exist", `Found columns: ${inspection.columns.join(", ")}`],
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Error repairing ratings table",
      details: [error.message],
    }
  }
}

/**
 * Repairs all database tables
 * @returns A promise that resolves to an object with the repair status
 */
export async function repairAllTables(): Promise<{
  success: boolean
  watchlist: {
    success: boolean
    message: string
    details?: string[]
  }
  ratings: {
    success: boolean
    message: string
    details?: string[]
  }
}> {
  const watchlistResult = await repairWatchlistTable()
  const ratingsResult = await repairRatingsTable()

  return {
    success: watchlistResult.success && ratingsResult.success,
    watchlist: watchlistResult,
    ratings: ratingsResult,
  }
}
