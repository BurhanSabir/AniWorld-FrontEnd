"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, Clock } from "lucide-react"
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from "@/lib/api/watchlist"
import { getUserAnimeRating } from "@/lib/api/ratings"
import { SocialShareButton } from "@/components/social-share-button"
import type { Anime } from "@/types/anime"
import { cn } from "@/lib/utils"

interface AnimeCardProps {
  anime: Anime
  showAddToWatchlist?: boolean
  inWatchlist?: boolean
  onWatchlistUpdated?: (animeId: number, inWatchlist: boolean) => void
  featured?: boolean
  index?: number
}

export function AnimeCard({
  anime,
  showAddToWatchlist = false,
  inWatchlist = false,
  onWatchlistUpdated,
  featured = false,
  index,
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
      <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
        <Image
          src={anime.coverImage || "/placeholder.svg?height=500&width=1200&query=anime"}
          alt={anime.title}
          fill
          className={cn("object-cover transition-all duration-700 group-hover:scale-105", !imageLoaded && "blur-sm")}
          sizes="(max-width: 768px) 100vw, 1200px"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10">
          <div className="animate-slide-in">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 text-white">{anime.title}</h1>

            <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-3 max-w-2xl">
              {anime.description || "No description available."}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {anime.genres?.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="secondary" className="bg-black/30 text-white border border-white/20">
                  {genre}
                </Badge>
              ))}
              {anime.status && (
                <Badge variant="outline" className="border-white/30 text-white">
                  {anime.status.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                asChild
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Link href={`/anime/${anime.id}`}>Details</Link>
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

  // Regular card design
  return (
    <div className="group relative">
      <Link href={`/anime/${anime.id}`} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
          {/* Index number */}
          {index !== undefined && (
            <div className="absolute left-0 top-0 z-20 w-8 h-8 flex items-center justify-center text-sm font-bold bg-amber-500 text-white">
              {String(index + 1).padStart(2, "0")}
            </div>
          )}

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
            src={anime.coverImage || "/placeholder.svg?height=600&width=400&query=anime"}
            alt={anime.title}
            fill
            className={cn("object-cover transition-all duration-500", imageLoaded ? "opacity-100" : "opacity-0")}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 z-10"></div>

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 z-20">
            {anime.format && (
              <Badge className="bg-amber-500/90 text-white text-xs font-bold border-none">
                {anime.format === "TV" ? "TV" : anime.format}
              </Badge>
            )}

            {anime.episodes && (
              <Badge className="bg-emerald-600/90 text-white text-xs font-bold border-none">{anime.episodes} EP</Badge>
            )}

            {anime.score && (
              <Badge className="bg-purple-600/90 text-white text-xs font-bold border-none flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {anime.score}
              </Badge>
            )}
          </div>

          {/* Title and info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
            <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2">{anime.title}</h3>

            <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
              {anime.year && <span>{anime.year}</span>}
              {anime.status && <span>{anime.status.replace(/_/g, " ")}</span>}
              {anime.duration && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {anime.duration} min
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="absolute right-2 top-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      </Link>
    </div>
  )
}
