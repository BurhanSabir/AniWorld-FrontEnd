"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, Info, Play } from "lucide-react"
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from "@/lib/api/watchlist"
import { getUserAnimeRating } from "@/lib/api/ratings"
import { StarRating } from "@/components/star-rating"
import { SocialShareButton } from "@/components/social-share-button"
import type { Anime } from "@/types/anime"
import { cn } from "@/lib/utils"

interface AnimeCardProps {
  anime: Anime
  showAddToWatchlist?: boolean
  inWatchlist?: boolean
  onWatchlistUpdated?: (animeId: number, inWatchlist: boolean) => void
  featured?: boolean
}

export function AnimeCard({
  anime,
  showAddToWatchlist = false,
  inWatchlist = false,
  onWatchlistUpdated,
  featured = false,
}: AnimeCardProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(inWatchlist)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingWatchlist, setIsCheckingWatchlist] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { token, isAuthenticated } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Fetch user's rating for this anime if authenticated
    const fetchUserRating = async () => {
      if (isAuthenticated && token) {
        try {
          const rating = await getUserAnimeRating(anime.id, token)
          setUserRating(rating)
        } catch (error) {
          console.error("Failed to fetch user rating:", error)
        }
      }
    }

    // Check if anime is in watchlist
    const checkWatchlist = async () => {
      if (isAuthenticated && token) {
        try {
          setIsCheckingWatchlist(true)
          const inWatchlist = await checkInWatchlist(anime.id, token)
          setIsInWatchlist(inWatchlist)
        } catch (error) {
          console.error("Failed to check watchlist status:", error)
        } finally {
          setIsCheckingWatchlist(false)
        }
      }
    }

    // Only run these checks if the user is authenticated and has a token
    if (isAuthenticated && token) {
      fetchUserRating()
      checkWatchlist()
    }
  }, [anime.id, isAuthenticated, token])

  const handleWatchlistToggle = async (e?: React.MouseEvent) => {
    // If called from the heart icon, prevent navigation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!isAuthenticated || !token) {
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
        await removeFromWatchlist(anime.id, token)
        setIsInWatchlist(false)
        toast({
          description: "Removed from your watchlist",
        })
      } else {
        await addToWatchlist(anime.id, token)
        setIsInWatchlist(true)
        toast({
          description: "Added to your watchlist",
        })
      }

      if (onWatchlistUpdated) {
        onWatchlistUpdated(anime.id, !isInWatchlist)
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

  // Create the share URL for this anime
  const shareUrl = `/anime/${anime.id}`
  const shareTitle = `Check out ${anime.title} on AniWorld`
  const shareDescription = anime.genres
    ? `A ${anime.genres.slice(0, 3).join(", ")} anime with a score of ${anime.score}`
    : ""

  if (featured) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
        <Image
          src={anime.coverImage || "/placeholder.svg?height=500&width=1200"}
          alt={anime.title}
          fill
          className={cn("object-cover transition-all duration-700 group-hover:scale-105", !imageLoaded && "blur-sm")}
          sizes="(max-width: 768px) 100vw, 1200px"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10">
          <div className="animate-slide-in">
            <div className="flex flex-wrap gap-2 mb-3">
              {anime.genres?.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="secondary" className="bg-primary/20 text-primary-foreground">
                  {genre}
                </Badge>
              ))}
              {anime.status && (
                <Badge variant="outline" className="border-primary/30 text-primary-foreground">
                  {anime.status.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            <h2 className="text-2xl md:text-4xl font-bold mb-2 text-white">{anime.title}</h2>

            <div className="flex items-center gap-3 mb-4">
              {anime.score && (
                <div className="flex items-center bg-black/50 px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">{anime.score}</span>
                </div>
              )}
              {anime.episodes && <div className="text-sm text-muted-foreground">{anime.episodes} episodes</div>}
              {anime.year && <div className="text-sm text-muted-foreground">{anime.year}</div>}
            </div>

            <div className="flex gap-3">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Link href={`/anime/${anime.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Link>
              </Button>

              {isAuthenticated && (
                <Button
                  variant="outline"
                  className={cn(
                    "border-white/20 hover:bg-white/10",
                    isInWatchlist && "bg-primary/20 border-primary/50 text-primary-foreground",
                  )}
                  onClick={handleWatchlistToggle}
                  disabled={isLoading || isCheckingWatchlist}
                >
                  <Heart className={cn("h-4 w-4 mr-2", isInWatchlist && "fill-primary text-primary")} />
                  {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </Button>
              )}

              <SocialShareButton
                title={shareTitle}
                url={shareUrl}
                description={shareDescription}
                className="border-white/20 hover:bg-white/10"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="anime-card group relative">
      <Link href={`/anime/${anime.id}`} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl">
          {/* Loading state */}
          <div
            className={cn(
              "absolute inset-0 bg-muted/50 flex items-center justify-center transition-opacity",
              imageLoaded ? "opacity-0" : "opacity-100",
            )}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>

          {/* Image */}
          <Image
            src={anime.coverImage || "/placeholder.svg?height=300&width=200"}
            alt={anime.title}
            fill
            className={cn("object-cover transition-all duration-500", imageLoaded ? "opacity-100" : "opacity-0")}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Score badge */}
          {anime.score && (
            <div className="absolute right-2 top-2 flex items-center rounded-full bg-black/70 px-2 py-1 text-xs text-white z-10">
              <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
              {anime.score}
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute left-2 top-2 flex gap-1 z-20">
            {/* Watchlist heart icon */}
            {isAuthenticated && (
              <button
                onClick={(e) => handleWatchlistToggle(e)}
                disabled={isLoading || isCheckingWatchlist}
                className={cn(
                  "rounded-full bg-black/70 p-1.5 text-white transition-all hover:bg-black/90 disabled:opacity-50",
                  isLoading && "animate-pulse",
                )}
                aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Heart className={cn("h-4 w-4 transition-colors", isInWatchlist && "fill-primary text-primary")} />
              </button>
            )}

            {/* Share button */}
            <SocialShareButton title={shareTitle} url={shareUrl} description={shareDescription} iconOnly />
          </div>

          {/* User rating indicator */}
          {userRating && (
            <div className="absolute bottom-2 left-2 flex items-center bg-black/70 rounded-full px-2 py-1 z-10">
              <StarRating initialRating={userRating} readOnly size="sm" />
            </div>
          )}

          {/* Dark overlay with title and info on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 z-10">
            <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 mb-1 pr-6">{anime.title}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {anime.genres?.slice(0, 2).map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs bg-black/50">
                  {genre}
                </Badge>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full mt-auto bg-white/20 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white text-white transition-all duration-300"
            >
              <Info className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </Link>
    </div>
  )
}
