import { getSupabaseClient } from "@/lib/supabase/client"
import type { Anime, Manga } from "@/types/anime"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

// Create the watchlist table if it doesn't exist
async function ensureWatchlistTable() {
  try {
    // Check if the table exists by attempting to query it
    const { error } = await supabase.from("watchlist").select("count").limit(1)

    if (error && error.message.includes("does not exist")) {
      console.log("Creating watchlist table...")

      // Use Supabase's SQL execution to create the table
      const { error: createError } = await supabase.rpc("create_watchlist_table")

      if (createError) {
        console.error("Error creating watchlist table:", createError)

        // If RPC fails, we'll try to handle it gracefully
        return false
      }

      console.log("Watchlist table created successfully")
      return true
    }

    return true
  } catch (err) {
    console.error("Error checking/creating watchlist table:", err)
    return false
  }
}

// Initialize the database check
let tableInitialized = false
let initializationPromise: Promise<boolean> | null = null

// Function to ensure the table exists before any operation
async function ensureTableExists() {
  if (tableInitialized) return true

  if (!initializationPromise) {
    initializationPromise = ensureWatchlistTable().then((result) => {
      tableInitialized = result
      return result
    })
  }

  return initializationPromise
}

// Add an item to the watchlist with proper error handling
export async function addToWatchlist(
  mediaId: number,
  mediaType: "anime" | "manga",
): Promise<{ success: boolean; message?: string }> {
  try {
    // Ensure table exists
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return {
        success: false,
        message: "Unable to create watchlist table. Please try again later.",
      }
    }

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "User not authenticated",
      }
    }

    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id,
      media_id: mediaId,
      media_type: mediaType,
      added_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return {
      success: false,
      message: `Failed to add to watchlist: ${error.message}`,
    }
  }
}

// Remove an item from the watchlist with proper error handling
export async function removeFromWatchlist(
  mediaId: number,
  mediaType: "anime" | "manga",
): Promise<{ success: boolean; message?: string }> {
  try {
    // Ensure table exists
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return {
        success: false,
        message: "Unable to access watchlist. Please try again later.",
      }
    }

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "User not authenticated",
      }
    }

    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType)

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    return {
      success: false,
      message: `Failed to remove from watchlist: ${error.message}`,
    }
  }
}

// Check if an item is in the watchlist with proper error handling
export async function checkInWatchlist(mediaId: number, mediaType: "anime" | "manga"): Promise<boolean> {
  try {
    // Ensure table exists
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return false
    }

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType)
      .maybeSingle()

    if (error) {
      console.error("Error checking watchlist:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in checkInWatchlist:", error)
    return false
  }
}

// Fetch user's watchlist with proper error handling
export async function fetchWatchlist(type: "anime" | "manga" = "anime"): Promise<Anime[] | Manga[]> {
  try {
    // Ensure table exists
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return []
    }

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("watchlist")
      .select("media_id")
      .eq("user_id", user.id)
      .eq("media_type", type)
      .order("added_at", { ascending: false })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // For now, return the IDs - in a real app, you would fetch the full details
    // from your anime/manga tables or an external API
    return data.map((item) => ({ id: item.media_id }) as any)
  } catch (error) {
    console.error(`Error fetching ${type} watchlist:`, error)
    return []
  }
}

// Get watchlist count with proper error handling
export async function getWatchlistCount(type?: "anime" | "manga"): Promise<number> {
  try {
    // Ensure table exists
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return 0
    }

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return 0
    }

    let query = supabase.from("watchlist").select("id", { count: "exact" }).eq("user_id", user.id)

    if (type) {
      query = query.eq("media_type", type)
    }

    const { count, error } = await query

    if (error) {
      throw error
    }

    return count || 0
  } catch (error) {
    console.error("Error getting watchlist count:", error)
    return 0
  }
}

// Toggle watchlist status
export async function toggleWatchlistItem(mediaId: number, mediaType: "anime" | "manga"): Promise<boolean> {
  try {
    const isInWatchlist = await checkInWatchlist(mediaId, mediaType)

    if (isInWatchlist) {
      await removeFromWatchlist(mediaId, mediaType)
      return false
    } else {
      await addToWatchlist(mediaId, mediaType)
      return true
    }
  } catch (error) {
    console.error("Error toggling watchlist item:", error)
    return false
  }
}
