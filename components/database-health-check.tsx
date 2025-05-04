"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { inspectTable } from "@/lib/supabase/inspect"
import { DB_SCHEMA } from "@/lib/supabase/schema"
import Link from "next/link"

export function DatabaseHealthCheck() {
  const [status, setStatus] = useState<"loading" | "healthy" | "issues">("loading")
  const [isChecking, setIsChecking] = useState(false)

  const checkDatabaseHealth = async () => {
    setIsChecking(true)

    try {
      // Check watchlist table
      const watchlistInspection = await inspectTable(DB_SCHEMA.TABLES.WATCHLIST, [
        "id",
        "user_id",
        "media_id",
        "media_type",
        "added_at",
      ])

      // Check ratings table
      const ratingsInspection = await inspectTable(DB_SCHEMA.TABLES.RATINGS, [
        "id",
        "user_id",
        "media_id",
        "media_type",
        "rating",
        "created_at",
        "updated_at",
      ])

      // Check if there are any issues
      const hasIssues =
        !watchlistInspection.exists ||
        watchlistInspection.missingColumns.length > 0 ||
        !ratingsInspection.exists ||
        ratingsInspection.missingColumns.length > 0

      setStatus(hasIssues ? "issues" : "healthy")
    } catch (error) {
      console.error("Error checking database health:", error)
      setStatus("issues")
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDatabaseHealth()
  }, [])

  return (
    <div className="flex items-center gap-2">
      {status === "loading" || isChecking ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Checking database...</span>
        </>
      ) : status === "healthy" ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-xs text-muted-foreground">Database healthy</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <Link href="/database-tools" className="text-xs text-amber-500 hover:underline">
            Database issues detected
          </Link>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={checkDatabaseHealth} disabled={isChecking}>
            <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </>
      )}
    </div>
  )
}
