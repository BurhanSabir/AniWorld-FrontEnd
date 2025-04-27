"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  initialRating?: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  readOnly?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  initialRating = 0,
  maxRating = 5,
  size = "md",
  readOnly = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)

  const handleClick = (selectedRating: number) => {
    if (readOnly) return

    // If clicking the same star twice, remove the rating
    const newRating = rating === selectedRating ? 0 : selectedRating
    setRating(newRating)
    onRatingChange?.(newRating)
  }

  const starSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const starSize = starSizes[size]

  return (
    <div className={cn("flex items-center", className)} onMouseLeave={() => !readOnly && setHoverRating(0)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1
        const isFilled = hoverRating ? starValue <= hoverRating : starValue <= rating

        return (
          <Star
            key={index}
            className={cn(
              starSize,
              "cursor-pointer transition-all",
              isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
              readOnly && "cursor-default",
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
          />
        )
      })}
    </div>
  )
}
