import { getSupabaseClient } from "@/lib/supabase/client"
import type { AnimeRating } from "@/types/anime"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

interface RatingResponse {
  success: boolean
  message: string
  rating?: number
  averageRating?: string
}

// Check if the ratings table exists and create it if it doesn't
async function ensureRatingsTable() {
  try {
    // Check if the table exists by attempting to query it
    const { error } = await supabase.from("ratings").select("count").limit(1)

    if (error && error.message.includes("does not exist")) {
      console.log("Creating ratings table...")
      // Create the table using SQL - this requires admin privileges
      // In a real app, you would handle this with migrations
      // For now, we'll just log the error and provide guidance
      console.error("Ratings table does not exist. Please create it with the following schema:")
      console.error(`
        CREATE TABLE public.ratings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          media_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          rating INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, media_id, media_type)
        );
      `)
    }
  } catch (err) {
    console.error("Error checking/creating ratings table:", err)
  }
}

// Initialize the database check
ensureRatingsTable()

// Rate an anime or manga with error handling for schema issues
export async function rateMedia(
  mediaId: number,
  mediaType: "anime" | "manga",
  rating: number,
): Promise<RatingResponse> {
  try {
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

    // Check if rating already exists
    const { data: existingRating, error: checkError } = await supabase
      .from("ratings")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType)
      .maybeSingle()

    // Handle potential schema errors
    if (checkError) {
      if (checkError.message.includes('column "media_id" does not exist')) {
        console.error('Database schema error: column "media_id" does not exist in ratings table')
        return {
          success: false,
          message: "Database schema error. Please contact support.",
        }
      }

      if (checkError.code !== "PGRST116") {
        // Not found error
        throw checkError
      }
    }

    let result

    if (existingRating) {
      // Update existing rating
      result = await supabase
        .from("ratings")
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRating.id)
    } else {
      // Insert new rating
      result = await supabase.from("ratings").insert({
        user_id: user.id,
        media_id: mediaId,
        media_type: mediaType,
        rating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      throw result.error
    }

    return {
      success: true,
      message: "Rating submitted successfully",
      rating,
    }
  } catch (error) {
    console.error("Error rating media:", error)
    return {
      success: false,
      message: `Failed to submit rating: ${error.message}`,
    }
  }
}

// Get a user's rating with proper error handling
export async function getUserRating(mediaId: number, mediaType: "anime" | "manga"): Promise<number | null> {
  try {
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
      .eq("media_id", mediaId)
      .eq("media_type", mediaType)
      .maybeSingle()

    // Handle potential schema errors
    if (error) {
      if (error.message.includes('column "media_id" does not exist')) {
        console.error('Database schema error: column "media_id" does not exist in ratings table')
        return null
      }

      if (error.code !== "PGRST116") {
        // Not found error
        console.error("Error fetching user rating:", error)
        return null
      }
    }

    return data?.rating || null
  } catch (error) {
    console.error("Error getting user rating:", error)
    return null
  }
}

// Convenience functions for anime and manga ratings
export const getUserAnimeRating = (animeId: number) => getUserRating(animeId, "anime")
export const getUserMangaRating = (mangaId: number) => getUserRating(mangaId, "manga")
export const rateAnime = (animeId: number, rating: number) => rateMedia(animeId, rating, "anime")
export const rateManga = (mangaId: number, rating: number) => rateMedia(mangaId, rating, "manga")

// Fetch all ratings for the current user
export async function fetchUserRatings(type?: "anime" | "manga"): Promise<AnimeRating[]> {
  try {
    // Get user ID from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Build the query
    let query = supabase
      .from("ratings")
      .select(`
        id,
        media_id,
        media_type,
        rating,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    // Filter by type if provided
    if (type) {
      query = query.eq("media_type", type)
    }

    const { data, error } = await query

    if (error) {
      if (error.message.includes("does not exist")) {
        console.error("Database schema error: ratings table or column does not exist")
        return []
      }
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transform the data to match the AnimeRating type
    const ratings: AnimeRating[] = data.map((item) => {
      return {
        id: item.id,
        mediaId: item.media_id,
        type: item.media_type,
        rating: item.rating,
        title: "Title will be fetched separately", // We'll need to fetch titles separately
        coverImage: null, // We'll need to fetch cover images separately
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
  try {
    const { error } = await supabase.from("ratings").delete().eq("id", ratingId)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting rating:", error)
    return false
  }
}
