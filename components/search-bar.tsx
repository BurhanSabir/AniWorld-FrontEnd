"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sync with URL search params only on initial load and when URL changes
  useEffect(() => {
    const query = searchParams.get("search") || ""
    if (query !== searchQuery && !isFocused) {
      setSearchQuery(query)
    }
  }, [searchParams, isFocused])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()

    if (onSearch) {
      onSearch(trimmedQuery)
    } else if (trimmedQuery) {
      router.push(`${routePrefix}?search=${encodeURIComponent(trimmedQuery)}`)
    } else {
      router.push(routePrefix)
    }

    // Remove focus from input after search
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery("")
    if (onSearch) {
      onSearch("")
    } else {
      router.push(routePrefix)
    }

    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <form onSubmit={handleSearch} className={cn("w-full", className)}>
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text" // Changed from "search" to "text" to avoid browser-specific search behavior
            placeholder={placeholder}
            className="pl-10 pr-10 h-12 rounded-full border-primary/20 focus:border-primary shadow-md"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label="Search input"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all duration-300"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  )
}
