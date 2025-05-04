"use client"

import { useState, useEffect } from "react"
import { checkAndCreateSchema } from "@/lib/supabase/schema"
import { useAuth } from "@/context/auth-context"
import { AlertCircle, CheckCircle } from "lucide-react"

export function DatabaseStatus() {
  const [status, setStatus] = useState<{
    watchlistTableExists: boolean
    ratingsTableExists: boolean
    error?: any
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const checkSchema = async () => {
      if (!user) return

      try {
        const result = await checkAndCreateSchema()
        setStatus(result)
      } catch (error) {
        console.error("Error checking schema:", error)
        setStatus({
          watchlistTableExists: false,
          ratingsTableExists: false,
          error,
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkSchema()
  }, [user])

  // Only show to admin users (you'll need to implement this check)
  if (!user || isLoading || !status) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 max-w-xs">
      <h3 className="font-bold text-sm mb-2">Database Status</h3>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          {status.watchlistTableExists ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span>Watchlist Table: {status.watchlistTableExists ? "OK" : "Missing"}</span>
        </div>

        <div className="flex items-center gap-2">
          {status.ratingsTableExists ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span>Ratings Table: {status.ratingsTableExists ? "OK" : "Missing"}</span>
        </div>

        {(!status.watchlistTableExists || !status.ratingsTableExists) && (
          <p className="text-red-500 mt-2">
            Database schema issues detected. Check the console for SQL commands to fix.
          </p>
        )}
      </div>
    </div>
  )
}
