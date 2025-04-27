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
import { Star, ArrowLeft, Users, Heart, Play } from "lucide-react"
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
  const [imageLoaded, setImageLoaded] = useState(false)
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
          <Skeleton className="h-[450px] w-full rounded-xl" />
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
        <Button onClick={() => router.back()} className="mt-4 bg-gradient hover:opacity-90">
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

      {/* Hero Banner */}
      <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
        <Image
          src={anime.coverImage || "/placeholder.svg?height=400&width=1200"}
          alt={anime.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          priority
        />

        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-10">
          <div className="flex flex-wrap gap-2 mb-3">
            {anime.genres?.slice(0, 5).map((genre) => (
              <Badge key={genre} variant="secondary" className="bg-primary/20 text-primary-foreground">
                {genre}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">{anime.title}</h1>

          {anime.titleJapanese && <p className="text-muted-foreground mb-4">{anime.titleJapanese}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        {/* Anime Cover Image and Actions */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/20">
            <div className="relative aspect-[2/3] w-full">
              <div
                className={`absolute inset-0 bg-muted/50 flex items-center justify-center transition-opacity ${
                  imageLoaded ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
              <Image
                src={anime.coverImage || "/placeholder.svg?height=450&width=300"}
                alt={anime.title}
                fill
                className={`object-cover transition-all duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                sizes="(max-width: 768px) 100vw, 300px"
                priority
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </Card>

          <div className="space-y-3">
            <Button className="w-full bg-gradient hover:opacity-90">
              <Play className="mr-2 h-4 w-4" />
              Watch Now
            </Button>

            {isAuthenticated && (
              <Button
                variant="outline"
                className={`w-full ${isInWatchlist ? "bg-primary/10 border-primary/50 text-primary" : ""}`}
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
              >
                {isInWatchlist ? (
                  <>
                    <Heart className="mr-2 h-4 w-4 fill-primary" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
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
            <div className="rounded-xl border border-primary/20 p-4 bg-primary/5">
              <p className="text-sm font-medium mb-2">Your Rating</p>
              <div className="flex items-center">
                <StarRating initialRating={userRating} readOnly size="md" />
                <span className="ml-2 text-lg font-semibold text-primary">{userRating}/5</span>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="space-y-3 rounded-xl border border-border/50 p-4 bg-card/50">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">Information</h3>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {anime.score && (
                <div>
                  <p className="text-muted-foreground">Score</p>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="font-medium">{anime.score}</span>
                  </div>
                </div>
              )}

              {anime.status && (
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{anime.status.replace(/_/g, " ")}</p>
                </div>
              )}

              {anime.episodes && (
                <div>
                  <p className="text-muted-foreground">Episodes</p>
                  <p className="font-medium">{anime.episodes}</p>
                </div>
              )}

              {anime.duration && (
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{anime.duration} min</p>
                </div>
              )}

              {anime.season && anime.year && (
                <div>
                  <p className="text-muted-foreground">Season</p>
                  <p className="font-medium">{`${anime.season.charAt(0).toUpperCase() + anime.season.slice(1).toLowerCase()} ${anime.year}`}</p>
                </div>
              )}

              {anime.format && (
                <div>
                  <p className="text-muted-foreground">Format</p>
                  <p className="font-medium">{anime.format.replace(/_/g, " ")}</p>
                </div>
              )}
            </div>

            {anime.studios && anime.studios.length > 0 && (
              <div className="pt-2">
                <p className="text-muted-foreground text-sm">Studios</p>
                <p className="font-medium text-sm">{anime.studios.join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Anime Details */}
        <div className="space-y-8">
          {/* Synopsis */}
          {anime.description && (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-4">Synopsis</h2>
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: anime.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Characters Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Characters
              </h2>

              {characterLoadError && (
                <Button variant="outline" size="sm" onClick={handleRetryCharacters} disabled={isLoadingCharacters}>
                  Retry Loading Characters
                </Button>
              )}
            </div>

            {isLoadingCharacters ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : characterLoadError ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 bg-card/30">
                <p className="text-muted-foreground">Failed to load character information</p>
              </div>
            ) : characters.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {characters.slice(0, 6).map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    onClick={() => handleCharacterClick(character)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 bg-card/30">
                <p className="text-muted-foreground">No character information available</p>
              </div>
            )}
          </div>
        </div>
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
