"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { AnimeCard } from "@/components/anime-card"
import { MangaCard } from "@/components/manga-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchWatchlist } from "@/lib/api/watchlist"
import type { Anime, Manga } from "@/types/anime"
import Link from "next/link"
import { Film, BookOpen, Bookmark } from "lucide-react"

export default function WatchlistPage() {
  const [animeWatchlist, setAnimeWatchlist] = useState<Anime[]>([])
  const [mangaWatchlist, setMangaWatchlist] = useState<Manga[]>([])
  const [isLoadingAnime, setIsLoadingAnime] = useState(true)
  const [isLoadingManga, setIsLoadingManga] = useState(true)
  const [activeTab, setActiveTab] = useState<"anime" | "manga">("anime")
  const { toast } = useToast()
  const { isAuthenticated, token, user } = useAuth()

  useEffect(() => {
    const loadWatchlist = async () => {
      if (!isAuthenticated || !token) return

      try {
        // Load anime watchlist
        setIsLoadingAnime(true)
        const animeData = (await fetchWatchlist(token, "anime")) as Anime[]
        setAnimeWatchlist(animeData)
        setIsLoadingAnime(false)

        // Load manga watchlist
        setIsLoadingManga(true)
        const mangaData = (await fetchWatchlist(token, "manga")) as Manga[]
        setMangaWatchlist(mangaData)
        setIsLoadingManga(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your watchlist",
          variant: "destructive",
        })
        setIsLoadingAnime(false)
        setIsLoadingManga(false)
      }
    }

    loadWatchlist()
  }, [isAuthenticated, token, toast])

  const handleAnimeWatchlistUpdated = (animeId: number, inWatchlist: boolean) => {
    if (!inWatchlist) {
      setAnimeWatchlist((prev) => prev.filter((a) => a.id !== animeId))
    }
  }

  const handleMangaWatchlistUpdated = (mangaId: number, inWatchlist: boolean) => {
    if (!inWatchlist) {
      setMangaWatchlist((prev) => prev.filter((m) => m.id !== mangaId))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-16">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Bookmark className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-center">Your Watchlist</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Track your favorite anime and manga in one place. Please log in to view and manage your watchlist.
        </p>
        <Button asChild size="lg" className="mt-4 bg-gradient hover:opacity-90">
          <Link href="/login">Login to Continue</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="hero-section py-8 px-4 -mx-4 md:-mx-8 lg:-mx-10 mb-8 rounded-b-3xl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Your Collection</h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, {user?.name}! Here's your personalized anime and manga collection.
          </p>
        </div>
      </div>

      <Tabs defaultValue="anime" onValueChange={(value) => setActiveTab(value as "anime" | "manga")} className="w-full">
        <TabsList className="bg-card/50 border border-border/50 p-1 mb-8">
          <TabsTrigger value="anime" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Film className="h-4 w-4 mr-2" />
            Anime ({animeWatchlist.length})
          </TabsTrigger>
          <TabsTrigger value="manga" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BookOpen className="h-4 w-4 mr-2" />
            Manga ({mangaWatchlist.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anime" className="animate-fade-in">
          {isLoadingAnime ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <Skeleton className="h-[300px] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : animeWatchlist.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {animeWatchlist.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  inWatchlist={true}
                  onWatchlistUpdated={handleAnimeWatchlistUpdated}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/50 py-16 bg-card/30">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Film className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Your anime collection is empty</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Start building your collection by adding anime titles you love or want to watch.
              </p>
              <Button asChild className="bg-gradient hover:opacity-90">
                <Link href="/anime">Discover Anime</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manga" className="animate-fade-in">
          {isLoadingManga ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <Skeleton className="h-[300px] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : mangaWatchlist.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {mangaWatchlist.map((manga) => (
                <MangaCard
                  key={manga.id}
                  manga={manga}
                  inWatchlist={true}
                  onWatchlistUpdated={handleMangaWatchlistUpdated}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/50 py-16 bg-card/30">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Your manga collection is empty</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Start building your collection by adding manga titles you love or want to read.
              </p>
              <Button asChild className="bg-gradient hover:opacity-90">
                <Link href="/manga">Discover Manga</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
