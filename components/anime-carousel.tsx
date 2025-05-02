"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Anime } from "@/types/anime"

interface AnimeCarouselProps {
  animeList: Anime[]
  title: string
  className?: string
}

export function AnimeCarousel({ animeList, title, className }: AnimeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // Calculate items per view based on screen size
  const itemsPerView = isMobile ? 2 : 4
  const totalSlides = Math.ceil(animeList.length / itemsPerView)

  const handlePrev = () => {
    if (isAnimating || currentIndex === 0) return
    setIsAnimating(true)
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    if (isAnimating || currentIndex >= totalSlides - 1) return
    setIsAnimating(true)
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1))
  }

  // Reset animation state after transition completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [currentIndex])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev()
      } else if (e.key === "ArrowRight") {
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, isAnimating])

  if (!animeList.length) return null

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isAnimating}
            className="h-9 w-9 rounded-full border border-border/50 bg-card/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex >= totalSlides - 1 || isAnimating}
            className="h-9 w-9 rounded-full border border-border/50 bg-card/50"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${totalSlides * 100}%`,
          }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div key={slideIndex} className="flex w-full" style={{ flexBasis: `${100 / totalSlides}%` }}>
              <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
                {animeList.slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView).map((anime) => (
                  <Link
                    key={anime.id}
                    href={`/anime/${anime.id}`}
                    className="group relative aspect-[2/3] overflow-hidden rounded-xl transition-transform hover:scale-105 duration-300"
                  >
                    <img
                      src={anime.coverImage || "/placeholder.svg"}
                      alt={anime.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      <h3 className="font-semibold text-white line-clamp-2 mb-2">{anime.title}</h3>
                      {anime.genres && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {anime.genres.slice(0, 2).map((genre) => (
                            <Badge
                              key={genre}
                              variant="outline"
                              className="bg-black/50 text-white border-none text-xs px-1.5"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-center">
                        <Button size="sm" className="w-full rounded-full bg-primary hover:bg-primary/90">
                          <Play className="h-4 w-4 mr-1.5" />
                          Watch
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Carousel indicators */}
        <div className="mt-4 flex justify-center space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 rounded-full transition-all",
                currentIndex === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
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
    </div>
  )
}
