"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, RefreshCw } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { DB_SCHEMA } from "@/lib/supabase/schema"

export function DatabaseDiagnostic() {
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<{
    tables: Record<string, boolean>
    columns: Record<string, string[]>
    errors: string[]
  } | null>(null)

  const checkDatabase = async () => {
    setIsChecking(true)
    setResults(null)

    try {
      const supabase = getSupabaseClient()
      const tables: Record<string, boolean> = {}
      const columns: Record<string, string[]> = {}
      const errors: string[] = []

      // Check if tables exist
      for (const table of Object.values(DB_SCHEMA.TABLES)) {
        try {
          const { error } = await supabase.from(table).select("count").limit(1)
          tables[table] = !error || !error.message.includes("does not exist")

          if (tables[table]) {
            // Try to get columns
            try {
              const { data, error: colError } = await supabase.rpc("get_table_columns", { table_name: table })

              if (colError) {
                // Fallback: try to infer columns from a query
                const { data: sampleData, error: sampleError } = await supabase.from(table).select("*").limit(1)

                if (sampleError) {
                  errors.push(`Error fetching columns for ${table}: ${sampleError.message}`)
                  columns[table] = []
                } else {
                  columns[table] = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : []
                }
              } else {
                columns[table] = data || []
              }
            } catch (colError: any) {
              errors.push(`Error fetching columns for ${table}: ${colError.message}`)
              columns[table] = []
            }
          } else {
            columns[table] = []
          }
        } catch (error: any) {
          errors.push(`Error checking table ${table}: ${error.message}`)
          tables[table] = false
          columns[table] = []
        }
      }

      setResults({ tables, columns, errors })
    } catch (error: any) {
      setResults({
        tables: {},
        columns: {},
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
