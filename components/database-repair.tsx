"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw, Wrench } from "lucide-react"
import { repairDatabaseSchema } from "@/lib/supabase/repair"
import { setupDatabase } from "@/lib/supabase/schema"

export function DatabaseRepair() {
  const [isRepairing, setIsRepairing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string[]
  } | null>(null)

  const handleRepair = async () => {
    setIsRepairing(true)
    setResult(null)

    try {
      // First try to set up the database normally
      const setupResult = await setupDatabase()

      if (setupResult.success) {
        setResult({
          success: true,
          message: "Database setup completed successfully!",
          details: [
            `Watchlist table: ${setupResult.watchlistTable ? "OK" : "Failed"}`,
            `Ratings table: ${setupResult.ratingsTable ? "OK" : "Failed"}`,
            `Profiles table: ${setupResult.profilesTable ? "OK" : "Failed"}`,
          ],
        })
        return
      }

      // If setup failed and manual setup is required, show instructions
      if (setupResult.manualSetupRequired && setupResult.setupInstructions) {
        setResult({
          success: false,
          message: "Manual database setup is required.",
          details: ["Please follow the instructions below to set up your database:"],
        })
        return
      }

      // If setup failed for other reasons, try to repair
      const repairResult = await repairDatabaseSchema()

      if (repairResult.success) {
        setResult({
          success: true,
          message: "Database schema repaired successfully!",
          details: [
            `Watchlist table: ${repairResult.watchlistRepaired ? "Repaired" : "Not needed"}`,
            `Ratings table: ${repairResult.ratingsRepaired ? "Repaired" : "Not needed"}`,
            `Profiles table: ${repairResult.profilesRepaired ? "Repaired" : "Not needed"}`,
          ],
        })
      } else {
        setResult({
          success: false,
          message: "Failed to repair database schema.",
          details: [repairResult.error?.message || "Unknown error"],
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: "An error occurred while repairing the database.",
        details: [error.message || "Unknown error"],
      })
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Database Repair
        </CardTitle>
        <CardDescription>Fix database schema issues by recreating tables with the correct structure</CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.message}</AlertTitle>
            {result.details && (
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  {result.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </AlertDescription>
            )}
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-sm">This utility will attempt to fix issues with your database schema by:</p>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>Backing up any existing data</li>
            <li>Recreating tables with the correct column names</li>
            <li>Restoring your data if possible</li>
          </ol>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Warning: This is a potentially destructive operation. Please make sure you have a backup of your data before
            proceeding.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleRepair} disabled={isRepairing} className="w-full" variant="destructive">
          {isRepairing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Repairing...
            </>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              Repair Database
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
