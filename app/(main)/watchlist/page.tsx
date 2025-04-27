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

export default function WatchlistPage() {
  const [animeWatchlist, setAnimeWatchlist] = useState<Anime[]>([])
  const [mangaWatchlist, setMangaWatchlist] = useState<Manga[]>([])
  const [isLoadingAnime, setIsLoadingAnime] = useState(true)
  const [isLoadingManga, setIsLoadingManga] = useState(true)
  const [activeTab, setActiveTab] = useState<"anime" | "manga">("anime")
  const { toast } = useToast()
  const { isAuthenticated, token } = useAuth()

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
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <h1 className="text-3xl font-bold">Your Watchlist</h1>
        <p className="text-muted-foreground">Please log in to view your watchlist</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Watchlist</h1>

      <Tabs defaultValue="anime" onValueChange={(value) => setActiveTab(value as "anime" | "manga")}>
        <TabsList className="mb-6">
          <TabsTrigger value="anime">Anime</TabsTrigger>
          <TabsTrigger value="manga">Manga</TabsTrigger>
        </TabsList>

        <TabsContent value="anime">
          {isLoadingAnime ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-lg" />
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
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed py-12">
              <p className="text-muted-foreground">Your anime watchlist is empty</p>
              <Button asChild>
                <Link href="/anime">Discover Anime</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manga">
          {isLoadingManga ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-lg" />
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
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed py-12">
              <p className="text-muted-foreground">Your manga watchlist is empty</p>
              <Button asChild>
                <Link href="/manga">Discover Manga</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
