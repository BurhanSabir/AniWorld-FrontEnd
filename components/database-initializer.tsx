"use client"

import { useEffect, useState } from "react"
import { checkDatabaseSchema, setupDatabase } from "@/lib/supabase/schema"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Database, Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export function DatabaseInitializer() {
  const [isChecking, setIsChecking] = useState(true)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const checkSchema = async () => {
      try {
        setIsChecking(true)
        const result = await checkDatabaseSchema()

        // If any table is missing, we need setup
        if (!result.watchlistTable || !result.ratingsTable || !result.profilesTable) {
          setNeedsSetup(true)
        }
      } catch (err: any) {
        console.error("Error checking database schema:", err)
        // Don't set error state here, just log it
      } finally {
        setIsChecking(false)
      }
    }

    checkSchema()
  }, [])

  const handleSetup = async () => {
    try {
      setIsSettingUp(true)
      setError(null)

      const result = await setupDatabase()

      if (result.success) {
        setNeedsSetup(false)
        toast({
          title: "Database setup complete",
          description: "All required tables have been created successfully.",
        })
      } else {
        setError(result.error?.message || "Failed to set up database. Please check the console for more information.")
        toast({
          title: "Setup failed",
          description: "Failed to set up database. Please check the console for more information.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error setting up database:", err)
      setError(err.message || "An unexpected error occurred")
      toast({
        title: "Setup error",
        description: err.message || "An unexpected error occurred during setup",
        variant: "destructive",
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  if (isChecking) {
    return null // Don't show anything while checking
  }

  if (!needsSetup) {
    return null // Don't show anything if no setup is needed
  }

  return (
    <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Database Setup Required</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-amber-700">
          The application requires database tables that don't exist yet. This may affect features
          like watchlists and ratings.
        </p>
        <Button
          onClick={handleSetup}
          disabled={isSettingUp}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isSettingUp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Up...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Set Up Database
            </>
          )}
        </Button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </AlertDescription>
    </Alert>
  )
}
