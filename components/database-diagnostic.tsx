"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, RefreshCw } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { DB_SCHEMA } from "@/lib/supabase/schema"
import { inspectTable } from "@/lib/supabase/inspect"

export function DatabaseDiagnostic() {
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<{
    tables: Record<string, boolean>
    columns: Record<string, string[]>
    missingColumns: Record<string, string[]>
    errors: string[]
  } | null>(null)

  const checkDatabase = async () => {
    setIsChecking(true)
    setResults(null)

    try {
      const tables: Record<string, boolean> = {}
      const columns: Record<string, string[]> = {}
      const missingColumns: Record<string, string[]> = {}
      const errors: string[] = []

      // Check watchlist table
      const watchlistInspection = await inspectTable(DB_SCHEMA.TABLES.WATCHLIST, [
        "id",
        "user_id",
        "media_id",
        "media_type",
        "added_at",
      ])

      tables[DB_SCHEMA.TABLES.WATCHLIST] = watchlistInspection.exists
      columns[DB_SCHEMA.TABLES.WATCHLIST] = watchlistInspection.columns
      missingColumns[DB_SCHEMA.TABLES.WATCHLIST] = watchlistInspection.missingColumns

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

      tables[DB_SCHEMA.TABLES.RATINGS] = ratingsInspection.exists
      columns[DB_SCHEMA.TABLES.RATINGS] = ratingsInspection.columns
      missingColumns[DB_SCHEMA.TABLES.RATINGS] = ratingsInspection.missingColumns

      // Check profiles table
      const profilesInspection = await inspectTable(DB_SCHEMA.TABLES.PROFILES, [
        "id",
        "username",
        "avatar_url",
        "email",
        "bio",
        "created_at",
        "updated_at",
      ])

      tables[DB_SCHEMA.TABLES.PROFILES] = profilesInspection.exists
      columns[DB_SCHEMA.TABLES.PROFILES] = profilesInspection.columns
      missingColumns[DB_SCHEMA.TABLES.PROFILES] = profilesInspection.missingColumns

      // Check if helper functions exist
      const supabase = getSupabaseClient()

      try {
        const { error: functionError } = await supabase.rpc("get_table_columns", {
          table_name: "watchlist",
        })

        if (functionError && functionError.message.includes("function get_table_columns")) {
          errors.push("The get_table_columns function is missing. This is required for column name detection.")
        }
      } catch (error: any) {
        errors.push(`Error checking get_table_columns function: ${error.message}`)
      }

      try {
        const { error: functionError } = await supabase.rpc("execute_sql", {
          query: "SELECT 1",
        })

        if (functionError && functionError.message.includes("function execute_sql")) {
          errors.push("The execute_sql function is missing. This is required for database repairs.")
        }
      } catch (error: any) {
        errors.push(`Error checking execute_sql function: ${error.message}`)
      }

      setResults({ tables, columns, missingColumns, errors })
    } catch (error: any) {
      setResults({
        tables: {},
        columns: {},
        missingColumns: {},
        errors: [`Error checking database: ${error.message}`],
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Diagnostic
        </CardTitle>
        <CardDescription>Check your database tables and columns to diagnose issues</CardDescription>
      </CardHeader>
      <CardContent>
        {results?.errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2">
                {results.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tables</h3>
            <div className="grid gap-2">
              {Object.entries(results.tables).map(([table, exists]) => (
                <div key={table} className="flex items-center justify-between p-2 border rounded-md">
                  <span className="font-mono text-sm">{table}</span>
                  {exists ? (
                    <span className="text-green-500 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Exists
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> Missing
                    </span>
                  )}
                </div>
              ))}
            </div>

            <h3 className="text-lg font-medium mt-4">Columns</h3>
            <div className="space-y-3">
              {Object.entries(results.columns).map(([table, cols]) => (
                <div key={table} className="border rounded-md p-3">
                  <h4 className="font-medium mb-2">{table}</h4>
                  {cols.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {cols.map((col) => (
                        <div key={col} className="font-mono text-xs bg-muted p-1 rounded">
                          {col}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No columns found</p>
                  )}

                  {results.missingColumns[table].length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-amber-500 font-medium">Missing columns:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {results.missingColumns[table].map((col) => (
                          <div key={col} className="font-mono text-xs bg-amber-100 dark:bg-amber-900 p-1 rounded">
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkDatabase} disabled={isChecking} className="w-full">
          {isChecking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Run Diagnostic
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
