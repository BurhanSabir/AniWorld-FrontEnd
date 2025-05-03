import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"

// Create a singleton instance of the Supabase client
let supabaseInstance: SupabaseClient | null = null

// Create a singleton instance of the Supabase client for client-side usage
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
}
