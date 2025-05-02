import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Create a singleton instance of the Supabase client for client-side usage
export const getSupabaseClient = () => {
  return createClientComponentClient()
}
