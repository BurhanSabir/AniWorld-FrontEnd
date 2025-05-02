import { getSupabaseClient } from "@/lib/supabase/client"
import { fetchAnimeDetails, fetchAnimeList, fetchMangaList } from "@/lib/api/anilist"

// Sync anime data with our database
export async function syncAnimeData(animeId: number): Promise<void> {
  const supabase = getSupabaseClient()

  try {
    // Check if the anime already exists in our database
    const { data: existingAnime } = await supabase.from("anime").select("id, updated_at").eq("id", animeId).single()

    // If the anime exists and was updated recently, skip the sync
    if (existingAnime) {
      const lastUpdated = new Date(existingAnime.updated_at)
      const now = new Date()
      const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

      // Only sync if it's been more than 7 days since the last update
      if (daysSinceUpdate < 7) {
        return
      }
    }

    // Fetch the anime details from the API
    const animeDetails = await fetchAnimeDetails(animeId)

    // Insert or update the anime in our database
    const { error } = await supabase.from("anime").upsert({
      id: animeDetails.id,
      title: animeDetails.title,
      title_japanese: animeDetails.titleJapanese,
      cover_image: animeDetails.coverImage,
      description: animeDetails.description,
      genres: animeDetails.genres,
      score: animeDetails.score,
      status: animeDetails.status,
      episodes: animeDetails.episodes,
      year: animeDetails.year,
      season: animeDetails.season,
      format: animeDetails.format,
      duration: animeDetails.duration,
      studios: animeDetails.studios,
      popularity: animeDetails.popularity,
      average_score: animeDetails.averageScore,
      source: animeDetails.source,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
  } catch (error) {
    console.error("Error syncing anime data:", error)
    throw error
  }
}

// Sync manga data with our database
export async function syncMangaData(mangaId: number): Promise<void> {
  // Similar implementation to syncAnimeData
  // This would require a fetchMangaDetails function
  // For now, we'll leave this as a placeholder
}

// Sync trending anime/manga with our database
export async function syncTrendingData(): Promise<void> {
  const supabase = getSupabaseClient()

  try {
    // Fetch trending anime
    const { data: animeList } = await fetchAnimeList(undefined, undefined, 1, 20, "trending")

    // Insert or update the anime in our database
    for (const anime of animeList) {
      await supabase.from("anime").upsert({
        id: anime.id,
        title: anime.title,
        cover_image: anime.coverImage,
        genres: anime.genres,
        score: anime.score,
        status: anime.status,
        episodes: anime.episodes,
        year: anime.year,
        updated_at: new Date().toISOString(),
      })
    }

    // Fetch trending manga
    const { data: mangaList } = await fetchMangaList(undefined, undefined, 1, 20, "trending")

    // Insert or update the manga in our database
    for (const manga of mangaList) {
      await supabase.from("manga").upsert({
        id: manga.id,
        title: manga.title,
        cover_image: manga.coverImage,
        genres: manga.genres,
        score: manga.score,
        status: manga.status,
        chapters: manga.chapters,
        volumes: manga.volumes,
        year: manga.year,
        updated_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error syncing trending data:", error)
    throw error
  }
}
