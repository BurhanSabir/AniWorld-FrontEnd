"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContent, Card } from "@/components/ui/card"
import { Star, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { fetchUserRatings, deleteRating } from "@/lib/api/ratings"
import type { AnimeRating } from "@/types/anime"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function RatedPage() {
  const { isAuthenticated, user } = useAuth()
  const [ratings, setRatings] = useState<AnimeRating[]>([])
  const [filteredRatings, setFilteredRatings] = useState<AnimeRating[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [ratingToDelete, setRatingToDelete] = useState<AnimeRating | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadRatings = async () => {
      if (!isAuthenticated) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const userRatings = await fetchUserRatings()
        setRatings(userRatings)
        setFilteredRatings(userRatings)
      } catch (error) {
        console.error("Failed to load ratings", error)
        toast({
          title: "Error",
          description: "Failed to load your ratings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadRatings()
  }, [isAuthenticated, toast])

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredRatings(ratings)
    } else {
      setFilteredRatings(ratings.filter((rating) => rating.type === activeTab))
    }
  }, [activeTab, ratings])

  const handleDeleteRating = async () => {
    if (!ratingToDelete) return

    try {
      await deleteRating(ratingToDelete.id)
      setRatings(ratings.filter((r) => r.id !== ratingToDelete.id))
      toast({
        description: `Rating for "${ratingToDelete.title}" has been removed`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rating",
        variant: "destructive",
      })
    } finally {
      setRatingToDelete(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="py-16">
        <CardContent className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Star className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Login to see your ratings</h2>
            <p className="text-muted-foreground">
              Track your anime and manga ratings by creating an account or logging in.
            </p>
          </div>
          <Button asChild className="bg-gradient hover:opacity-90">
            <Link href="/login">Login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const renderRatingsList = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex">
                <Skeleton className="h-[120px] w-[80px] rounded-none" />
                <div className="p-4 flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    if (filteredRatings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/50 py-16 bg-card/30">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">No ratings yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {activeTab === "all"
              ? "Start rating anime and manga to see them here"
              : `Start rating ${activeTab} to see them here`}
          </p>
          <Button asChild className="bg-gradient hover:opacity-90">
            <Link href={activeTab === "manga" ? "/manga" : "/anime"}>
              Discover {activeTab === "all" ? "Anime & Manga" : activeTab === "anime" ? "Anime" : "Manga"}
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRatings.map((rating) => (
          <Card key={rating.id} className="overflow-hidden hover:border-primary/50 transition-colors group">
            <div className="flex relative">
              <Link href={`/${rating.type}/${rating.mediaId}`} className="flex flex-1">
                <div className="h-[120px] w-[80px] bg-muted">
                  {rating.coverImage ? (
                    <img
                      src={rating.coverImage || "/placeholder.svg"}
                      alt={rating.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-semibold line-clamp-1">{rating.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {rating.type.charAt(0).toUpperCase() + rating.type.slice(1)}
                  </p>
                  <div className="flex items-center mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rating.rating / 2 ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium">{rating.rating / 2}</span>
                  </div>
                </div>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setRatingToDelete(rating)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete rating?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete your rating for "{rating.title}"?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRatingToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRating}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="hero-section py-8 px-4 -mx-4 md:-mx-8 lg:-mx-10 mb-8 rounded-b-3xl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Your Ratings</h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, {user?.name}! Here are your anime and manga ratings.
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-card/50 border border-border/50 p-1 mb-8">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            All ({ratings.length})
          </TabsTrigger>
          <TabsTrigger value="anime" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Anime ({ratings.filter((r) => r.type === "anime").length})
          </TabsTrigger>
          <TabsTrigger value="manga" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Manga ({ratings.filter((r) => r.type === "manga").length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all" className="mt-0">
            {renderRatingsList()}
          </TabsContent>

          <TabsContent value="anime" className="mt-0">
            {renderRatingsList()}
          </TabsContent>

          <TabsContent value="manga" className="mt-0">
            {renderRatingsList()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
