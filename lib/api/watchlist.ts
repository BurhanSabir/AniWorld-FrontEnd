import { getSupabaseClient } from "@/lib/supabase/client"
import { DB_SCHEMA } from "@/lib/supabase/schema"
import { inspectTable } from "@/lib/supabase/inspect"
import type { Anime, Manga } from "@/types/anime"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

// Cache for column mapping
let watchlistColumnMapping: Record<string, string> | null = null

/**
 * Gets the column mapping for the watchlist table
 * @returns A promise that resolves to a column mapping object
 */
async function getWatchlistColumnMapping(): Promise<Record<string, string>> {
  if (watchlistColumnMapping !== null) {
    return watchlistColumnMapping
  }

  const expectedColumns = ["id", "user_id", "media_id", "media_type", "added_at"]

  const inspection = await inspectTable(DB_SCHEMA.TABLES.WATCHLIST, expectedColumns)

  if (!inspection.exists) {
    // Default mapping if table doesn't exist
    return {
      id: "id",
      user_id: "user_id",
      media_id: "media_id",
      media_type: "media_type",
      added_at: "added_at",
    }
  }

  watchlistColumnMapping = inspection.columnMapping

  // Fill in any missing mappings with defaults
  for (const col of expectedColumns) {
    if (!watchlistColumnMapping[col]) {
      watchlistColumnMapping[col] = col
    }
  }

  return watchlistColumnMapping
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
    // Get column mapping
    const columnMapping = await getWatchlistColumnMapping()

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
      .select(columnMapping.id)
      .eq(columnMapping.user_id, user.id)
      .eq(columnMapping.media_id, mediaId)
      .eq(columnMapping.media_type, mediaType)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking watchlist:", checkError)

      // If the error is about a missing column, try to repair the table
      if (checkError.message.includes("does not exist")) {
        const { repairWatchlistTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairWatchlistTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          watchlistColumnMapping = null
          return addToWatchlist(mediaId, mediaType)
        } else {
          return {
            success: false,
            message: `Database error: ${checkError.message}. Repair attempt failed: ${repairResult.message}`,
          }
        }
      }

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
      [columnMapping.user_id]: user.id,
      [columnMapping.media_id]: mediaId,
      [columnMapping.media_type]: mediaType,
      [columnMapping.added_at]: new Date().toISOString(),
    })

    if (error) {
      console.error("Error adding to watchlist:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairWatchlistTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairWatchlistTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          watchlistColumnMapping = null
          return addToWatchlist(mediaId, mediaType)
        } else {
          return {
            success: false,
            message: `Database error: ${error.message}. Repair attempt failed: ${repairResult.message}`,
          }
        }
      }

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
    // Get column mapping
    const columnMapping = await getWatchlistColumnMapping()

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
      .eq(columnMapping.user_id, user.id)
      .eq(columnMapping.media_id, mediaId)
      .eq(columnMapping.media_type, mediaType)

    if (error) {
      console.error("Error removing from watchlist:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairWatchlistTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairWatchlistTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          watchlistColumnMapping = null
          return removeFromWatchlist(mediaId, mediaType)
        } else {
          return {
            success: false,
            message: `Database error: ${error.message}. Repair attempt failed: ${repairResult.message}`,
          }
        }
      }

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
    // Get column mapping
    const columnMapping = await getWatchlistColumnMapping()

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
      .select(columnMapping.id)
      .eq(columnMapping.user_id, user.id)
      .eq(columnMapping.media_id, mediaId)
      .eq(columnMapping.media_type, mediaType)
      .maybeSingle()

    if (error) {
      console.error("Error checking watchlist:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairWatchlistTable } = await import("@/lib/supabase/repair")
        await repairWatchlistTable()

        // Don't retry here to avoid potential infinite loops
        // Just return false and let the user try again
        return false
      }

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
    // Get column mapping
    const columnMapping = await getWatchlistColumnMapping()

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
        ${columnMapping.media_id},
        ${columnMapping.added_at}
      `)
      .eq(columnMapping.user_id, user.id)
      .eq(columnMapping.media_type, type)
      .order(columnMapping.added_at, { ascending: false })

    if (error) {
      console.error("Error fetching watchlist:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairWatchlistTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairWatchlistTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          watchlistColumnMapping = null
          return fetchWatchlist(type)
        }
      }

      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // For now, return the IDs - in a real app, you would fetch the full details
    // from your anime/manga tables or an external API
    return data.map((item) => ({ id: item[columnMapping.media_id] }) as any)
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
    // Get column mapping
    const columnMapping = await getWatchlistColumnMapping()

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
      .select(columnMapping.id, { count: "exact" })
      .eq(columnMapping.user_id, user.id)

    if (type) {
      query = query.eq(columnMapping.media_type, type)
    }

    // Execute query
    const { count, error } = await query

    if (error) {
      console.error("Error getting watchlist count:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairWatchlistTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairWatchlistTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          watchlistColumnMapping = null
          return getWatchlistCount(type)
        }
      }

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

/**
 * Ensures the watchlist table exists with the correct schema
 * @returns A promise that resolves to a boolean indicating if the table is ready
 */
export async function ensureWatchlistTable(): Promise<boolean> {
  try {
    const { repairWatchlistTable } = await import("@/lib/supabase/repair")
    const result = await repairWatchlistTable()
    return result.success
  } catch (error) {
    console.error("Error ensuring watchlist table:", error)
    return false
  }
}
