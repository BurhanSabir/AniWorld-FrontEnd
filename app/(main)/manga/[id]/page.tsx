"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bookmark, BookmarkCheck, Calendar, Book, Star, ArrowLeft, Share2 } from "lucide-react"
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from "@/lib/api/watchlist"
import { getUserMangaRating, rateManga } from "@/lib/api/ratings"
import { StarRating } from "@/components/star-rating"
import { RatingModal } from "@/components/rating-modal"
import { SocialShareDialog } from "@/components/social-share-dialog"
import type { MangaDetails } from "@/types/anime"

export default function MangaDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [manga, setManga] = useState<MangaDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated, token } = useAuth()

  useEffect(() => {
    const loadMangaDetails = async () => {
      try {
        setIsLoading(true)
        const mangaId = Array.isArray(id) ? id[0] : id

        // For now, we'll use mock data since we don't have a fetchMangaDetails function yet
        // In a real app, you would call an API to get the manga details
        setTimeout(async () => {
          setManga({
            id: Number(mangaId),
            title: "Sample Manga",
            coverImage: "/placeholder.svg?height=450&width=300",
            titleJapanese: "サンプル漫画",
            description: "<p>This is a sample manga description. In a real app, this would be fetched from an API.</p>",
            genres: ["Action", "Adventure", "Fantasy"],
            score: "8.5",
            status: "RELEASING",
            chapters: 120,
            volumes: 15,
            year: 2020,
            format: "MANGA",
          })

          // Check if manga is in watchlist and get user rating
          if (isAuthenticated && token) {
            const [inWatchlist, rating] = await Promise.all([
              checkInWatchlist(Number.parseInt(mangaId), token),
              getUserMangaRating(Number.parseInt(mangaId), token),
            ])
            setIsInWatchlist(inWatchlist)
            setUserRating(rating)
          }

          setIsLoading(false)
        }, 1000)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load manga details",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadMangaDetails()
  }, [id, isAuthenticated, token, toast])

  const handleWatchlistToggle = async () => {
    if (!token || !manga) return

    setIsWatchlistLoading(true)
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(manga.id, token, "manga")
        setIsInWatchlist(false)
        toast({
          description: "Removed from your watchlist",
        })
      } else {
        await addToWatchlist(manga.id, token, "manga")
        setIsInWatchlist(true)
        toast({
          description: "Added to your watchlist",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      })
    } finally {
      setIsWatchlistLoading(false)
    }
  }

  const handleRateClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to rate this manga",
        variant: "destructive",
      })
      return
    }
    setIsRatingModalOpen(true)
  }

  const handleRatingSubmit = async (rating: number) => {
    if (!token || !manga) return

    const response = await rateManga(manga.id, rating, token)
    if (response.success) {
      setUserRating(rating)
      // Optionally update the manga's average score if the API returns it
      if (response.averageRating) {
        setManga((prev) => (prev ? { ...prev, score: response.averageRating } : null))
      }
    } else {
      throw new Error("Failed to submit rating")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
          <Skeleton className="h-[450px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!manga) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold">Manga not found</h1>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  // Create the share URL for the current manga
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/manga/${manga.id}` : `/manga/${manga.id}`
  const shareTitle = manga.title
  const shareDescription = manga.description
    ? manga.description.replace(/<[^>]*>?/gm, "").substring(0, 150) + "..."
    : ""

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        {/* Manga Cover Image */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={manga.coverImage || "/placeholder.svg?height=450&width=300"}
                alt={manga.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                priority
              />
            </div>
          </Card>

          <div className="space-y-2">
            {isAuthenticated && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
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
            )}

            <Button variant="outline" className="w-full" onClick={handleRateClick}>
              <Star className="mr-2 h-4 w-4" />
              {userRating ? "Edit Rating" : "Rate This"}
            </Button>

            <SocialShareDialog
              title={shareTitle}
              url={shareUrl}
              description={shareDescription}
              image={manga.coverImage}
            >
              <Button variant="outline" className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </SocialShareDialog>
          </div>

          {/* User's Rating */}
          {userRating && (
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium mb-1">Your Rating</p>
              <div className="flex items-center">
                <StarRating initialRating={userRating} readOnly size="sm" />
                <span className="ml-2 text-sm">{userRating}/5</span>
              </div>
            </div>
          )}
        </div>

        {/* Manga Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{manga.title}</h1>
            {manga.titleJapanese && <p className="text-muted-foreground">{manga.titleJapanese}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {manga.genres?.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {manga.score && (
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{manga.score}</span>
              </div>
            )}
            {manga.chapters && (
              <div className="flex items-center">
                <Book className="mr-1 h-4 w-4" />
                <span>{manga.chapters} chapters</span>
              </div>
            )}
            {manga.year && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{manga.year}</span>
              </div>
            )}
            {manga.status && <Badge variant="outline">{manga.status.replace(/_/g, " ")}</Badge>}
          </div>

          {manga.description && (
            <Card>
              <CardContent className="pt-6">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: manga.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {manga.volumes && (
              <div>
                <h3 className="font-semibold">Volumes</h3>
                <p>{manga.volumes}</p>
              </div>
            )}
            {manga.format && (
              <div>
                <h3 className="font-semibold">Format</h3>
                <p>{manga.format.replace(/_/g, " ")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        title={manga.title}
        initialRating={userRating || 0}
      />
    </div>
  )
}
