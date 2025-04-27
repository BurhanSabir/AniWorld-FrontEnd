import type { Anime } from "@/types/anime"

export const animeGenres = [
  { id: "action", label: "Action" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
  { id: "drama", label: "Drama" },
  { id: "fantasy", label: "Fantasy" },
  { id: "horror", label: "Horror" },
  { id: "mystery", label: "Mystery" },
  { id: "romance", label: "Romance" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "slice-of-life", label: "Slice of Life" },
  { id: "sports", label: "Sports" },
  { id: "supernatural", label: "Supernatural" },
  { id: "thriller", label: "Thriller" },
]

export const animeStatus = [
  { id: "FINISHED", label: "Finished" },
  { id: "RELEASING", label: "Releasing" },
  { id: "NOT_YET_RELEASED", label: "Not Yet Released" },
  { id: "CANCELLED", label: "Cancelled" },
]

export const animeTypes = [
  { id: "TV", label: "TV Show" },
  { id: "MOVIE", label: "Movie" },
  { id: "OVA", label: "OVA" },
  { id: "ONA", label: "ONA" },
  { id: "SPECIAL", label: "Special" },
]

export const animeSeasons = [
  { id: "WINTER", label: "Winter" },
  { id: "SPRING", label: "Spring" },
  { id: "SUMMER", label: "Summer" },
  { id: "FALL", label: "Fall" },
]

export const animeYears = Array.from({ length: 21 }, (_, i) => {
  const year = 2023 - i
  return { id: year.toString(), label: year.toString() }
})

export const animeSortOptions = [
  { id: "POPULARITY_DESC", label: "Popularity (High to Low)" },
  { id: "POPULARITY", label: "Popularity (Low to High)" },
  { id: "SCORE_DESC", label: "Rating (High to Low)" },
  { id: "SCORE", label: "Rating (Low to High)" },
  { id: "UPDATED_AT_DESC", label: "Recently Updated" },
  { id: "START_DATE_DESC", label: "Newest" },
  { id: "START_DATE", label: "Oldest" },
]

export const animeFilterGroups = [
  {
    id: "genres",
    label: "Genres",
    type: "checkbox" as const,
    options: animeGenres,
  },
  {
    id: "status",
    label: "Status",
    type: "radio" as const,
    options: animeStatus,
  },
  {
    id: "type",
    label: "Type",
    type: "radio" as const,
    options: animeTypes,
  },
  {
    id: "season",
    label: "Season",
    type: "radio" as const,
    options: animeSeasons,
  },
  {
    id: "year",
    label: "Year",
    type: "select" as const,
    options: animeYears,
  },
  {
    id: "episodesLte",
    label: "Max Episodes",
    type: "range" as const,
    min: 1,
    max: 100,
    step: 1,
  },
  {
    id: "sort",
    label: "Sort By",
    type: "radio" as const,
    options: animeSortOptions,
  },
]

// Similar filter groups for manga
export const mangaGenres = [
  { id: "action", label: "Action" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
  { id: "drama", label: "Drama" },
  { id: "fantasy", label: "Fantasy" },
  { id: "horror", label: "Horror" },
  { id: "mystery", label: "Mystery" },
  { id: "romance", label: "Romance" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "slice-of-life", label: "Slice of Life" },
  { id: "supernatural", label: "Supernatural" },
  { id: "thriller", label: "Thriller" },
]

export const mangaStatus = [
  { id: "FINISHED", label: "Finished" },
  { id: "RELEASING", label: "Releasing" },
  { id: "NOT_YET_RELEASED", label: "Not Yet Released" },
  { id: "CANCELLED", label: "Cancelled" },
]

export const mangaTypes = [
  { id: "MANGA", label: "Manga" },
  { id: "NOVEL", label: "Novel" },
  { id: "ONE_SHOT", label: "One Shot" },
  { id: "DOUJIN", label: "Doujin" },
  { id: "MANHWA", label: "Manhwa" },
  { id: "MANHUA", label: "Manhua" },
]

export const mangaFilterGroups = [
  {
    id: "genres",
    label: "Genres",
    type: "checkbox" as const,
    options: mangaGenres,
  },
  {
    id: "status",
    label: "Status",
    type: "radio" as const,
    options: mangaStatus,
  },
  {
    id: "type",
    label: "Type",
    type: "radio" as const,
    options: mangaTypes,
  },
  {
    id: "sort",
    label: "Sort By",
    type: "radio" as const,
    options: animeSortOptions, // Using the same sort options as anime for now
  },
]

export function filterAnimeBySearch(animeList: Anime[], searchQuery: string): Anime[] {
  if (!searchQuery) return animeList

  const query = searchQuery.toLowerCase().trim()
  return animeList.filter((anime) => {
    return anime.title.toLowerCase().includes(query)
  })
}

export const buildAnilistQuery = () => {
  // This function is intentionally empty as it is not used in the existing code.
  // It is included to satisfy the missing exports requirement.
}
