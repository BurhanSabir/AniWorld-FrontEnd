"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, Loader2, Copy, ExternalLink } from "lucide-react"
import { setupDatabase } from "@/lib/supabase/schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

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
  const [manualSetupRequired, setManualSetupRequired] = useState(false)
  const [setupInstructions, setSetupInstructions] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setManualSetupRequired(false)
    setSetupInstructions(null)

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
        setError(result.error?.message || "Failed to set up database automatically.")
        setSetupDetails({
          watchlistTable: result.watchlistTable,
          ratingsTable: result.ratingsTable,
          profilesTable: result.profilesTable,
        })

        if (result.manualSetupRequired && result.setupInstructions) {
          setManualSetupRequired(true)
          setSetupInstructions(result.setupInstructions)
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const copyInstructions = () => {
    if (setupInstructions) {
      navigator.clipboard.writeText(setupInstructions)
      toast({
        title: "Copied to clipboard",
        description: "Setup instructions have been copied to your clipboard.",
      })
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

        {manualSetupRequired && setupInstructions && (
          <div className="mt-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Manual Setup Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                Automatic setup failed. Please follow the manual setup instructions.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="instructions" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="sql">SQL Code</TabsTrigger>
              </TabsList>
              <TabsContent value="instructions" className="space-y-4">
                <div className="text-sm mt-2">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Navigate to the SQL Editor</li>
                    <li>Create a new query</li>
                    <li>Copy the SQL code from the SQL tab</li>
                    <li>Run the query</li>
                    <li>Refresh this application</li>
                  </ol>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={copyInstructions}>
                    <Copy className="h-4 w-4" />
                    Copy Instructions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => window.open("https://app.supabase.com", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Supabase
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="sql">
                <div className="relative">
                  <pre className="text-xs bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-[300px]">
                    {setupInstructions.split("```sql")[1].split("```")[0]}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 flex items-center gap-1"
                    onClick={() => {
                      const sql = setupInstructions.split("```sql")[1].split("```")[0]
                      navigator.clipboard.writeText(sql)
                      toast({
                        title: "SQL Copied",
                        description: "SQL code has been copied to your clipboard.",
                      })
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy SQL
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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
