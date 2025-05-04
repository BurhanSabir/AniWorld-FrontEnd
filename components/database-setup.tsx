"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, Loader2 } from "lucide-react"
import { setupDatabase } from "@/lib/supabase/schema"

interface DatabaseSetupProps {
  onSetupComplete?: () => void
}

export function DatabaseSetup({ onSetupComplete }: DatabaseSetupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [setupDetails, setSetupDetails] = useState<{
    watchlistTable: boolean
    ratingsTable: boolean
    profilesTable: boolean
  } | null>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await setupDatabase()

      if (result.success) {
        setSuccess(true)
        setSetupDetails({
          watchlistTable: result.watchlistTable,
          ratingsTable: result.ratingsTable,
          profilesTable: result.profilesTable,
        })
        if (onSetupComplete) {
          onSetupComplete()
        }
      } else {
        setError(result.error?.message || "Failed to set up database. Please check the console for more information.")
        setSetupDetails({
          watchlistTable: result.watchlistTable,
          ratingsTable: result.ratingsTable,
          profilesTable: result.profilesTable,
        })
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
        <CardDescription>
          Set up the necessary database tables for the application to function properly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/10 border-green-500/50 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Database setup completed successfully. You may need to refresh the page.
            </AlertDescription>
          </Alert>
        )}

        {setupDetails && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {setupDetails.watchlistTable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Watchlist Table</span>
            </div>
            <div className="flex items-center gap-2">
              {setupDetails.ratingsTable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Ratings Table</span>
            </div>
            <div className="flex items-center gap-2">
              {setupDetails.profilesTable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Profiles Table</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSetup} disabled={isLoading} className="w-full bg-gradient hover:opacity-90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Up...
            </>
          ) : (
            "Set Up Database"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
