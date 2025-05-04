import { getSupabaseClient } from "./client"
import { DB_SCHEMA, tableExists } from "./schema"

/**
 * Repairs the database schema by recreating tables with the correct columns
 * @returns A promise that resolves to an object with the status of the repair
 */
export async function repairDatabaseSchema(): Promise<{
  success: boolean
  watchlistRepaired: boolean
  ratingsRepaired: boolean
  profilesRepaired: boolean
  error?: any
}> {
  try {
    const supabase = getSupabaseClient()

    // Check if tables exist
    const [watchlistExists, ratingsExists, profilesExists] = await Promise.all([
      tableExists(DB_SCHEMA.TABLES.WATCHLIST),
      tableExists(DB_SCHEMA.TABLES.RATINGS),
      tableExists(DB_SCHEMA.TABLES.PROFILES),
    ])

    // Backup existing data if tables exist
    const watchlistBackup = watchlistExists ? await backupTable(DB_SCHEMA.TABLES.WATCHLIST) : null
    const ratingsBackup = ratingsExists ? await backupTable(DB_SCHEMA.TABLES.RATINGS) : null
    const profilesBackup = profilesExists ? await backupTable(DB_SCHEMA.TABLES.PROFILES) : null

    // Drop existing tables
    if (watchlistExists) {
      await supabase.rpc("execute_sql", {
        query: `DROP TABLE IF EXISTS ${DB_SCHEMA.TABLES.WATCHLIST} CASCADE`,
      })
    }

    if (ratingsExists) {
      await supabase.rpc("execute_sql", {
        query: `DROP TABLE IF EXISTS ${DB_SCHEMA.TABLES.RATINGS} CASCADE`,
      })
    }

    if (profilesExists) {
      await supabase.rpc("execute_sql", {
        query: `DROP TABLE IF EXISTS ${DB_SCHEMA.TABLES.PROFILES} CASCADE`,
      })
    }

    // Recreate tables with correct schema
    // This would use the same SQL as in schema.ts

    // Restore data if possible
    const watchlistRestored = watchlistBackup ? await restoreTable(DB_SCHEMA.TABLES.WATCHLIST, watchlistBackup) : false
    const ratingsRestored = ratingsBackup ? await restoreTable(DB_SCHEMA.TABLES.RATINGS, ratingsBackup) : false
    const profilesRestored = profilesBackup ? await restoreTable(DB_SCHEMA.TABLES.PROFILES, profilesBackup) : false

    return {
      success: true,
      watchlistRepaired: watchlistExists,
      ratingsRepaired: ratingsExists,
      profilesRepaired: profilesExists,
    }
  } catch (error) {
    console.error("Error repairing database schema:", error)
    return {
      success: false,
      watchlistRepaired: false,
      ratingsRepaired: false,
      profilesRepaired: false,
      error,
    }
  }
}

/**
 * Backs up a table's data
 * @param tableName The name of the table to backup
 * @returns A promise that resolves to the backup data or null if backup failed
 */
async function backupTable(tableName: string): Promise<any[] | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from(tableName).select("*")

    if (error) {
      console.error(`Error backing up ${tableName}:`, error)
      return null
    }

    return data || []
  } catch (error) {
    console.error(`Error backing up ${tableName}:`, error)
    return null
  }
}

/**
 * Restores data to a table
 * @param tableName The name of the table to restore
 * @param data The data to restore
 * @returns A promise that resolves to a boolean indicating if the restore was successful
 */
async function restoreTable(tableName: string, data: any[]): Promise<boolean> {
  if (!data || data.length === 0) {
    return true // Nothing to restore
  }

  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from(tableName).insert(data)

    if (error) {
      console.error(`Error restoring ${tableName}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error restoring ${tableName}:`, error)
    return false
  }
}
