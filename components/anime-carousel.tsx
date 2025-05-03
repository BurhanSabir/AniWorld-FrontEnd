"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimeCard } from "@/components/anime-card"
import { cn } from "@/lib/utils"
import type { Anime } from "@/types/anime"

interface AnimeCarouselProps {
  title: string
  animes: Anime[]
  className?: string
}

export function AnimeCarousel({ title, animes, className }: AnimeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePrev = () => {
    if (containerRef.current) {
      const container = containerRef.current
      const cardWidth = container.querySelector("div")?.offsetWidth || 0
      const scrollAmount = cardWidth + 16 // card width + gap
      container.scrollBy({ left: -scrollAmount * 3, behavior: "smooth" })
    }
  }

  const handleNext = () => {
    if (containerRef.current) {
      const container = containerRef.current
      const cardWidth = container.querySelector("div")?.offsetWidth || 0
      const scrollAmount = cardWidth + 16 // card width + gap
      container.scrollBy({ left: scrollAmount * 3, behavior: "smooth" })
    }
  }

  // Update currentIndex based on scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (container) {
        const scrollLeft = container.scrollLeft
        const cardWidth = container.querySelector("div")?.offsetWidth || 0
        const newIndex = Math.round(scrollLeft / (cardWidth + 16))
        setCurrentIndex(newIndex)
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x snap-mandatory">
        {animes.map((anime, index) => (
          <div key={anime.id} className="flex-shrink-0 w-full sm:w-[300px] md:w-[280px] snap-start">
            <AnimeCard anime={anime} index={index + 1} />
          </div>
        ))}
      </div>

      {/* Navigation buttons (visible on hover) */}
      <button
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 transition-opacity",
          isHovering ? "opacity-100" : "opacity-0 md:opacity-0",
          "hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 z-10",
        )}
        onClick={handlePrev}
        aria-label="Previous"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 transition-opacity",
          isHovering ? "opacity-100" : "opacity-0 md:opacity-0",
          "hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 z-10",
        )}
        onClick={handleNext}
        aria-label="Next"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  )
}
