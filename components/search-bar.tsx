"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  routePrefix?: string
  className?: string
}

export function SearchBar({
  initialQuery = "",
  placeholder = "Search for anime or manga...",
  routePrefix = "/anime",
  className,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`${routePrefix}?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    router.push(routePrefix)
  }

  return (
    <form onSubmit={handleSearch} className={cn("w-full", className)}>
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            className="pl-10 pr-10 h-12 rounded-full border-primary/20 focus:border-primary shadow-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full">
            Search
          </Button>
        </div>
      </div>
    </form>
  )
}
