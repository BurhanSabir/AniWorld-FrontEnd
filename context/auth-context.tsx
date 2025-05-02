"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  loading: boolean
  resendConfirmationEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        setLoading(true)

        // Get session data
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Get user profile data
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name:
              profile?.username || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
          })
        }
      } catch (error) {
        console.error("Error checking authentication status:", error)
      } finally {
        setLoading(false)
      }
    }

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Get user profile data
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        // If profile doesn't exist, create one
        if (!profile) {
          const newProfile = {
            id: session.user.id,
            username: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            avatar_url: session.user.user_metadata?.avatar_url,
            email: session.user.email,
          }

          await supabase.from("profiles").insert(newProfile)
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name:
            profile?.username || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
        })
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    checkUser()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check if the error is about email not confirmed
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error("Please check your email to confirm your account before logging in.")
        }
        throw error
      }

      // Get user profile data
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: profile?.username || data.user.email?.split("@")[0] || "User",
          avatar_url: profile?.avatar_url,
        })
      }
    } catch (error) {
      console.error("Error logging in:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resendConfirmationEmail = async (email: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) throw error

      return
    } catch (error) {
      console.error("Error resending confirmation email:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true)

      // For development purposes, we can disable email confirmation
      // In production, you would want to enable this
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This will automatically confirm the email in development
          // Remove this in production
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            username: name,
          },
        },
      })

      if (error) throw error

      // Check if email confirmation is required
      if (data?.user && data.user.identities?.length === 0) {
        throw new Error("This email is already registered. Please check your inbox for the confirmation email.")
      }

      if (data?.user && !data.session) {
        // Email confirmation is required
        return {
          success: true,
          message: "Please check your email to confirm your account before logging in.",
        }
      }

      // If we have a session, the user is automatically confirmed
      if (data?.user && data.session) {
        // Update the profile with the name
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: name })
          .eq("id", data.user.id)

        if (profileError) throw profileError

        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: name,
          avatar_url: null,
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error("Error logging out:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profile: Partial<UserProfile>) => {
    try {
      setLoading(true)
      if (!user) throw new Error("No user logged in")

      const updates = {
        username: profile.name,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)

      if (error) throw error

      setUser({ ...user, ...profile })
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        loading,
        resendConfirmationEmail,
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
