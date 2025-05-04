import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"

// Define a type for our Supabase client
type TypedSupabaseClient = SupabaseClient

// Create a singleton instance of the Supabase client for client-side usage
let supabaseInstance: TypedSupabaseClient | null = null

/**
 * Returns a singleton instance of the Supabase client
 * This ensures we only create one instance of the client throughout the application
 */
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
}

/**
 * Resets the Supabase client instance
 * Useful for testing or when you need to force a new instance
 */
export const resetSupabaseClient = () => {
  supabaseInstance = null
}
