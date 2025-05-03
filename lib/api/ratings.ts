import { getSupabaseClient } from "@/lib/supabase/client"
import type { AnimeRating } from "@/types/anime"

interface RatingResponse {
  success: boolean
  message: string
  rating?: number
  averageRating?: string
}

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

export async function rateMedia(mediaId: number, mediaType: "ANIME" | "MANGA", userId: string, rating: number) {
  try {
    // Check if the user has already rated this media
    const { data: existingRating } = await supabase
      .from("ratings")
      .select("*")
      .match({ user_id: userId, media_id: mediaId, media_type: mediaType })
      .single()

    let result

    if (existingRating) {
      // Update existing rating
      result = await supabase
        .from("ratings")
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .match({ user_id: userId, media_id: mediaId, media_type: mediaType })
    } else {
      // Insert new rating
      result = await supabase.from("ratings").insert({
        user_id: userId,
        media_id: mediaId,
        media_type: mediaType,
        rating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) throw result.error
    return { success: true, data: result.data }
  } catch (error) {
    console.error("Error rating media:", error)
    return { success: false, error }
  }
}

export async function getUserRating(mediaId: number, mediaType: "ANIME" | "MANGA", userId: string) {
  try {
    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .match({ user_id: userId, media_id: mediaId, media_type: mediaType })
      .single()

    if (error && error.code !== "PGRST116") throw error // PGRST116 is the error code for no rows returned

    return { success: true, rating: data?.rating || 0 }
  } catch (error) {
    console.error("Error getting user rating:", error)
    return { success: false, rating: 0, error }
  }
}

export async function getUserRatings(userId: string, mediaType?: "ANIME" | "MANGA") {
  try {
    let query = supabase.from("ratings").select("*").eq("user_id", userId)

    if (mediaType) {
      query = query.eq("media_type", mediaType)
    }

    const { data, error } = await query.order("updated_at", { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error getting user ratings:", error)
    return { success: false, data: [], error }
  }
}

// Rate an anime or manga
// export async function rateItem(
//   itemId: number,
//   rating: number,
//   type: "anime" | "manga" = "anime",
// ): Promise<RatingResponse> {
//   const supabase = getSupabaseClient()

//   try {
//     // Check if the user has already rated this item
//     const { data: existingRating } = await supabase
//       .from("ratings")
//       .select("id, rating")
//       .eq("item_id", itemId)
//       .eq("item_type", type)
//       .single()

//     let result

//     if (existingRating) {
//       // Update the existing rating
//       result = await supabase
//         .from("ratings")
//         .update({
//           rating,
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", existingRating.id)
//     } else {
//       // Insert a new rating
//       result = await supabase.from("ratings").insert({
//         item_id: itemId,
//         item_type: type,
//         rating,
//       })
//     }

//     if (result.error) throw result.error

//     // Calculate the new average rating
//     const { data: avgData, error: avgError } = await supabase
//       .from("ratings")
//       .select("rating")
//       .eq("item_id", itemId)
//       .eq("item_type", type)

//     if (avgError) throw avgError

//     let averageRating = "0.0"

//     if (avgData && avgData.length > 0) {
//       const sum = avgData.reduce((acc, curr) => acc + curr.rating, 0)
//       averageRating = (sum / avgData.length).toFixed(1)

//       // Update the average score in the item table
//       await supabase.from(type).update({ average_score: averageRating }).eq("id", itemId)
//     }

//     return {
//       success: true,
//       message: "Rating submitted successfully",
//       rating,
//       averageRating,
//     }
//   } catch (error) {
//     console.error(`Error rating ${type}:`, error)
//     return {
//       success: false,
//       message: `Failed to submit rating: ${error.message}`,
//     }
//   }
// }

// Alias functions for backward compatibility
// export const rateAnime = (animeId: number, rating: number) => rateItem(animeId, rating, "anime")

// export const rateManga = (mangaId: number, rating: number) => rateItem(mangaId, rating, "manga")

// Get a user's rating for an item
// export async function getUserRating(itemId: number, type: "anime" | "manga" = "anime"): Promise<number | null> {
//   const supabase = getSupabaseClient()

//   try {
//     const { data, error } = await supabase
//       .from("ratings")
//       .select("rating")
//       .eq("item_id", itemId)
//       .eq("item_type", type)
//       .single()

//     if (error) {
//       // If the error is because the rating is not found, return null
//       if (error.code === "PGRST116") {
//         // Not found
//         return null
//       }
//       throw error
//     }

//     return data.rating
//   } catch (error) {
//     console.error(`Error getting user ${type} rating:`, error)
//     return null
//   }
// }

// Alias functions for backward compatibility
// export const getUserAnimeRating = (animeId: number) => getUserRating(animeId, "anime")

// export const getUserMangaRating = (mangaId: number) => getUserRating(mangaId, "manga")

// Fetch all ratings for the current user
export async function fetchUserRatings(type?: "anime" | "manga"): Promise<AnimeRating[]> {
  const supabase = getSupabaseClient()

  try {
    // Build the query
    let query = supabase
      .from("ratings")
      .select(`
        id,
        item_id,
        item_type,
        rating,
        created_at,
        updated_at,
        ${type === "anime" ? "anime" : type === "manga" ? "manga" : "anime, manga"}(id, title, cover_image)
      `)
      .order("updated_at", { ascending: false })

    // Filter by type if provided
    if (type) {
      query = query.eq("item_type", type)
    }

    const { data, error } = await query

    if (error) throw error

    if (!data || data.length === 0) {
      return []
    }

    // Transform the data to match the AnimeRating type
    const ratings: AnimeRating[] = data.map((item) => {
      const mediaData = item.item_type === "anime" ? item.anime : item.manga

      return {
        id: item.id,
        mediaId: item.item_id,
        type: item.item_type,
        rating: item.rating,
        title: mediaData?.title || "Unknown Title",
        coverImage: mediaData?.cover_image || null,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }
    })

    return ratings
  } catch (error) {
    console.error("Error fetching user ratings:", error)
    return []
  }
}

// Delete a rating
export async function deleteRating(ratingId: number): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    // Get the rating details first to update the average score later
    const { data: ratingData, error: fetchError } = await supabase
      .from("ratings")
      .select("item_id, item_type")
      .eq("id", ratingId)
      .single()

    if (fetchError) throw fetchError

    // Delete the rating
    const { error } = await supabase.from("ratings").delete().eq("id", ratingId)

    if (error) throw error

    // Recalculate the average rating
    if (ratingData) {
      const { data: avgData, error: avgError } = await supabase
        .from("ratings")
        .select("rating")
        .eq("item_id", ratingData.item_id)
        .eq("item_type", ratingData.item_type)

      if (avgError) throw avgError

      let averageRating = "0.0"

      if (avgData && avgData.length > 0) {
        const sum = avgData.reduce((acc, curr) => acc + curr.rating, 0)
        averageRating = (sum / avgData.length).toFixed(1)
      }

      // Update the average score in the item table
      await supabase.from(ratingData.item_type).update({ average_score: averageRating }).eq("id", ratingData.item_id)
    }

    return true
  } catch (error) {
    console.error("Error deleting rating:", error)
    return false
  }
}

// Update the getUserAnimeRating function to handle authentication properly
export async function getUserAnimeRating(animeId: number, token: string): Promise<number | null> {
  if (!token) {
    return null
  }

  try {
    const supabase = getSupabaseClient()

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .eq("user_id", user.id)
      .eq("media_id", animeId)
      .eq("media_type", "anime")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user anime rating:", error)
      return null
    }

    return data?.rating || null
  } catch (error) {
    console.error("Error in getUserAnimeRating:", error)
    return null
  }
}

// Update the getUserMangaRating function to handle authentication properly
export async function getUserMangaRating(mangaId: number, token: string): Promise<number | null> {
  if (!token) {
    return null
  }

  try {
    const supabase = getSupabaseClient()

    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .eq("user_id", user.id)
      .eq("media_id", mangaId)
      .eq("media_type", "manga")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user manga rating:", error)
      return null
    }

    return data?.rating || null
  } catch (error) {
    console.error("Error in getUserMangaRating:", error)
    return null
  }
}

// Update the rateAnime function to handle authentication properly
export async function rateAnime(animeId: number, rating: number, token: string): Promise<void> {
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

    // Check if rating already exists
    const { data: existingRating, error: checkError } = await supabase
      .from("ratings")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_id", animeId)
      .eq("media_type", "anime")
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from("ratings")
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRating.id)

      if (error) {
        throw error
      }
    } else {
      // Insert new rating
      const { error } = await supabase.from("ratings").insert({
        user_id: user.id,
        media_id: animeId,
        media_type: "anime",
        rating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }
    }
  } catch (error) {
    console.error("Error rating anime:", error)
    throw error
  }
}

// Update the rateManga function to handle authentication properly
export async function rateManga(mangaId: number, rating: number, token: string): Promise<void> {
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

    // Check if rating already exists
    const { data: existingRating, error: checkError } = await supabase
      .from("ratings")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_id", mangaId)
      .eq("media_type", "manga")
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from("ratings")
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRating.id)

      if (error) {
        throw error
      }
    } else {
      // Insert new rating
      const { error } = await supabase.from("ratings").insert({
        user_id: user.id,
        media_id: mangaId,
        media_type: "manga",
        rating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }
    }
  } catch (error) {
    console.error("Error rating manga:", error)
    throw error
  }
}
