"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  loading: boolean
  resendConfirmationEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Get the Supabase client once at the module level
const supabase = getSupabaseClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return profile
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      return null
    }
  }

  // Function to create user profile if it doesn't exist
  const createUserProfile = async (userId: string, email: string, username: string, avatarUrl?: string) => {
    try {
      const newProfile = {
        id: userId,
        username: username || email?.split("@")[0] || "User",
        avatar_url: avatarUrl,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("profiles").insert(newProfile)

      if (error) {
        console.error("Error creating user profile:", error)
        return null
      }

      return newProfile
    } catch (error) {
      console.error("Error in createUserProfile:", error)
      return null
    }
  }

  // Function to set user state from session
  const setUserFromSession = async (session: any) => {
    if (!session?.user) {
      setUser(null)
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
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || "",
          name: profile.username || sessionUser.email?.split("@")[0] || "User",
          avatar_url: profile.avatar_url,
        })
      } else {
        // Fallback if we couldn't get or create a profile
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || "",
          name: sessionUser.email?.split("@")[0] || "User",
          avatar_url: sessionUser.user_metadata?.avatar_url,
        })
      }

      if (session?.access_token) {
        setToken(session.access_token)
      } else {
        setToken(null)
      }
    } catch (error) {
      console.error("Error setting user from session:", error)
      setUser(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)

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
            setUser(null)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setAuthLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error("Please check your email to confirm your account before logging in.")
        }
        throw error
      }

      await setUserFromSession(data.session)

      // Refresh the page to ensure all server components get the updated session
      router.refresh()

      return data
    } catch (error: any) {
      console.error("Error logging in:", error)
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      })
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      setAuthLoading(true)

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
            .from("profiles")
            .update({
              username: name,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id)
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
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive",
      })
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const resendConfirmationEmail = async (email: string) => {
    try {
      setAuthLoading(true)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) throw error

      toast({
        title: "Confirmation Email Sent",
        description: "Please check your inbox for the confirmation link",
      })
    } catch (error: any) {
      console.error("Error resending confirmation email:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to resend confirmation email",
        variant: "destructive",
      })
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = async () => {
    try {
      setAuthLoading(true)

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      setUser(null)

      // Refresh the page to ensure all server components get the updated session
      router.refresh()
    } catch (error: any) {
      console.error("Error logging out:", error)
      toast({
        title: "Logout Failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      })
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const updateProfile = async (profile: Partial<UserProfile>) => {
    try {
      setAuthLoading(true)

      if (!user) throw new Error("No user logged in")

      const updates = {
        username: profile.name,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)

      if (error) throw error

      setUser({ ...user, ...profile })

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        token,
        login,
        signup,
        logout,
        updateProfile,
        loading: loading || authLoading,
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
