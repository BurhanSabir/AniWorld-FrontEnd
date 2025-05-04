import { getSupabaseClient } from "./client"

// This function checks if the required tables exist and creates them if they don't
export async function checkAndCreateSchema() {
  const supabase = getSupabaseClient()

  try {
    console.log("Checking database schema...")

    // Check if the watchlist table exists
    const { error: watchlistError } = await supabase.from("watchlist").select("count").limit(1)

    if (watchlistError && watchlistError.message.includes("does not exist")) {
      console.error("Watchlist table does not exist. Please create it with the following schema:")
      console.error(`
        CREATE TABLE public.watchlist (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          media_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, media_id, media_type)
        );
      `)
    }

    // Check if the ratings table exists
    const { error: ratingsError } = await supabase.from("ratings").select("count").limit(1)

    if (ratingsError && ratingsError.message.includes("does not exist")) {
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

    return {
      watchlistTableExists: !watchlistError || !watchlistError.message.includes("does not exist"),
      ratingsTableExists: !ratingsError || !ratingsError.message.includes("does not exist"),
    }
  } catch (error) {
    console.error("Error checking database schema:", error)
    return {
      watchlistTableExists: false,
      ratingsTableExists: false,
      error,
    }
  }
}
