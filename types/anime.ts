export interface Anime {
  id: number
  title: string
  coverImage: string
  genres?: string[]
  score?: string
  status?: string
  episodes?: number
  year?: number
}

// Add a new AnimeDetails interface with more fields
export interface AnimeDetails extends Anime {
  titleJapanese?: string
  description?: string
  studios?: string[]
  season?: string
  format?: string
  duration?: number
  popularity?: number
  averageScore?: number
  source?: string
}

// Add a Manga interface
export interface Manga {
  id: number
  title: string
  coverImage: string
  genres?: string[]
  score?: string
  status?: string
  chapters?: number
  volumes?: number
  year?: number
  format?: string
}

// Add a MangaDetails interface
export interface MangaDetails extends Manga {
  titleJapanese?: string
  description?: string
  popularity?: number
  averageScore?: number
  source?: string
}
