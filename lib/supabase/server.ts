import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Create a Supabase client for server-side usage
export const getSupabaseServer = () => {
  return createServerComponentClient({ cookies })
}
