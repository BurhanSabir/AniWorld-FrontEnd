import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a new Supabase client for server components
 * This should be called within server components or server actions
 */
export const getSupabaseServer = (): SupabaseClient => {
  return createServerComponentClient({ cookies })
}
