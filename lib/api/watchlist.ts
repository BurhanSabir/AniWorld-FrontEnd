import { getSupabaseClient } from "@/lib/supabase/client"
import type { Anime, Manga } from "@/types/anime"

// Fetch user's watchlist
export async function fetchWatchlist(type: "anime" | "manga" = "anime"): Promise<Anime[] | Manga[]> {
  const supabase = getSupabaseClient()

  try {
    // Get the user's watchlist items
    const { data: watchlistItems, error } = await supabase
      .from("watchlists")
      .select("id, item_id, created_at")
      .eq("item_type", type)
      .order("created_at", { ascending: false })

    if (error) throw error

    if (!watchlistItems || watchlistItems.length === 0) {
      return []
    }

    // Get the item details from the respective table
    const itemIds = watchlistItems.map((item) => item.item_id)
    const { data: items, error: itemsError } = await supabase.from(type).select("*").in("id", itemIds)

    if (itemsError) throw itemsError

    // If we don't have the items in our database, fetch them from the API
    if (!items || items.length === 0) {
      // For demo purposes, we'll return an empty array
      // In a real app, you might want to fetch the items from an external API
      return []
    }

    // Transform the data to match our frontend types
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      coverImage: item.cover_image,
      genres: item.genres,
      score: item.score?.toString(),
      status: item.status,
      ...(type === "anime"
        ? { episodes: item.episodes, year: item.year }
        : { chapters: item.chapters, volumes: item.volumes, year: item.year }),
    }))
  } catch (error) {
    console.error(`Error fetching ${type} watchlist:`, error)
    throw error
  }
}

// Add an item to the watchlist
export async function addToWatchlist(mediaId: number, token: string, type: "anime" | "manga" = "anime"): Promise<void> {
  if (!token) {
    throw new Error("Authentication token is required")
  }

  try {
    const supabase = getSupabaseClient()

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not found")
    }

    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id,
      media_id: mediaId,
      media_type: type,
      added_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    throw error
  }
}

// Remove an item from the watchlist
export async function removeFromWatchlist(
  mediaId: number,
  token: string,
  type: "anime" | "manga" = "anime",
): Promise<void> {
  if (!token) {
    throw new Error("Authentication token is required")
  }

  try {
    const supabase = getSupabaseClient()

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not found")
    }

    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .eq("media_type", type)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    throw error
  }
}

// Check if an item is in the watchlist
export async function checkInWatchlist(
  mediaId: number,
  token: string,
  type: "anime" | "manga" = "anime",
): Promise<boolean> {
  if (!token) {
    return false
  }

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("watchlist")
      .select("id")
      .eq("media_id", mediaId)
      .eq("media_type", type)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking watchlist:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in checkInWatchlist:", error)
    return false
  }
}

// Get watchlist count
export async function getWatchlistCount(type?: "anime" | "manga"): Promise<number> {
  const supabase = getSupabaseClient()

  try {
    let query = supabase.from("watchlists").select("id", { count: "exact" })

    if (type) {
      query = query.eq("item_type", type)
    }

    const { count, error } = await query

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error("Error getting watchlist count:", error)
    return 0
  }
}
