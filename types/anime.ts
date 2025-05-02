export interface Anime {
  id: number
  title: string
  coverImage: string
  bannerImage?: string
  description?: string
  episodes?: number
  duration?: number
  genres?: string[]
  status?: string
  score?: string
  popularity?: number
  year?: number
  season?: string
  studios?: string[]
  characters?: Character[]
  recommendations?: Anime[]
  averageScore?: number
  format?: string
  source?: string
}

export interface Manga {
  id: number
  title: string
  coverImage: string
  bannerImage?: string
  description?: string
  chapters?: number
  volumes?: number
  genres?: string[]
  status?: string
  score?: string
  popularity?: number
  year?: number
  authors?: string[]
  characters?: Character[]
  recommendations?: Manga[]
  format?: string
}

export interface Character {
  id: number
  name: string
  image: string
  role?: string
  description?: string
  voiceActors?: VoiceActor[]
  nativeName?: string
  gender?: string
  age?: string
  dateOfBirth?: {
    year?: number
    month?: number
    day?: number
  }
}

export interface VoiceActor {
  id: number
  name: string
  image: string
  language: string
  nativeName?: string
}

export interface FilterOptions {
  genres: string[]
  year: number[]
  season: string
  format: string
  status: string
  sort: string
}

export interface AnimeRating {
  id: number
  mediaId: number
  type: "anime" | "manga"
  rating: number
  title: string
  coverImage: string | null
  createdAt: string
  updatedAt: string
}

export interface AnimeDetails extends Anime {
  titleJapanese?: string
  averageScore?: number
}

export interface MangaDetails extends Manga {
  titleJapanese?: string
}
