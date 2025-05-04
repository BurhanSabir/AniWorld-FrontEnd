import { getSupabaseClient } from "@/lib/supabase/client"
import { DB_SCHEMA, tableExists } from "@/lib/supabase/schema"
import type { AnimeRating } from "@/types/anime"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

// Cache for table existence check
let ratingsTableExists: boolean | null = null

/**
 * Ensures the ratings table exists before performing operations
 * @returns A promise that resolves to a boolean indicating if the table exists
 */
async function ensureRatingsTable(): Promise<boolean> {
  // Use cached value if available
  if (ratingsTableExists !== null) {
    return ratingsTableExists
  }

  try {
    ratingsTableExists = await tableExists(DB_SCHEMA.TABLES.RATINGS)
    return ratingsTableExists
  } catch (error) {
    console.error("Error checking ratings table:", error)
    return false
  }
}

/**
 * Rates a media item
 * @param mediaId The ID of the media to rate
 * @param mediaType The type of media (anime or manga)
 * @param rating The rating to give (1-10)
 * @returns A promise that resolves to an object with success status and optional error message
 */
export async function rateMedia(
  mediaId: number,
  mediaType: "anime" | "manga",
  rating: number,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Validate rating
    if (rating < 1 || rating > 10) {
      return {
        success: false,
        message: "Rating must be between 1 and 10.",
      }
    }

    // Ensure table exists
    const tableExists = await ensureRatingsTable()
    if (!tableExists) {
      return {
        success: false,
        message: "Ratings table does not exist. Please set up the database.",
      }
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to rate items.",
      }
    }

    // Check if item is already rated
    const { data: existingRating, error: checkError } = await supabase
      .from(DB_SCHEMA.TABLES.RATINGS)
      .select(DB_SCHEMA.COLUMNS.RATINGS.ID)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.USER_ID, user.id)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.MEDIA_ID, mediaId)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE, mediaType)
      .maybeSingle()

    if (checkError && !checkError.message.includes("No rows found")) {
      console.error("Error checking ratings:", checkError)
      return {
        success: false,
        message: "Failed to check if item is already rated.",
      }
    }

    let result

    if (existingRating) {
      // Update existing rating
      result = await supabase
        .from(DB_SCHEMA.TABLES.RATINGS)
        .update({
          [DB_SCHEMA.COLUMNS.RATINGS.RATING]: rating,
          [DB_SCHEMA.COLUMNS.RATINGS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(DB_SCHEMA.COLUMNS.RATINGS.ID, existingRating.id)
    } else {
      // Insert new rating
      result = await supabase.from(DB_SCHEMA.TABLES.RATINGS).insert({
        [DB_SCHEMA.COLUMNS.RATINGS.USER_ID]: user.id,
        [DB_SCHEMA.COLUMNS.RATINGS.MEDIA_ID]: mediaId,
        [DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE]: mediaType,
        [DB_SCHEMA.COLUMNS.RATINGS.RATING]: rating,
        [DB_SCHEMA.COLUMNS.RATINGS.CREATED_AT]: new Date().toISOString(),
        [DB_SCHEMA.COLUMNS.RATINGS.UPDATED_AT]: new Date().toISOString(),
      })
    }

    if (result.error) {
      console.error("Error rating media:", result.error)
      return {
        success: false,
        message: "Failed to rate item.",
      }
    }

    return {
      success: true,
      message: "Item rated successfully.",
    }
  } catch (error: any) {
    console.error("Error in rateMedia:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    }
  }
}

/**
 * Gets a user's rating for a media item
 * @param mediaId The ID of the media to get the rating for
 * @param mediaType The type of media (anime or manga)
 * @returns A promise that resolves to the rating or null if not rated
 */
export async function getUserRating(mediaId: number, mediaType: "anime" | "manga"): Promise<number | null> {
  try {
    // Ensure table exists
    const tableExists = await ensureRatingsTable()
    if (!tableExists) {
      return null
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get rating
    const { data, error } = await supabase
      .from(DB_SCHEMA.TABLES.RATINGS)
      .select(DB_SCHEMA.COLUMNS.RATINGS.RATING)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.USER_ID, user.id)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.MEDIA_ID, mediaId)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE, mediaType)
      .maybeSingle()

    if (error && !error.message.includes("No rows found")) {
      console.error("Error getting user rating:", error)
      return null
    }

    return data?.rating || null
  } catch (error) {
    console.error("Error in getUserRating:", error)
    return null
  }
}

/**
 * Convenience function to get a user's anime rating
 * @param animeId The ID of the anime to get the rating for
 * @returns A promise that resolves to the rating or null if not rated
 */
export const getUserAnimeRating = (animeId: number) => getUserRating(animeId, "anime")

/**
 * Convenience function to get a user's manga rating
 * @param mangaId The ID of the manga to get the rating for
 * @returns A promise that resolves to the rating or null if not rated
 */
export const getUserMangaRating = (mangaId: number) => getUserRating(mangaId, "manga")

/**
 * Convenience function to rate an anime
 * @param animeId The ID of the anime to rate
 * @param rating The rating to give (1-10)
 * @returns A promise that resolves to an object with success status and optional error message
 */
export const rateAnime = (animeId: number, rating: number) => rateMedia(animeId, "anime", rating)

/**
 * Convenience function to rate a manga
 * @param mangaId The ID of the manga to rate
 * @param rating The rating to give (1-10)
 * @returns A promise that resolves to an object with success status and optional error message
 */
export const rateManga = (mangaId: number, rating: number) => rateMedia(mangaId, "manga", rating)

/**
 * Fetches all ratings for the current user
 * @param type The type of media to fetch ratings for (anime or manga)
 * @returns A promise that resolves to an array of ratings
 */
export async function fetchUserRatings(type?: "anime" | "manga"): Promise<AnimeRating[]> {
  try {
    // Ensure table exists
    const tableExists = await ensureRatingsTable()
    if (!tableExists) {
      console.error("Ratings table does not exist. Please set up the database.")
      return []
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Build query
    let query = supabase
      .from(DB_SCHEMA.TABLES.RATINGS)
      .select(`
        ${DB_SCHEMA.COLUMNS.RATINGS.ID},
        ${DB_SCHEMA.COLUMNS.RATINGS.MEDIA_ID},
        ${DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE},
        ${DB_SCHEMA.COLUMNS.RATINGS.RATING},
        ${DB_SCHEMA.COLUMNS.RATINGS.CREATED_AT},
        ${DB_SCHEMA.COLUMNS.RATINGS.UPDATED_AT}
      `)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.USER_ID, user.id)
      .order(DB_SCHEMA.COLUMNS.RATINGS.UPDATED_AT, { ascending: false })

    // Filter by type if provided
    if (type) {
      query = query.eq(DB_SCHEMA.COLUMNS.RATINGS.MEDIA_TYPE, type)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching user ratings:", error)
      return []
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
    console.error("Error in fetchUserRatings:", error)
    return []
  }
}

/**
 * Deletes a rating
 * @param ratingId The ID of the rating to delete
 * @returns A promise that resolves to a boolean indicating if the deletion was successful
 */
export async function deleteRating(ratingId: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Ensure table exists
    const tableExists = await ensureRatingsTable()
    if (!tableExists) {
      return {
        success: false,
        message: "Ratings table does not exist. Please set up the database.",
      }
    }

    // Get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to delete ratings.",
      }
    }

    // Delete rating
    const { error } = await supabase
      .from(DB_SCHEMA.TABLES.RATINGS)
      .delete()
      .eq(DB_SCHEMA.COLUMNS.RATINGS.ID, ratingId)
      .eq(DB_SCHEMA.COLUMNS.RATINGS.USER_ID, user.id) // Ensure user can only delete their own ratings

    if (error) {
      console.error("Error deleting rating:", error)
      return {
        success: false,
        message: "Failed to delete rating.",
      }
    }

    return {
      success: true,
      message: "Rating deleted successfully.",
    }
  } catch (error: any) {
    console.error("Error in deleteRating:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    }
  }
}
