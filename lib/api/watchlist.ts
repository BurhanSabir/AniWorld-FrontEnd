import { getSupabaseClient } from "@/lib/supabase/client"
import type { Anime, Manga } from "@/types/anime"
import { syncAnimeData } from "@/lib/api/sync"

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
export async function addToWatchlist(itemId: number, type: "anime" | "manga" = "anime"): Promise<void> {
  const supabase = getSupabaseClient()

  try {
    // Check if the item exists in our database
    const { data: existingItem } = await supabase.from(type).select("id").eq("id", itemId).single()

    // If the item doesn't exist in our database, sync it
    if (!existingItem) {
      if (type === "anime") {
        await syncAnimeData(itemId)
      } else {
        // For manga, we would need a similar function
        // This is simplified for the demo
        // await syncMangaData(itemId)
      }
    }

    // Add the item to the user's watchlist
    const { error } = await supabase.from("watchlists").insert({
      item_id: itemId,
      item_type: type,
    })

    if (error) {
      // If the error is because the item is already in the watchlist, we can ignore it
      if (error.code === "23505") {
        // Unique violation
        return
      }
      throw error
    }
  } catch (error) {
    console.error(`Error adding ${type} to watchlist:`, error)
    throw error
  }
}

// Remove an item from the watchlist
export async function removeFromWatchlist(itemId: number, type: "anime" | "manga" = "anime"): Promise<void> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from("watchlists").delete().eq("item_id", itemId).eq("item_type", type)

    if (error) throw error
  } catch (error) {
    console.error(`Error removing ${type} from watchlist:`, error)
    throw error
  }
}

// Check if an item is in the watchlist
export async function checkInWatchlist(itemId: number, type: "anime" | "manga" = "anime"): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("watchlists")
      .select("id")
      .eq("item_id", itemId)
      .eq("item_type", type)
      .single()

    if (error) {
      // If the error is because the item is not found, return false
      if (error.code === "PGRST116") {
        // Not found
        return false
      }
      throw error
    }

    return !!data
  } catch (error) {
    console.error(`Error checking if ${type} is in watchlist:`, error)
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
