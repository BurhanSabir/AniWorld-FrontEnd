import { getSupabaseClient } from "@/lib/supabase/client"
import { DB_SCHEMA } from "@/lib/supabase/schema"
import { inspectTable } from "@/lib/supabase/inspect"
import type { AnimeRating } from "@/types/anime"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

// Cache for column mapping
let ratingsColumnMapping: Record<string, string> | null = null

/**
 * Gets the column mapping for the ratings table
 * @returns A promise that resolves to a column mapping object
 */
async function getRatingsColumnMapping(): Promise<Record<string, string>> {
  if (ratingsColumnMapping !== null) {
    return ratingsColumnMapping
  }

  const expectedColumns = ["id", "user_id", "media_id", "media_type", "rating", "created_at", "updated_at"]

  const inspection = await inspectTable(DB_SCHEMA.TABLES.RATINGS, expectedColumns)

  if (!inspection.exists) {
    // Default mapping if table doesn't exist
    return {
      id: "id",
      user_id: "user_id",
      media_id: "media_id",
      media_type: "media_type",
      rating: "rating",
      created_at: "created_at",
      updated_at: "updated_at",
    }
  }

  ratingsColumnMapping = inspection.columnMapping

  // Fill in any missing mappings with defaults
  for (const col of expectedColumns) {
    if (!ratingsColumnMapping[col]) {
      ratingsColumnMapping[col] = col
    }
  }

  return ratingsColumnMapping
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

    // Get column mapping
    const columnMapping = await getRatingsColumnMapping()

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
      .select(columnMapping.id)
      .eq(columnMapping.user_id, user.id)
      .eq(columnMapping.media_id, mediaId)
      .eq(columnMapping.media_type, mediaType)
      .maybeSingle()

    if (checkError && !checkError.message.includes("No rows found")) {
      console.error("Error checking ratings:", checkError)

      // If the error is about a missing column, try to repair the table
      if (checkError.message.includes("does not exist")) {
        const { repairRatingsTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairRatingsTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          ratingsColumnMapping = null
          return rateMedia(mediaId, mediaType, rating)
        } else {
          return {
            success: false,
            message: `Database error: ${checkError.message}. Repair attempt failed: ${repairResult.message}`,
          }
        }
      }

      return {
        success: false,
        message: `Failed to check if item is already rated: ${checkError.message}`,
      }
    }

    let result

    if (existingRating) {
      // Update existing rating
      result = await supabase
        .from(DB_SCHEMA.TABLES.RATINGS)
        .update({
          [columnMapping.rating]: rating,
          [columnMapping.updated_at]: new Date().toISOString(),
        })
        .eq(columnMapping.id, existingRating.id)
    } else {
      // Insert new rating
      result = await supabase.from(DB_SCHEMA.TABLES.RATINGS).insert({
        [columnMapping.user_id]: user.id,
        [columnMapping.media_id]: mediaId,
        [columnMapping.media_type]: mediaType,
        [columnMapping.rating]: rating,
        [columnMapping.created_at]: new Date().toISOString(),
        [columnMapping.updated_at]: new Date().toISOString(),
      })
    }

    if (result.error) {
      console.error("Error rating media:", result.error)

      // If the error is about a missing column, try to repair the table
      if (result.error.message.includes("does not exist")) {
        const { repairRatingsTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairRatingsTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          ratingsColumnMapping = null
          return rateMedia(mediaId, mediaType, rating)
        } else {
          return {
            success: false,
            message: `Database error: ${result.error.message}. Repair attempt failed: ${repairResult.message}`,
          }
        }
      }

      return {
        success: false,
        message: `Failed to rate item: ${result.error.message}`,
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
    // Get column mapping
    const columnMapping = await getRatingsColumnMapping()

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
      .select(columnMapping.rating)
      .eq(columnMapping.user_id, user.id)
      .eq(columnMapping.media_id, mediaId)
      .eq(columnMapping.media_type, mediaType)
      .maybeSingle()

    if (error && !error.message.includes("No rows found")) {
      console.error("Error getting user rating:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairRatingsTable } = await import("@/lib/supabase/repair")
        await repairRatingsTable()

        // Don't retry here to avoid potential infinite loops
        // Just return null and let the user try again
        return null
      }

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
    // Get column mapping
    const columnMapping = await getRatingsColumnMapping()

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
        ${columnMapping.id},
        ${columnMapping.media_id},
        ${columnMapping.media_type},
        ${columnMapping.rating},
        ${columnMapping.created_at},
        ${columnMapping.updated_at}
      `)
      .eq(columnMapping.user_id, user.id)
      .order(columnMapping.updated_at, { ascending: false })

    // Filter by type if provided
    if (type) {
      query = query.eq(columnMapping.media_type, type)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching user ratings:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairRatingsTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairRatingsTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          ratingsColumnMapping = null
          return fetchUserRatings(type)
        }
      }

      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transform the data to match the AnimeRating type
    const ratings: AnimeRating[] = data.map((item) => {
      return {
        id: item[columnMapping.id],
        mediaId: item[columnMapping.media_id],
        type: item[columnMapping.media_type],
        rating: item[columnMapping.rating],
        title: "Title will be fetched separately", // We'll need to fetch titles separately
        coverImage: null, // We'll need to fetch cover images separately
        createdAt: item[columnMapping.created_at],
        updatedAt: item[columnMapping.updated_at],
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
    // Get column mapping
    const columnMapping = await getRatingsColumnMapping()

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
      .eq(columnMapping.id, ratingId)
      .eq(columnMapping.user_id, user.id) // Ensure user can only delete their own ratings

    if (error) {
      console.error("Error deleting rating:", error)

      // If the error is about a missing column, try to repair the table
      if (error.message.includes("does not exist")) {
        const { repairRatingsTable } = await import("@/lib/supabase/repair")
        const repairResult = await repairRatingsTable()

        if (repairResult.success) {
          // Retry the operation with updated column mapping
          ratingsColumnMapping = null
          return deleteRating(ratingId)
        } else {
          return {
            success: false,
            message: `Database error: ${error.message}. Repair attempt failed: ${repairResult.message}`,
          }
        }
      }

      return {
        success: false,
        message: `Failed to delete rating: ${error.message}`,
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

/**
 * Ensures the ratings table exists with the correct schema
 * @returns A promise that resolves to a boolean indicating if the table is ready
 */
export async function ensureRatingsTable(): Promise<boolean> {
  try {
    const { repairRatingsTable } = await import("@/lib/supabase/repair")
    const result = await repairRatingsTable()
    return result.success
  } catch (error) {
    console.error("Error ensuring ratings table:", error)
    return false
  }
}
