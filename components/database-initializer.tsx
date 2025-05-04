"use client"

import { useEffect, useState } from "react"
import { checkDatabaseSchema, setupDatabase } from "@/lib/supabase/schema"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Database, Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DatabaseInitializer() {
  const [isChecking, setIsChecking] = useState(true)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualSetupRequired, setManualSetupRequired] = useState(false)
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
      setManualSetupRequired(false)

      const result = await setupDatabase()

      if (result.success) {
        setNeedsSetup(false)
        toast({
          title: "Database setup complete",
          description: "All required tables have been created successfully.",
        })
      } else {
        if (result.manualSetupRequired) {
          setManualSetupRequired(true)
          setError("Automatic setup failed. Please follow the manual setup instructions.")
        } else {
          setError(result.error?.message || "Failed to set up database. Please check the console for more information.")
        }

        toast({
          title: result.manualSetupRequired ? "Manual setup required" : "Setup failed",
          description: result.manualSetupRequired
            ? "Please follow the manual setup instructions."
            : "Failed to set up database. Please check the console for more information.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error setting up database:", err)
      setError(err.message || "An unexpected error occurred")
      setManualSetupRequired(true)
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
          The application requires database tables that don't exist yet. This may affect features like watchlists and
          ratings.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSetup} disabled={isSettingUp} className="bg-amber-600 hover:bg-amber-700 text-white">
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

          {manualSetupRequired && (
            <Button
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={() => (window.location.href = "/database-setup")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Manual Setup Instructions
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </AlertDescription>
    </Alert>
  )
}
