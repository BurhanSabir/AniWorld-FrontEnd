"use client"

import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFilters } from "@/context/filter-context"

interface NoResultsProps {
  searchQuery?: string
  resetSearch?: () => void
}

export function NoResults({ searchQuery, resetSearch }: NoResultsProps) {
  const { totalSelectedFilters, clearFilters, isLoading } = useFilters()

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No results found</h3>

      {searchQuery && totalSelectedFilters > 0 ? (
        <p className="text-muted-foreground mb-6">No matches for "{searchQuery}" with the selected filters</p>
      ) : searchQuery ? (
        <p className="text-muted-foreground mb-6">No matches found for "{searchQuery}"</p>
      ) : totalSelectedFilters > 0 ? (
        <p className="text-muted-foreground mb-6">No content matches your filter criteria</p>
      ) : (
        <p className="text-muted-foreground mb-6">No content available at this time</p>
      )}

      <div className="flex flex-wrap gap-4 justify-center">
        {searchQuery && resetSearch && (
          <Button onClick={resetSearch} disabled={isLoading}>
            Clear Search
          </Button>
        )}

        {totalSelectedFilters > 0 && (
          <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  )
}
