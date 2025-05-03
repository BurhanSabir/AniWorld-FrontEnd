import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// We don't need to cache the server client as it's created per request
export const getSupabaseServer = () => {
  return createServerComponentClient({ cookies })
}
