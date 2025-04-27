"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { fetchWatchlist } from "@/lib/api/watchlist"
import { Badge } from "@/components/ui/badge"

export function WatchlistCount() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, token } = useAuth()

  useEffect(() => {
    const loadWatchlistCount = async () => {
      if (!isAuthenticated || !token) {
        setCount(0)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const [animeData, mangaData] = await Promise.all([
          fetchWatchlist(token, "anime"),
          fetchWatchlist(token, "manga"),
        ])
        setCount(animeData.length + mangaData.length)
      } catch (error) {
        console.error("Failed to load watchlist count:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWatchlistCount()
  }, [isAuthenticated, token])

  if (isLoading || count === 0) return null

  return (
    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
      {count}
    </Badge>
  )
}
