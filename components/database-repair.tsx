"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw, Wrench } from "lucide-react"
import { repairAllTables } from "@/lib/supabase/repair"

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
      const repairResult = await repairAllTables()

      if (repairResult.success) {
        setResult({
          success: true,
          message: "Database tables repaired successfully!",
          details: [
            `Watchlist table: ${repairResult.watchlist.message}`,
            `Ratings table: ${repairResult.ratings.message}`,
          ],
        })
      } else {
        setResult({
          success: false,
          message: "Failed to repair some database tables.",
          details: [
            `Watchlist table: ${repairResult.watchlist.success ? "Success" : "Failed"} - ${repairResult.watchlist.message}`,
            `Ratings table: ${repairResult.ratings.success ? "Success" : "Failed"} - ${repairResult.ratings.message}`,
          ],
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
        <CardDescription>
          Fix database schema issues by creating or updating tables with the correct structure
        </CardDescription>
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
            <li>Creating missing tables</li>
            <li>Adding missing columns to existing tables</li>
            <li>Setting up proper relationships and constraints</li>
            <li>Ensuring proper row-level security policies</li>
          </ol>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Note: This operation will attempt to preserve existing data while fixing schema issues.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleRepair} disabled={isRepairing} className="w-full">
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
