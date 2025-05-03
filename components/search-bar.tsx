"use client"

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  routePrefix?: string
  className?: string
  onSearch?: (query: string) => void
}

export function SearchBar({
  initialQuery = "",
  placeholder = "Search for anime or manga...",
  routePrefix = "/anime",
  className,
  onSearch,
}: SearchBarProps) {
  // This component is now deprecated as search has been moved to the navbar
  // It's kept as an empty component to prevent breaking existing imports
  return null
}
