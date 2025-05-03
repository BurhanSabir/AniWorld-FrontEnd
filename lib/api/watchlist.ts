import { getSupabaseClient } from "@/lib/supabase/client"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

export async function addToWatchlist(mediaId: number, token: string, mediaType: "anime" | "manga") {
  try {
    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not found")
    }

    const { data, error } = await supabase.from("watchlist").insert({
      user_id: user.id,
      media_id: mediaId,
      media_type: mediaType,
      added_at: new Date().toISOString(),
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return { success: false, error }
  }
}

export async function removeFromWatchlist(mediaId: number, token: string, mediaType: "anime" | "manga") {
  try {
    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not found")
    }

    const { data, error } = await supabase
      .from("watchlist")
      .delete()
      .match({ user_id: user.id, media_id: mediaId, media_type: mediaType })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    return { success: false, error }
  }
}

export async function checkInWatchlist(
  mediaId: number,
  token: string,
  mediaType: "anime" | "manga" = "anime",
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .match({ user_id: user.id, media_id: mediaId, media_type: mediaType })
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

export async function fetchWatchlist(mediaType: "anime" | "manga", token?: string) {
  try {
    const supabase = getSupabaseClient()

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const query = supabase.from("watchlist").select("*").eq("user_id", user.id).eq("media_type", mediaType)

    const { data, error } = await query.order("added_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting watchlist:", error)
    return []
  }
}
