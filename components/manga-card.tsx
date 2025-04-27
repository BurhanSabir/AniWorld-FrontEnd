"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bookmark, BookmarkCheck, Star, Heart } from "lucide-react"
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from "@/lib/api/watchlist"
import { getUserMangaRating } from "@/lib/api/ratings"
import { StarRating } from "@/components/star-rating"
import type { Manga } from "@/types/anime"

interface MangaCardProps {
  manga: Manga
  showAddToWatchlist?: boolean
  inWatchlist?: boolean
  onWatchlistUpdated?: (mangaId: number, inWatchlist: boolean) => void
}

export function MangaCard({
  manga,
  showAddToWatchlist = false,
  inWatchlist = false,
  onWatchlistUpdated,
}: MangaCardProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(inWatchlist)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingWatchlist, setIsCheckingWatchlist] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const { token, isAuthenticated } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Fetch user's rating for this manga if authenticated
    const fetchUserRating = async () => {
      if (isAuthenticated && token) {
        try {
          const rating = await getUserMangaRating(manga.id, token)
          setUserRating(rating)
        } catch (error) {
          console.error("Failed to fetch user rating:", error)
        }
      }
    }

    // Check if manga is in watchlist
    const checkWatchlist = async () => {
      if (isAuthenticated && token) {
        try {
          setIsCheckingWatchlist(true)
          const inWatchlist = await checkInWatchlist(manga.id, token)
          setIsInWatchlist(inWatchlist)
        } catch (error) {
          console.error("Failed to check watchlist status:", error)
        } finally {
          setIsCheckingWatchlist(false)
        }
      }
    }

    fetchUserRating()
    checkWatchlist()
  }, [manga.id, isAuthenticated, token])

  const handleWatchlistToggle = async (e?: React.MouseEvent) => {
    // If called from the heart icon, prevent navigation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!token) {
      toast({
        title: "Login Required",
        description: "Please log in to add to your watchlist",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(manga.id, token)
        setIsInWatchlist(false)
        toast({
          description: "Removed from your watchlist",
        })
      } else {
        await addToWatchlist(manga.id, token)
        setIsInWatchlist(true)
        toast({
          description: "Added to your watchlist",
        })
      }

      if (onWatchlistUpdated) {
        onWatchlistUpdated(manga.id, !isInWatchlist)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Link href={`/manga/${manga.id}`}>
        <Card className="overflow-hidden transition-all hover:shadow-md hover:shadow-primary/5 cursor-pointer border-border/60">
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <Image
              src={manga.coverImage || "/placeholder.svg?height=300&width=200"}
              alt={manga.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            {manga.score && (
              <div className="absolute right-2 top-2 flex items-center rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                {manga.score}
              </div>
            )}

            {/* Quick add to watchlist button */}
            {isAuthenticated && (
              <button
                onClick={handleWatchlistToggle}
                disabled={isLoading || isCheckingWatchlist}
                className="absolute left-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition-all hover:bg-black/90 disabled:opacity-50"
                aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isInWatchlist ? (
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="line-clamp-1 font-bold">{manga.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {manga.genres?.slice(0, 2).map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
              {manga.status && (
                <Badge variant="outline" className="text-xs">
                  {manga.status}
                </Badge>
              )}
            </div>

            {/* Show user rating if available */}
            {userRating && (
              <div className="mt-2 flex items-center">
                <p className="text-xs text-muted-foreground mr-1">Your rating:</p>
                <StarRating initialRating={userRating} readOnly size="sm" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      {showAddToWatchlist && (
        <CardFooter className="p-4 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleWatchlistToggle()}
            disabled={isLoading}
          >
            {isInWatchlist ? (
              <>
                <BookmarkCheck className="mr-2 h-4 w-4" />
                In Watchlist
              </>
            ) : (
              <>
                <Bookmark className="mr-2 h-4 w-4" />
                Add to Watchlist
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </div>
  )
}
