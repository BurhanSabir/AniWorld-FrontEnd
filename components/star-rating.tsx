"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { getUserAnimeRating, getUserMangaRating, rateAnime, rateManga } from "@/lib/api/ratings"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

interface StarRatingProps {
  mediaId: number
  mediaType: "anime" | "manga"
  size?: "sm" | "md" | "lg"
  showRating?: boolean
  className?: string
}

export function StarRating({ mediaId, mediaType, size = "md", showRating = true, className = "" }: StarRatingProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user, token } = useAuth()

  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  useEffect(() => {
    const fetchRating = async () => {
      if (!user) return

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
  }, [mediaId, mediaType, user])

  const handleRating = async (newRating: number) => {
    if (!user) {
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
      if (mediaType === "anime") {
        await rateAnime(mediaId, newRating)
      } else {
        await rateManga(mediaId, newRating)
      }

      setRating(newRating)
      toast({
        title: "Rating submitted",
        description: `You rated this ${mediaType} ${newRating} stars`,
      })
    } catch (err) {
      console.error("Error submitting rating:", err)
      setError("Failed to submit rating")
      toast({
        title: "Rating failed",
        description: "There was an error submitting your rating",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isLoading}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className={`focus:outline-none transition-colors duration-200 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`${sizeClass[size]} ${
                star <= (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>

      {showRating && rating > 0 && <span className="text-sm mt-1 text-gray-600">Your rating: {rating}/5</span>}

      {error && <span className="text-xs mt-1 text-red-500">{error}</span>}
    </div>
  )
}
