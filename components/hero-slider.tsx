"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { addToWatchlist } from "@/lib/api/watchlist"
import type { Anime } from "@/types/anime"

interface HeroSliderProps {
  animeList: Anime[]
  className?: string
}

export function HeroSlider({ animeList, className }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const handlePrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev === 0 ? animeList.length - 1 : prev - 1))
  }

  const handleNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev === animeList.length - 1 ? 0 : prev + 1))
  }

  // Reset animation state after transition completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [currentIndex])

  // Auto-advance the slider
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        handleNext()
      }
    }, 6000)
    return () => clearInterval(interval)
  }, [isAnimating])

  const handleAddToWatchlist = async (animeId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to add anime to your watchlist",
        variant: "destructive",
      })
      return
    }

    try {
      await addToWatchlist(animeId)
      toast({
        title: "Added to watchlist",
        description: "Anime has been added to your watchlist",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add anime to watchlist",
        variant: "destructive",
      })
    }
  }

  if (!animeList.length) return null

  const currentAnime = animeList[currentIndex]

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Background with blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-105 transform transition-transform duration-700"
          style={{ backgroundImage: `url(${currentAnime.coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Slider content */}
      <div className="relative px-4 py-8 md:px-12 md:py-16 min-h-[500px]">
        <div className="flex flex-col md:flex-row items-center gap-8 max-w-7xl mx-auto transition-opacity duration-500">
          {/* Anime image */}
          <div className="w-full md:w-1/3 shrink-0">
            <div
              className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-2xl transform transition-all duration-500"
              style={{ animationDelay: "0.2s" }}
            >
              <img
                src={currentAnime.coverImage || "/placeholder.svg"}
                alt={currentAnime.title}
                className="w-full h-full object-cover animate-fade-in"
                style={{ animationDuration: "1s" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                {currentAnime.genres?.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="outline" className="bg-black/50 text-white border-none backdrop-blur-md">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Anime details */}
          <div className="w-full md:w-2/3 space-y-4 md:space-y-6 animate-slide-in">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-2">{currentAnime.title}</h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm px-2 py-1 bg-primary/20 text-primary rounded-md">
                  {currentAnime.format || "TV"}
                </span>
                <span className="text-sm text-muted-foreground">{currentAnime.status}</span>
                {currentAnime.meanScore && (
                  <span className="flex items-center text-yellow-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {currentAnime.meanScore / 10}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground line-clamp-3 md:line-clamp-4 lg:line-clamp-5">
              {currentAnime.description?.replace(/<[^>]*>?/gm, "") || "No description available."}
            </p>

            <div className="flex items-center gap-4 pt-2">
              <Button asChild className="bg-gradient hover:opacity-90" size="lg">
                <Link href={`/anime/${currentAnime.id}`}>Watch Now</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={(e) => handleAddToWatchlist(currentAnime.id, e)}
                className="border-primary/30 hover:bg-primary/10"
              >
                Add to Watchlist
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-all"
        onClick={handlePrev}
        disabled={isAnimating}
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">Previous slide</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/70 transition-all"
        onClick={handleNext}
        disabled={isAnimating}
      >
        <ChevronRight className="h-6 w-6" />
        <span className="sr-only">Next slide</span>
      </Button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2">
        {animeList.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              currentIndex === index ? "w-8 bg-primary" : "w-2 bg-white/30",
            )}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true)
                setCurrentIndex(index)
              }
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
