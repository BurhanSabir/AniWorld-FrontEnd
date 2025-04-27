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
import { Bookmark, BookmarkCheck, Calendar, Clock, Star, ArrowLeft, Users } from "lucide-react"
import { fetchAnimeDetails, fetchAnimeCharacters, type Character } from "@/lib/api/anilist"
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from "@/lib/api/watchlist"
import { getUserAnimeRating, rateAnime } from "@/lib/api/ratings"
import { StarRating } from "@/components/star-rating"
import { RatingModal } from "@/components/rating-modal"
import { CharacterCard } from "@/components/character-card"
import { CharacterDetailDialog } from "@/components/character-detail-dialog"
import type { AnimeDetails } from "@/types/anime"

export default function AnimeDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [anime, setAnime] = useState<AnimeDetails | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true)
  const [characterLoadError, setCharacterLoadError] = useState(false)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated, token } = useAuth()

  useEffect(() => {
    const loadAnimeDetails = async () => {
      try {
        setIsLoading(true)
        const animeId = Array.isArray(id) ? id[0] : id
        const data = await fetchAnimeDetails(Number.parseInt(animeId))
        setAnime(data)

        // Check if anime is in watchlist and get user rating
        if (isAuthenticated && token) {
          const [inWatchlist, rating] = await Promise.all([
            checkInWatchlist(Number.parseInt(animeId), token),
            getUserAnimeRating(Number.parseInt(animeId), token),
          ])
          setIsInWatchlist(inWatchlist)
          setUserRating(rating)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load anime details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const loadAnimeCharacters = async () => {
      try {
        setIsLoadingCharacters(true)
        setCharacterLoadError(false)
        const animeId = Array.isArray(id) ? id[0] : id
        const data = await fetchAnimeCharacters(Number.parseInt(animeId))
        setCharacters(data)
      } catch (error) {
        console.error("Failed to load characters:", error)
        setCharacterLoadError(true)
      } finally {
        setIsLoadingCharacters(false)
      }
    }

    loadAnimeDetails()
    loadAnimeCharacters()
  }, [id, isAuthenticated, token, toast])

  const handleWatchlistToggle = async () => {
    if (!token || !anime) return

    setIsWatchlistLoading(true)
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(anime.id, token, "anime")
        setIsInWatchlist(false)
        toast({
          description: "Removed from your watchlist",
        })
      } else {
        await addToWatchlist(anime.id, token, "anime")
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
        description: "Please log in to rate this anime",
        variant: "destructive",
      })
      return
    }
    setIsRatingModalOpen(true)
  }

  const handleRatingSubmit = async (rating: number) => {
    if (!token || !anime) return

    const response = await rateAnime(anime.id, rating, token)
    if (response.success) {
      setUserRating(rating)
      // Optionally update the anime's average score if the API returns it
      if (response.averageRating) {
        setAnime((prev) => (prev ? { ...prev, score: response.averageRating } : null))
      }
    } else {
      throw new Error("Failed to submit rating")
    }
  }

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character)
    setIsCharacterDialogOpen(true)
  }

  const handleRetryCharacters = () => {
    const animeId = Array.isArray(id) ? id[0] : id
    setIsLoadingCharacters(true)
    fetchAnimeCharacters(Number.parseInt(animeId))
      .then((data) => {
        setCharacters(data)
        setCharacterLoadError(false)
      })
      .catch((error) => {
        console.error("Failed to load characters:", error)
        setCharacterLoadError(true)
      })
      .finally(() => {
        setIsLoadingCharacters(false)
      })
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

  if (!anime) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold">Anime not found</h1>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        {/* Anime Cover Image */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={anime.coverImage || "/placeholder.svg?height=450&width=300"}
                alt={anime.title}
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

        {/* Anime Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{anime.title}</h1>
            {anime.titleJapanese && <p className="text-muted-foreground">{anime.titleJapanese}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {anime.genres?.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {anime.score && (
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{anime.score}</span>
              </div>
            )}
            {anime.episodes && (
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{anime.episodes} episodes</span>
              </div>
            )}
            {anime.year && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{anime.year}</span>
              </div>
            )}
            {anime.status && <Badge variant="outline">{anime.status.replace(/_/g, " ")}</Badge>}
          </div>

          {anime.description && (
            <Card>
              <CardContent className="pt-6">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: anime.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {anime.studios && anime.studios.length > 0 && (
              <div>
                <h3 className="font-semibold">Studios</h3>
                <p>{anime.studios.join(", ")}</p>
              </div>
            )}
            {anime.season && (
              <div>
                <h3 className="font-semibold">Season</h3>
                <p>{`${anime.season.charAt(0).toUpperCase() + anime.season.slice(1).toLowerCase()} ${anime.year}`}</p>
              </div>
            )}
            {anime.format && (
              <div>
                <h3 className="font-semibold">Format</h3>
                <p>{anime.format.replace(/_/g, " ")}</p>
              </div>
            )}
            {anime.duration && (
              <div>
                <h3 className="font-semibold">Episode Duration</h3>
                <p>{anime.duration} minutes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Characters Section */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            <h2 className="text-2xl font-bold">Characters</h2>
          </div>

          {characterLoadError && (
            <Button variant="outline" size="sm" onClick={handleRetryCharacters} disabled={isLoadingCharacters}>
              Retry Loading Characters
            </Button>
          )}
        </div>

        {isLoadingCharacters ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : characterLoadError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
            <p className="text-muted-foreground">Failed to load character information</p>
          </div>
        ) : characters.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} onClick={() => handleCharacterClick(character)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
            <p className="text-muted-foreground">No character information available</p>
          </div>
        )}
      </div>

      {/* Character Detail Dialog */}
      <CharacterDetailDialog
        character={selectedCharacter}
        isOpen={isCharacterDialogOpen}
        onClose={() => setIsCharacterDialogOpen(false)}
      />

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        title={anime.title}
        initialRating={userRating || 0}
      />
    </div>
  )
}
