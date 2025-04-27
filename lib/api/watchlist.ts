// This file contains API calls for watchlist management
// In a real app, these would call your Rails backend
import type { Anime, Manga } from "@/types/anime"
import { fetchAnimeDetails } from "@/lib/api/anilist"

// Mock data for demo purposes
const MOCK_ANIME_WATCHLIST: Anime[] = [
  {
    id: 1,
    title: "Attack on Titan",
    coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
    genres: ["Action", "Drama"],
    score: "9.0",
    status: "FINISHED",
    episodes: 25,
    year: 2013,
  },
  {
    id: 2,
    title: "My Hero Academia",
    coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21856-UD7JwU5HFkmp.jpg",
    genres: ["Action", "Comedy"],
    score: "8.2",
    status: "RELEASING",
    episodes: 113,
    year: 2016,
  },
]

// Mock data for manga watchlist
const MOCK_MANGA_WATCHLIST: Manga[] = [
  {
    id: 101,
    title: "One Piece",
    coverImage: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-oT7YguhEK1TE.jpg",
    genres: ["Action", "Adventure"],
    score: "9.1",
    status: "RELEASING",
    chapters: 1050,
    volumes: 103,
    year: 1997,
  },
  {
    id: 102,
    title: "Berserk",
    coverImage: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-7EzO7o21jzeF.jpg",
    genres: ["Action", "Drama", "Fantasy", "Horror"],
    score: "9.4",
    status: "RELEASING",
    chapters: 364,
    volumes: 41,
    year: 1989,
  },
]

// In-memory storage for added/removed items
let dynamicAnimeWatchlist = [...MOCK_ANIME_WATCHLIST]
let dynamicMangaWatchlist = [...MOCK_MANGA_WATCHLIST]

// Cache for anime/manga details
const animeDetailsCache = new Map<number, Anime>()
const mangaDetailsCache = new Map<number, Manga>()

export async function fetchWatchlist(token: string, type: "anime" | "manga" = "anime"): Promise<Anime[] | Manga[]> {
  // In a real app, this would be a fetch call to your Rails API
  // return fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist?type=${type}`, {
  //   headers: { 'Authorization': `Bearer ${token}` },
  // }).then(res => res.json())

  // For demo purposes, we'll return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(type === "anime" ? dynamicAnimeWatchlist : dynamicMangaWatchlist)
    }, 500)
  })
}

export async function addToWatchlist(itemId: number, token: string, type: "anime" | "manga" = "anime"): Promise<void> {
  // In a real app, this would be a fetch call to your Rails API
  // return fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${token}`
  //   },
  //   body: JSON.stringify({ item_id: itemId, type }),
  // }).then(res => res.json())

  // For demo purposes, we'll simulate a successful API call
  return new Promise(async (resolve) => {
    // Check if the item is already in the watchlist
    const watchlist = type === "anime" ? dynamicAnimeWatchlist : dynamicMangaWatchlist
    const existingItem = watchlist.find((item) => item.id === itemId)

    if (existingItem) {
      resolve()
      return
    }

    // Check if we have cached details for this item
    const cache = type === "anime" ? animeDetailsCache : mangaDetailsCache
    let itemDetails = cache.get(itemId)

    if (!itemDetails) {
      try {
        // For anime, fetch real details from the API
        if (type === "anime") {
          const details = await fetchAnimeDetails(itemId)
          animeDetailsCache.set(itemId, details)
          itemDetails = details
        } else {
          // For manga, create a placeholder (in a real app, you'd fetch from API)
          itemDetails = {
            id: itemId,
            title: `Manga #${itemId}`,
            coverImage: `https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx${itemId}-${Math.random().toString(36).substring(7)}.jpg`,
            genres: ["Action", "Adventure"],
            score: (Math.random() * 2 + 7).toFixed(1),
            status: "RELEASING",
            chapters: Math.floor(Math.random() * 100) + 1,
            volumes: Math.floor(Math.random() * 10) + 1,
            year: 2023,
          }
          mangaDetailsCache.set(itemId, itemDetails)
        }
      } catch (error) {
        console.error(`Failed to fetch ${type} details:`, error)
        // Fallback to a placeholder
        itemDetails = {
          id: itemId,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} #${itemId}`,
          coverImage: `/placeholder.svg?height=300&width=200&text=${type}${itemId}`,
          genres: ["Unknown"],
          score: "0.0",
          status: "UNKNOWN",
          ...(type === "anime" ? { episodes: 0 } : { chapters: 0, volumes: 0 }),
          year: new Date().getFullYear(),
        }
      }
    }

    // Add the item to the watchlist
    if (type === "anime") {
      dynamicAnimeWatchlist = [...dynamicAnimeWatchlist, itemDetails as Anime]
    } else {
      dynamicMangaWatchlist = [...dynamicMangaWatchlist, itemDetails as Manga]
    }

    setTimeout(() => {
      resolve()
    }, 300)
  })
}

export async function removeFromWatchlist(
  itemId: number,
  token: string,
  type: "anime" | "manga" = "anime",
): Promise<void> {
  // In a real app, this would be a fetch call to your Rails API
  // return fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist/${itemId}?type=${type}`, {
  //   method: 'DELETE',
  //   headers: { 'Authorization': `Bearer ${token}` },
  // }).then(res => res.json())

  // For demo purposes, we'll simulate a successful API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Remove the item from the dynamic watchlist
      if (type === "anime") {
        dynamicAnimeWatchlist = dynamicAnimeWatchlist.filter((item) => item.id !== itemId)
      } else {
        dynamicMangaWatchlist = dynamicMangaWatchlist.filter((item) => item.id !== itemId)
      }
      resolve()
    }, 300)
  })
}

export async function checkInWatchlist(
  itemId: number,
  token: string,
  type: "anime" | "manga" = "anime",
): Promise<boolean> {
  // In a real app, this would be a fetch call to your Rails API
  // return fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist/check/${itemId}?type=${type}`, {
  //   headers: { 'Authorization': `Bearer ${token}` },
  // }).then(res => res.json()).then(data => data.inWatchlist)

  // For demo purposes, we'll check if the item is in our dynamic watchlist
  return new Promise((resolve) => {
    setTimeout(() => {
      if (type === "anime") {
        resolve(dynamicAnimeWatchlist.some((item) => item.id === itemId))
      } else {
        resolve(dynamicMangaWatchlist.some((item) => item.id === itemId))
      }
    }, 300)
  })
}
