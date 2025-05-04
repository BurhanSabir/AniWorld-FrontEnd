"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DatabaseErrorFallbackProps {
  message?: string
  onRetry?: () => void
}

export function DatabaseErrorFallback({
  message = "We're having trouble connecting to our database",
  onRetry,
}: DatabaseErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
      <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Database Connection Issue</h3>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}
