import { getSupabaseClient } from "@/lib/supabase/client"
import { DB_SCHEMA, tableExists } from "@/lib/supabase/schema"
import type { Anime, Manga } from "@/types/anime"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

// Cache for table existence check
let watchlistTableExists: boolean | null = null
let watchlistColumns: string[] | null = null

/**
 * Fetches the column names for a table
 * @param tableName The name of the table
 * @returns A promise that resolves to an array of column names
 */
async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc("get_table_columns", { table_name: tableName })

    if (error) {
      console.error(`Error fetching columns for ${tableName}:`, error)
      // Fallback: try to infer columns from a query
      const { data: sampleData, error: sampleError } = await supabase.from(tableName).select("*").limit(1)

      if (sampleError) {
        console.error(`Error fetching sample data from ${tableName}:`, sampleError)
        return []
      }

      return sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : []
    }

    return data || []
  } catch (error) {
    console.error(`Error in getTableColumns for ${tableName}:`, error)
    return []
  }
}

/**
 * Ensures the watchlist table exists and has the expected columns
 * @returns A promise that resolves to an object with table existence and column mapping
 */
async function ensureWatchlistTable(): Promise<{
  exists: boolean
  columns: {
    id: string
    userId: string
    mediaId: string
    mediaType: string
    addedAt: string
  }
}> {
  // Use cached values if available
  if (watchlistTableExists !== null && watchlistColumns !== null) {
    return {
      exists: watchlistTableExists,
      columns: {
        id: "id",
        userId: watchlistColumns.find((c) => c.toLowerCase() === "user_id") || "user_id",
        mediaId: watchlistColumns.find((c) => c.toLowerCase() === "media_id") || "media_id",
        mediaType: watchlistColumns.find((c) => c.toLowerCase() === "media_type") || "media_type",
        addedAt: watchlistColumns.find((c) => c.toLowerCase() === "added_at") || "added_at",
      },
    }
  }

  try {
    // Check if table exists
    watchlistTableExists = await tableExists(DB_SCHEMA.TABLES.WATCHLIST)

    if (!watchlistTableExists) {
      return {
        exists: false,
        columns: {
          id: "id",
          userId: "user_id",
          mediaId: "media_id",
          mediaType: "media_type",
          addedAt: "added_at",
        },
      }
    }

    // Get actual column names from the database
    watchlistColumns = await getTableColumns(DB_SCHEMA.TABLES.WATCHLIST)

    // Map expected column names to actual column names (case-insensitive)
    return {
      exists: true,
      columns: {
        id: watchlistColumns.find((c) => c.toLowerCase() === "id") || "id",
        userId: watchlistColumns.find((c) => c.toLowerCase() === "user_id") || "user_id",
        mediaId: watchlistColumns.find((c) => c.toLowerCase() === "media_id") || "media_id",
        mediaType: watchlistColumns.find((c) => c.toLowerCase() === "media_type") || "media_type",
        addedAt: watchlistColumns.find((c) => c.toLowerCase() === "added_at") || "added_at",
      },
    }
  } catch (error) {
    console.error("Error checking watchlist table:", error)
    return {
      exists: false,
      columns: {
        id: "id",
        userId: "user_id",
        mediaId: "media_id",
        mediaType: "media_type",
        addedAt: "added_at",
      },
    }
  }
}

/**
 * Adds an item to the user's watchlist
 * @param mediaId The ID of the media to add
 * @param mediaType The type of media (anime or manga)
 * @returns A promise that resolves to an object with success status and optional error message
 */
export async function addToWatchlist(
  mediaId: number,
  mediaType: "anime" | "manga",
): Promise<{ success: boolean; message?: string }> {
  try {
    // Ensure table exists and get column mapping
    const { exists, columns } = await ensureWatchlistTable()
    if (!exists) {
      return {
        success: false,
        message: "Watchlist table does not exist. Please set up the database.",
      }
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to add items to your watchlist.",
      }
    }

    // Check if item is already in watchlist
    const { data: existingItem, error: checkError } = await supabase
      .from(DB_SCHEMA.TABLES.WATCHLIST)
      .select(columns.id)
      .eq(columns.userId, user.id)
      .eq(columns.mediaId, mediaId)
      .eq(columns.mediaType, mediaType)
      .maybeSingle()

    if (checkError && !checkError.message.includes("No rows found")) {
      console.error("Error checking watchlist:", checkError)
      return {
        success: false,
        message: `Failed to check if item is already in watchlist: ${checkError.message}`,
      }
    }

    // If item is already in watchlist, return success
    if (existingItem) {
      return {
        success: true,
        message: "Item is already in your watchlist.",
      }
    }

    // Add item to watchlist
    const { error } = await supabase.from(DB_SCHEMA.TABLES.WATCHLIST).insert({
      [columns.userId]: user.id,
      [columns.mediaId]: mediaId,
      [columns.mediaType]: mediaType,
      [columns.addedAt]: new Date().toISOString(),
    })

    if (error) {
      console.error("Error adding to watchlist:", error)
      return {
        success: false,
        message: `Failed to add item to watchlist: ${error.message}`,
      }
    }

    return {
      success: true,
      message: "Item added to your watchlist.",
    }
  } catch (error: any) {
    console.error("Error in addToWatchlist:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    }
  }
}

/**
 * Removes an item from the user's watchlist
 * @param mediaId The ID of the media to remove
 * @param mediaType The type of media (anime or manga)
 * @returns A promise that resolves to an object with success status and optional error message
 */
export async function removeFromWatchlist(
  mediaId: number,
  mediaType: "anime" | "manga",
): Promise<{ success: boolean; message?: string }> {
  try {
    // Ensure table exists and get column mapping
    const { exists, columns } = await ensureWatchlistTable()
    if (!exists) {
      return {
        success: false,
        message: "Watchlist table does not exist. Please set up the database.",
      }
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to remove items from your watchlist.",
      }
    }

    // Remove item from watchlist
    const { error } = await supabase
      .from(DB_SCHEMA.TABLES.WATCHLIST)
      .delete()
      .eq(columns.userId, user.id)
      .eq(columns.mediaId, mediaId)
      .eq(columns.mediaType, mediaType)

    if (error) {
      console.error("Error removing from watchlist:", error)
      return {
        success: false,
        message: `Failed to remove item from watchlist: ${error.message}`,
      }
    }

    return {
      success: true,
      message: "Item removed from your watchlist.",
    }
  } catch (error: any) {
    console.error("Error in removeFromWatchlist:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    }
  }
}

/**
 * Checks if an item is in the user's watchlist
 * @param mediaId The ID of the media to check
 * @param mediaType The type of media (anime or manga)
 * @returns A promise that resolves to a boolean indicating if the item is in the watchlist
 */
export async function checkInWatchlist(mediaId: number, mediaType: "anime" | "manga"): Promise<boolean> {
  try {
    // Ensure table exists and get column mapping
    const { exists, columns } = await ensureWatchlistTable()
    if (!exists) {
      return false // If table doesn't exist, item is not in watchlist
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false // If user is not logged in, item is not in watchlist
    }

    // Check if item is in watchlist
    const { data, error } = await supabase
      .from(DB_SCHEMA.TABLES.WATCHLIST)
      .select(columns.id)
      .eq(columns.userId, user.id)
      .eq(columns.mediaId, mediaId)
      .eq(columns.mediaType, mediaType)
      .maybeSingle()

    if (error && !error.message.includes("No rows found")) {
      console.error("Error checking watchlist:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in checkInWatchlist:", error)
    return false
  }
}

/**
 * Fetches the user's watchlist
 * @param type The type of media to fetch (anime or manga)
 * @returns A promise that resolves to an array of media items
 */
export async function fetchWatchlist(type: "anime" | "manga" = "anime"): Promise<Anime[] | Manga[]> {
  try {
    // Ensure table exists and get column mapping
    const { exists, columns } = await ensureWatchlistTable()
    if (!exists) {
      console.log("Watchlist table does not exist. Please set up the database.")
      return [] // Return empty array if table doesn't exist
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return [] // Return empty array if user is not logged in
    }

    // Fetch watchlist items
    const { data, error } = await supabase
      .from(DB_SCHEMA.TABLES.WATCHLIST)
      .select(`
        ${columns.mediaId},
        ${columns.addedAt}
      `)
      .eq(columns.userId, user.id)
      .eq(columns.mediaType, type)
      .order(columns.addedAt, { ascending: false })

    if (error) {
      console.error("Error fetching watchlist:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // For now, return the IDs - in a real app, you would fetch the full details
    // from your anime/manga tables or an external API
    return data.map((item) => ({ id: item[columns.mediaId] }) as any)
  } catch (error) {
    console.error(`Error in fetchWatchlist:`, error)
    return []
  }
}

/**
 * Gets the count of items in the user's watchlist
 * @param type The type of media to count (anime or manga)
 * @returns A promise that resolves to the count of items
 */
export async function getWatchlistCount(type?: "anime" | "manga"): Promise<number> {
  try {
    // Ensure table exists and get column mapping
    const { exists, columns } = await ensureWatchlistTable()
    if (!exists) {
      return 0 // Return 0 if table doesn't exist
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return 0 // Return 0 if user is not logged in
    }

    // Build query
    let query = supabase
      .from(DB_SCHEMA.TABLES.WATCHLIST)
      .select(columns.id, { count: "exact" })
      .eq(columns.userId, user.id)

    if (type) {
      query = query.eq(columns.mediaType, type)
    }

    // Execute query
    const { count, error } = await query

    if (error) {
      console.error("Error getting watchlist count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getWatchlistCount:", error)
    return 0
  }
}

/**
 * Toggles an item in the user's watchlist
 * @param mediaId The ID of the media to toggle
 * @param mediaType The type of media (anime or manga)
 * @returns A promise that resolves to a boolean indicating if the item is now in the watchlist
 */
export async function toggleWatchlistItem(
  mediaId: number,
  mediaType: "anime" | "manga",
): Promise<{ success: boolean; inWatchlist: boolean; message?: string }> {
  try {
    const isInWatchlist = await checkInWatchlist(mediaId, mediaType)

    if (isInWatchlist) {
      const result = await removeFromWatchlist(mediaId, mediaType)
      return {
        success: result.success,
        inWatchlist: false,
        message: result.message,
      }
    } else {
      const result = await addToWatchlist(mediaId, mediaType)
      return {
        success: result.success,
        inWatchlist: true,
        message: result.message,
      }
    }
  } catch (error: any) {
    console.error("Error in toggleWatchlistItem:", error)
    return {
      success: false,
      inWatchlist: false,
      message: error.message || "An unexpected error occurred.",
    }
  }
}
