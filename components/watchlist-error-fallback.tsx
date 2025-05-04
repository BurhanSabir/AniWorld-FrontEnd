"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { setupDatabase } from "@/lib/supabase/setup"
import { useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"

export function WatchlistErrorFallback() {
  const [isAttemptingFix, setIsAttemptingFix] = useState(false)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFixAttempt = async () => {
    setIsAttemptingFix(true)
    setFixResult(null)

    try {
      const success = await setupDatabase()

      if (success) {
        setFixResult({
          success: true,
          message: "Database setup completed successfully! Please refresh the page.",
        })
      } else {
        setFixResult({
          success: false,
          message: "Unable to automatically set up the database. Please check the console for manual instructions.",
        })
      }
    } catch (error) {
      setFixResult({
        success: false,
        message: `Error: ${error.message}`,
      })
    } finally {
      setIsAttemptingFix(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Database Setup Required
        </CardTitle>
        <CardDescription>The watchlist functionality requires database tables that don't exist yet.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">
          This is common when setting up the application for the first time. We can try to create the necessary tables
          automatically.
        </p>

        {fixResult && (
          <div
            className={`p-3 rounded-md mb-4 ${fixResult.success ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}
          >
            <div className="flex items-center gap-2">
              {fixResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <p className="text-sm">{fixResult.message}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleFixAttempt} disabled={isAttemptingFix} className="w-full">
          {isAttemptingFix ? "Setting Up Database..." : "Set Up Database"}
        </Button>
      </CardFooter>
    </Card>
  )
}
