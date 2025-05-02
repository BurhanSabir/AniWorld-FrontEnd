"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, User, Save, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchWatchlist } from "@/lib/api/watchlist"
import type { Anime, Manga } from "@/types/anime"
import { AnimeCard } from "@/components/anime-card"
import { MangaCard } from "@/components/manga-card"

export default function ProfilePage() {
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("profile")
  const [animeWatchlist, setAnimeWatchlist] = useState<Anime[]>([])
  const [mangaWatchlist, setMangaWatchlist] = useState<Manga[]>([])
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true)

  const router = useRouter()
  const { user, isAuthenticated, loading, logout, updateProfile } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }

    if (user) {
      setUsername(user.name || "")
      setAvatarUrl(user.avatar_url || "")

      // Fetch user profile data
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase.from("profiles").select("bio").eq("id", user.id).single()

          if (error) throw error

          if (data) {
            setBio(data.bio || "")
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        }
      }

      // Fetch watchlists
      const fetchWatchlists = async () => {
        try {
          setIsLoadingWatchlist(true)
          const [animeData, mangaData] = await Promise.all([fetchWatchlist("anime"), fetchWatchlist("manga")])

          setAnimeWatchlist(animeData as Anime[])
          setMangaWatchlist(mangaData as Manga[])
        } catch (error) {
          console.error("Error fetching watchlists:", error)
          toast({
            title: "Error",
            description: "Failed to load your watchlists",
            variant: "destructive",
          })
        } finally {
          setIsLoadingWatchlist(false)
        }
      }

      fetchProfile()
      fetchWatchlists()
    }
  }, [user, isAuthenticated, loading, router, supabase, toast])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const filePath = `avatars/${user?.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)

      toast({
        description: "Avatar uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError("")

      // Update profile in Supabase
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username,
          avatar_url: avatarUrl,
          bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id)

      if (profileError) throw profileError

      // Update user in auth context
      await updateProfile({
        name: username,
        avatar_url: avatarUrl,
      })

      toast({
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="hero-section py-8 px-4 -mx-4 md:-mx-8 lg:-mx-10 mb-8 rounded-b-3xl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Your Profile</h1>
          <p className="text-muted-foreground text-lg">Manage your account and view your collections</p>
        </div>
      </div>

      <Tabs defaultValue="profile" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/50 border border-border/50 p-1 mb-8">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="anime" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Anime Watchlist ({animeWatchlist.length})
          </TabsTrigger>
          <TabsTrigger value="manga" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Manga Collection ({mangaWatchlist.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-fade-in">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username} />
                    <AvatarFallback>{username?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary hover:underline">
                      Change Avatar
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled className="bg-muted/50 border-primary/20" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      className="min-h-[100px] border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-gradient hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="anime" className="animate-fade-in">
          {isLoadingWatchlist ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : animeWatchlist.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                <User className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Your anime watchlist is empty</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Start building your collection by adding anime titles you love or want to watch.
              </p>
              <Button asChild className="bg-gradient hover:opacity-90">
                <a href="/anime">Discover Anime</a>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manga" className="animate-fade-in">
          {isLoadingWatchlist ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : mangaWatchlist.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                <User className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Your manga collection is empty</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Start building your collection by adding manga titles you love or want to read.
              </p>
              <Button asChild className="bg-gradient hover:opacity-90">
                <a href="/manga">Discover Manga</a>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
