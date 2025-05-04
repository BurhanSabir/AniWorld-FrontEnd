"use client"

import { useState, useEffect } from "react"
import { Star, Loader2 } from "lucide-react"
import { getUserAnimeRating, getUserMangaRating, rateAnime, rateManga } from "@/lib/api/ratings"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  mediaId: number
  mediaType: "anime" | "manga"
  size?: "sm" | "md" | "lg"
  showRating?: boolean
  className?: string
  readOnly?: boolean
}

export function StarRating({
  mediaId,
  mediaType,
  size = "md",
  showRating = true,
  className = "",
  readOnly = false,
}: StarRatingProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  useEffect(() => {
    // Fetch user's rating for this media if authenticated
    const fetchRating = async () => {
      if (!isAuthenticated) return

      setIsLoading(true)
      setError(null)

      try {
        let userRating: number | null = null

        if (mediaType === "anime") {
          userRating = await getUserAnimeRating(mediaId)
        } else {
          userRating = await getUserMangaRating(mediaId)
        }

        if (userRating) {
          setRating(userRating)
        }
      } catch (err) {
        console.error("Error fetching user rating:", err)
        setError("Failed to load your rating")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRating()
  }, [mediaId, mediaType, isAuthenticated])

  const handleRating = async (newRating: number) => {
    if (readOnly) return

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to rate this content",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = mediaType === "anime" ? await rateAnime(mediaId, newRating) : await rateManga(mediaId, newRating)

      if (result.success) {
        setRating(newRating)
        toast({
          title: "Rating submitted",
          description: `You rated this ${mediaType} ${newRating} stars`,
        })
      } else {
        setError(result.message || "Failed to submit rating")
        toast({
          title: "Rating failed",
          description: result.message || "There was an error submitting your rating",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error submitting rating:", err)
      setError(err.message || "Failed to submit rating")
      toast({
        title: "Rating failed",
        description: err.message || "There was an error submitting your rating",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex space-x-1">
        {isLoading ? (
          <Loader2 className={cn(sizeClass[size], "animate-spin text-muted-foreground")} />
        ) : (
          Array.from({ length: 5 }).map((_, star) => (
            <button
              key={star}
              type="button"
              disabled={isLoading || readOnly}
              onClick={() => handleRating(star + 1)}
              onMouseEnter={() => !readOnly && setHoveredRating(star + 1)}
              onMouseLeave={() => !readOnly && setHoveredRating(0)}
              className={cn(
                "focus:outline-none transition-colors duration-200",
                isLoading || readOnly ? "cursor-default" : "cursor-pointer",
              )}
              aria-label={`Rate ${star + 1} stars`}
            >
              <Star
                className={cn(
                  sizeClass[size],
                  star + 1 <= (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                  readOnly && "cursor-default",
                )}
              />
            </button>
          ))
        )}
      </div>

      {showRating && rating > 0 && <span className="text-sm mt-1 text-gray-600">Your rating: {rating}/5</span>}

      {error && <span className="text-xs mt-1 text-red-500">{error}</span>}
    </div>
  )
}
