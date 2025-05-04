"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DB_SCHEMA } from "@/lib/supabase/schema"
import type { Session } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  token: string | null
  isLoading: boolean
  isAuthenticating: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string }>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    token: null,
    isLoading: true,
    isAuthenticating: false,
  })
  const router = useRouter()
  const { toast } = useToast()

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async (userId: string): Promise<any | null> => {
    try {
      const { data: profile, error } = await supabase
        .from(DB_SCHEMA.TABLES.PROFILES)
        .select("*")
        .eq(DB_SCHEMA.COLUMNS.PROFILES.ID, userId)
        .single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return profile
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      return null
    }
  }, [])

  // Function to create user profile if it doesn't exist
  const createUserProfile = useCallback(
    async (userId: string, email: string, username: string, avatarUrl?: string): Promise<any | null> => {
      try {
        const newProfile = {
          [DB_SCHEMA.COLUMNS.PROFILES.ID]: userId,
          [DB_SCHEMA.COLUMNS.PROFILES.USERNAME]: username || email?.split("@")[0] || "User",
          [DB_SCHEMA.COLUMNS.PROFILES.AVATAR_URL]: avatarUrl,
          [DB_SCHEMA.COLUMNS.PROFILES.EMAIL]: email,
          [DB_SCHEMA.COLUMNS.PROFILES.CREATED_AT]: new Date().toISOString(),
          [DB_SCHEMA.COLUMNS.PROFILES.UPDATED_AT]: new Date().toISOString(),
        }

        const { error } = await supabase.from(DB_SCHEMA.TABLES.PROFILES).insert(newProfile)

        if (error) {
          console.error("Error creating user profile:", error)
          return null
        }

        return newProfile
      } catch (error) {
        console.error("Error in createUserProfile:", error)
        return null
      }
    },
    [],
  )

  // Function to set user state from session
  const setUserFromSession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setState((prev) => ({ ...prev, user: null, isAuthenticated: false, token: null }))
        return
      }

      try {
        const { user: sessionUser } = session

        // Get user profile data
        let profile = await fetchUserProfile(sessionUser.id)

        // If profile doesn't exist, create one
        if (!profile) {
          profile = await createUserProfile(
            sessionUser.id,
            sessionUser.email || "",
            sessionUser.user_metadata?.full_name || "",
            sessionUser.user_metadata?.avatar_url,
          )
        }

        if (profile) {
          setState((prev) => ({
            ...prev,
            user: {
              id: sessionUser.id,
              email: sessionUser.email || "",
              name: profile.username || sessionUser.email?.split("@")[0] || "User",
              avatar_url: profile.avatar_url,
            },
            isAuthenticated: true,
            token: session.access_token || null,
          }))
        } else {
          // Fallback if we couldn't get or create a profile
          setState((prev) => ({
            ...prev,
            user: {
              id: sessionUser.id,
              email: sessionUser.email || "",
              name: sessionUser.email?.split("@")[0] || "User",
              avatar_url: sessionUser.user_metadata?.avatar_url,
            },
            isAuthenticated: true,
            token: session.access_token || null,
          }))
        }
      } catch (error) {
        console.error("Error setting user from session:", error)
        setState((prev) => ({ ...prev, user: null, isAuthenticated: false, token: null }))
      }
    },
    [fetchUserProfile, createUserProfile],
  )

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }))

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        await setUserFromSession(session)

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event)

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await setUserFromSession(session)
          } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
            setState((prev) => ({ ...prev, user: null, isAuthenticated: false, token: null }))
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setState((prev) => ({ ...prev, user: null, isAuthenticated: false, token: null }))
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    initializeAuth()
  }, [setUserFromSession])

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await setUserFromSession(session)
    } catch (error) {
      console.error("Error refreshing session:", error)
    }
  }, [setUserFromSession])

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setState((prev) => ({ ...prev, isAuthenticating: true }))

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            return {
              success: false,
              error: "Please check your email to confirm your account before logging in.",
            }
          }
          return { success: false, error: error.message }
        }

        await setUserFromSession(data.session)

        // Refresh the page to ensure all server components get the updated session
        router.refresh()

        return { success: true }
      } catch (error: any) {
        console.error("Error logging in:", error)
        return { success: false, error: error.message || "An error occurred during login" }
      } finally {
        setState((prev) => ({ ...prev, isAuthenticating: false }))
      }
    },
    [router, setUserFromSession],
  )

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> => {
      try {
        setState((prev) => ({ ...prev, isAuthenticating: true }))

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: name,
            },
          },
        })

        if (error) return { success: false, error: error.message }

        // Check if email confirmation is required
        if (data?.user && data.user.identities?.length === 0) {
          return {
            success: false,
            error: "This email is already registered. Please check your inbox for the confirmation email.",
          }
        }

        if (data?.user && !data.session) {
          // Email confirmation is required
          return {
            success: true,
            requiresEmailConfirmation: true,
          }
        }

        // If we have a session, the user is automatically confirmed
        if (data?.user && data.session) {
          // Create or update the profile
          const profile = await fetchUserProfile(data.user.id)

          if (!profile) {
            await createUserProfile(data.user.id, data.user.email || "", name, data.user.user_metadata?.avatar_url)
          } else {
            // Update existing profile
            await supabase
              .from(DB_SCHEMA.TABLES.PROFILES)
              .update({
                [DB_SCHEMA.COLUMNS.PROFILES.USERNAME]: name,
                [DB_SCHEMA.COLUMNS.PROFILES.UPDATED_AT]: new Date().toISOString(),
              })
              .eq(DB_SCHEMA.COLUMNS.PROFILES.ID, data.user.id)
          }

          await setUserFromSession(data.session)

          // Refresh the page to ensure all server components get the updated session
          router.refresh()
        }

        return {
          success: true,
          requiresEmailConfirmation: !data.session,
        }
      } catch (error: any) {
        console.error("Error signing up:", error)
        return { success: false, error: error.message || "An error occurred during signup" }
      } finally {
        setState((prev) => ({ ...prev, isAuthenticating: false }))
      }
    },
    [router, setUserFromSession, fetchUserProfile, createUserProfile],
  )

  const resendConfirmationEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState((prev) => ({ ...prev, isAuthenticating: true }))

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) return { success: false, error: error.message }

      return { success: true }
    } catch (error: any) {
      console.error("Error resending confirmation email:", error)
      return { success: false, error: error.message || "Failed to resend confirmation email" }
    } finally {
      setState((prev) => ({ ...prev, isAuthenticating: false }))
    }
  }, [])

  const logout = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setState((prev) => ({ ...prev, isAuthenticating: true }))

      const { error } = await supabase.auth.signOut()

      if (error) return { success: false, error: error.message }

      setState((prev) => ({ ...prev, user: null, isAuthenticated: false, token: null }))

      // Refresh the page to ensure all server components get the updated session
      router.refresh()

      return { success: true }
    } catch (error: any) {
      console.error("Error logging out:", error)
      return { success: false, error: error.message || "An error occurred during logout" }
    } finally {
      setState((prev) => ({ ...prev, isAuthenticating: false }))
    }
  }, [router])

  const updateProfile = useCallback(
    async (profile: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
      try {
        setState((prev) => ({ ...prev, isAuthenticating: true }))

        if (!state.user) return { success: false, error: "No user logged in" }

        const updates = {
          [DB_SCHEMA.COLUMNS.PROFILES.USERNAME]: profile.name,
          [DB_SCHEMA.COLUMNS.PROFILES.AVATAR_URL]: profile.avatar_url,
          [DB_SCHEMA.COLUMNS.PROFILES.UPDATED_AT]: new Date().toISOString(),
        }

        const { error } = await supabase
          .from(DB_SCHEMA.TABLES.PROFILES)
          .update(updates)
          .eq(DB_SCHEMA.COLUMNS.PROFILES.ID, state.user.id)

        if (error) return { success: false, error: error.message }

        setState((prev) => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...profile } : null,
        }))

        return { success: true }
      } catch (error: any) {
        console.error("Error updating profile:", error)
        return { success: false, error: error.message || "Failed to update profile" }
      } finally {
        setState((prev) => ({ ...prev, isAuthenticating: false }))
      }
    },
    [state.user],
  )

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateProfile,
        resendConfirmationEmail,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
