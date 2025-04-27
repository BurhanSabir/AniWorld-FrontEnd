// This file contains API calls to the Anilist GraphQL API
import type { Anime, AnimeDetails } from "@/types/anime"
import type { FilterValues } from "@/context/filter-context"

const ANILIST_API = "https://graphql.anilist.co"

const ANIME_QUERY = `
query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $status: MediaStatus, $format: MediaFormat, $season: MediaSeason, $seasonYear: Int, $episodes_lesser: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media(
      type: ANIME, 
      search: $search,
      genre_in: $genre_in,
      status: $status,
      format: $format,
      season: $season,
      seasonYear: $seasonYear,
      episodes_lesser: $episodes_lesser,
      sort: $sort
    ) {
      id
      title {
        romaji
        english
      }
      coverImage {
        large
      }
      genres
      averageScore
      status
      episodes
      seasonYear
      format
      season
    }
  }
}
`

const ANIME_DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: true)
      coverImage {
        large
      }
      bannerImage
      genres
      averageScore
      meanScore
      popularity
      status
      episodes
      duration
      season
      seasonYear
      format
      source
      studios {
        nodes {
          name
        }
      }
    }
  }
`

export interface PageInfo {
  total: number
  currentPage: number
  lastPage: number
  hasNextPage: boolean
  perPage: number
}

export interface PaginatedAnimeResponse {
  data: Anime[]
  pageInfo: PageInfo
}

export type TabType = "trending" | "popular" | "upcoming"

export async function fetchAnimeList(
  searchQuery?: string,
  filters?: FilterValues,
  page = 1,
  perPage = 20,
  tab: TabType = "trending",
): Promise<PaginatedAnimeResponse> {
  try {
    const variables: any = {
      page,
      perPage,
      search: searchQuery || undefined,
    }

    // Set default sort based on tab
    if (!filters?.sort) {
      switch (tab) {
        case "trending":
          variables.sort = ["TRENDING_DESC"]
          break
        case "popular":
          variables.sort = ["POPULARITY_DESC"]
          break
        case "upcoming":
          variables.sort = ["START_DATE_DESC"]
          // Filter for upcoming anime
          variables.status = "NOT_YET_RELEASED"
          break
        default:
          variables.sort = ["TRENDING_DESC"]
      }
    } else {
      variables.sort = [filters.sort]
    }

    // Add filter variables if they exist
    if (filters) {
      if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
        variables.genre_in = filters.genres
      }

      if (filters.status && tab !== "upcoming") {
        variables.status = filters.status
      }

      if (filters.type) {
        variables.format = filters.type
      }

      if (filters.season) {
        variables.season = filters.season
      }

      if (filters.year) {
        variables.seasonYear = Number(filters.year)
      }

      if (filters.episodesLte) {
        variables.episodes_lesser = Number(filters.episodesLte)
      }
    }

    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANIME_QUERY,
        variables,
      }),
    })

    const data = await response.json()

    if (data.errors) {
      console.error("AniList API Error:", data.errors)
      return { data: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage } }
    }

    const animeData = data.data.Page.media.map((anime: any) => ({
      id: anime.id,
      title: anime.title.english || anime.title.romaji,
      coverImage: anime.coverImage.large,
      genres: anime.genres,
      score: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null,
      status: anime.status,
      episodes: anime.episodes,
      year: anime.seasonYear,
      format: anime.format,
      season: anime.season,
    }))

    return {
      data: animeData,
      pageInfo: data.data.Page.pageInfo,
    }
  } catch (error) {
    console.error("Error fetching anime list:", error)
    return { data: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage } }
  }
}

export async function fetchMangaList(
  searchQuery?: string,
  filters?: FilterValues,
  page = 1,
  perPage = 20,
  tab: TabType = "trending",
): Promise<PaginatedAnimeResponse> {
  try {
    const variables: any = {
      page,
      perPage,
      search: searchQuery || undefined,
      type: "MANGA", // Set type to MANGA
    }

    // Set default sort based on tab
    if (!filters?.sort) {
      switch (tab) {
        case "trending":
          variables.sort = ["TRENDING_DESC"]
          break
        case "popular":
          variables.sort = ["POPULARITY_DESC"]
          break
        case "upcoming":
          variables.sort = ["START_DATE_DESC"]
          // Filter for upcoming manga
          variables.status = "NOT_YET_RELEASED"
          break
        default:
          variables.sort = ["TRENDING_DESC"]
      }
    } else {
      variables.sort = [filters.sort]
    }

    // Add filter variables if they exist
    if (filters) {
      if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
        variables.genre_in = filters.genres
      }

      if (filters.status && tab !== "upcoming") {
        variables.status = filters.status
      }

      if (filters.type) {
        variables.format = filters.type
      }

      if (filters.year) {
        variables.seasonYear = Number(filters.year)
      }
    }

    // Use the same query structure but with type: MANGA
    const MANGA_QUERY = `
    query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $status: MediaStatus, $format: MediaFormat, $seasonYear: Int, $sort: [MediaSort], $type: MediaType) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(
          type: $type, 
          search: $search,
          genre_in: $genre_in,
          status: $status,
          format: $format,
          seasonYear: $seasonYear,
          sort: $sort
        ) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          genres
          averageScore
          status
          chapters
          volumes
          startDate {
            year
          }
          format
        }
      }
    }
    `

    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: MANGA_QUERY,
        variables,
      }),
    })

    const data = await response.json()

    if (data.errors) {
      console.error("AniList API Error:", data.errors)
      return { data: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage } }
    }

    const mangaData = data.data.Page.media.map((manga: any) => ({
      id: manga.id,
      title: manga.title.english || manga.title.romaji,
      coverImage: manga.coverImage.large,
      genres: manga.genres,
      score: manga.averageScore ? (manga.averageScore / 10).toFixed(1) : null,
      status: manga.status,
      chapters: manga.chapters,
      volumes: manga.volumes,
      year: manga.startDate?.year,
      format: manga.format,
    }))

    return {
      data: mangaData,
      pageInfo: data.data.Page.pageInfo,
    }
  } catch (error) {
    console.error("Error fetching manga list:", error)
    return { data: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage } }
  }
}

export async function fetchAnimeDetails(id: number): Promise<AnimeDetails> {
  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANIME_DETAILS_QUERY,
        variables: {
          id,
        },
      }),
    })

    const data = await response.json()
    const anime = data.data.Media

    return {
      id: anime.id,
      title: anime.title.english || anime.title.romaji,
      titleJapanese: anime.title.native,
      coverImage: anime.coverImage.large,
      description: anime.description,
      genres: anime.genres,
      score: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null,
      status: anime.status,
      episodes: anime.episodes,
      year: anime.seasonYear,
      season: anime.season,
      format: anime.format,
      duration: anime.duration,
      studios: anime.studios.nodes.map((studio: { name: string }) => studio.name),
      popularity: anime.popularity,
      averageScore: anime.averageScore,
      source: anime.source,
    }
  } catch (error) {
    console.error("Error fetching anime details:", error)
    throw error
  }
}

const ANIME_CHARACTERS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      characters(sort: ROLE) {
        edges {
          node {
            id
            name {
              full
              native
            }
            image {
              large
            }
            description
            gender
            dateOfBirth {
              year
              month
              day
            }
            age
          }
          role
          voiceActors(language: JAPANESE) {
            id
            name {
              full
              native
            }
            image {
              medium
            }
            language
          }
        }
      }
    }
  }
`

export interface Character {
  id: number
  name: string
  nativeName?: string
  image: string
  description?: string
  gender?: string
  age?: string
  dateOfBirth?: {
    year?: number
    month?: number
    day?: number
  }
  role: string
  voiceActors: {
    id: number
    name: string
    nativeName?: string
    image?: string
    language: string
  }[]
}

export async function fetchAnimeCharacters(id: number): Promise<Character[]> {
  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANIME_CHARACTERS_QUERY,
        variables: {
          id,
        },
      }),
    })

    const data = await response.json()

    if (data.errors) {
      console.error("AniList API Error:", data.errors)
      return []
    }

    const characterEdges = data.data.Media.characters.edges || []

    return characterEdges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      nativeName: edge.node.name.native,
      image: edge.node.image.large,
      description: edge.node.description,
      gender: edge.node.gender,
      age: edge.node.age,
      dateOfBirth: edge.node.dateOfBirth,
      role: edge.role,
      voiceActors: (edge.voiceActors || []).map((va: any) => ({
        id: va.id,
        name: va.name.full,
        nativeName: va.name.native,
        image: va.image?.medium,
        language: va.language,
      })),
    }))
  } catch (error) {
    console.error("Error fetching anime characters:", error)
    return []
  }
}
