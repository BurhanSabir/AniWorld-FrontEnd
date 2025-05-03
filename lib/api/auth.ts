import { getSupabaseClient } from "@/lib/supabase/client"

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

export async function signUp(email: string, password: string, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error signing up:", error)
    return { success: false, error }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error signing in:", error)
    return { success: false, error }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false, error }
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, error }
  }
}

export async function updatePassword(password: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, error }
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw error

    return { success: true, session: data.session }
  } catch (error) {
    console.error("Error getting session:", error)
    return { success: false, session: null, error }
  }
}

export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) throw error

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Error getting user:", error)
    return { success: false, user: null, error }
  }
}
