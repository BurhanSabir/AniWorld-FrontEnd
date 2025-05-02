"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type FilterValue = string | number | boolean | string[]
export type FilterValues = Record<string, FilterValue>

export interface FilterOption {
  id: string
  label: string
}

export interface FilterGroup {
  id: string
  label: string
  type: "checkbox" | "radio" | "range" | "select"
  options?: FilterOption[]
  min?: number
  max?: number
  step?: number
}

interface FilterContextType {
  // Active filters
  filters: FilterValues
  // Staged filters (not yet applied)
  stagedFilters: FilterValues
  // Search query
  searchQuery: string
  setSearchQuery: (query: string) => void
  // Filter methods
  setFilter: (key: string, value: FilterValue) => void
  setStagedFilter: (key: string, value: FilterValue) => void
  applyFilters: () => void
  clearFilters: () => void
  clearFilter: (key: string) => void
  toggleFilter: (key: string, value: string) => void
  toggleStagedFilter: (key: string, value: string) => void
  isFilterActive: (key: string, value?: string) => boolean
  isStagedFilterActive: (key: string, value?: string) => boolean
  getSelectedCount: (key: string) => number
  getStagedSelectedCount: (key: string) => number
  totalSelectedFilters: number
  totalStagedFilters: number
  // Pagination
  page: number
  setPage: (page: number) => void
  // Loading state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterValues>({})
  const [stagedFilters, setStagedFilters] = useState<FilterValues>({})
  const [searchQuery, setSearchQueryState] = useState("")
  const [page, setPageState] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false)

  // Initialize filters from URL on component mount
  useEffect(() => {
    if (!initialized) {
      const initialFilters: FilterValues = {}
      let initialPage = 1
      let initialSearch = ""

      searchParams.forEach((value, key) => {
        if (key === "page") {
          initialPage = Number.parseInt(value, 10) || 1
        } else if (key === "search") {
          initialSearch = value
        } else if (value.includes(",")) {
          initialFilters[key] = value.split(",")
        } else if (value === "true") {
          initialFilters[key] = true
        } else if (value === "false") {
          initialFilters[key] = false
        } else if (!isNaN(Number(value))) {
          initialFilters[key] = Number(value)
        } else {
          initialFilters[key] = value
        }
      })

      setFilters(initialFilters)
      setStagedFilters(initialFilters)
      setSearchQueryState(initialSearch)
      setPageState(initialPage)
      setInitialized(true)
    }
  }, [searchParams, initialized])

  // Update URL when filters, search, or page change
  useEffect(() => {
    if (!initialized || isUpdatingUrl) return

    const params = new URLSearchParams()

    // Add search parameter if not empty
    if (searchQuery) {
      params.set("search", searchQuery)
    }

    // Add page parameter if not on page 1
    if (page > 1) {
      params.set("page", page.toString())
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(","))
          }
        } else {
          params.set(key, String(value))
        }
      }
    })

    setIsUpdatingUrl(true)
    const queryString = params.toString()
    const url = pathname + (queryString ? `?${queryString}` : "")
    router.replace(url, { scroll: false })

    // Reset the flag after a short delay to prevent infinite loops
    setTimeout(() => {
      setIsUpdatingUrl(false)
    }, 100)
  }, [filters, searchQuery, page, pathname, router, initialized, isUpdatingUrl])

  // Set search query and reset to page 1
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query)
    setPageState(1)
  }, [])

  // Set a filter and reset to page 1
  const setFilter = useCallback((key: string, value: FilterValue) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
    setPageState(1)
  }, [])

  // Set a staged filter (doesn't apply until applyFilters is called)
  const setStagedFilter = useCallback((key: string, value: FilterValue) => {
    setStagedFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  // Apply staged filters and reset to page 1
  const applyFilters = useCallback(() => {
    setFilters(stagedFilters)
    setPageState(1)
  }, [stagedFilters])

  // Clear all filters and reset to page 1
  const clearFilters = useCallback(() => {
    setFilters({})
    setStagedFilters({})
    setPageState(1)
    // If there's a search query, clear that too for a complete reset
    if (searchQuery) {
      setSearchQueryState("")
    }
    // Force URL update to clear all parameters
    router.replace(pathname, { scroll: false })
  }, [searchQuery, pathname, router])

  // Clear a specific filter and reset to page 1
  const clearFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
    setStagedFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
    setPageState(1)
  }, [])

  // Toggle a filter value (for checkboxes) and reset to page 1
  const toggleFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const currentValues = (prev[key] as string[]) || []
      const valueExists = currentValues.includes(value)

      if (valueExists) {
        const newValues = currentValues.filter((v) => v !== value)
        return {
          ...prev,
          [key]: newValues.length ? newValues : undefined,
        }
      } else {
        return {
          ...prev,
          [key]: [...currentValues, value],
        }
      }
    })
    setPageState(1)
  }, [])

  // Toggle a staged filter value (for checkboxes)
  const toggleStagedFilter = useCallback((key: string, value: string) => {
    setStagedFilters((prev) => {
      const currentValues = (prev[key] as string[]) || []
      const valueExists = currentValues.includes(value)

      if (valueExists) {
        const newValues = currentValues.filter((v) => v !== value)
        return {
          ...prev,
          [key]: newValues.length ? newValues : undefined,
        }
      } else {
        return {
          ...prev,
          [key]: [...currentValues, value],
        }
      }
    })
  }, [])

  // Check if a filter is active
  const isFilterActive = useCallback(
    (key: string, value?: string): boolean => {
      const filterValue = filters[key]

      if (value === undefined) {
        return filterValue !== undefined && !(Array.isArray(filterValue) && filterValue.length === 0)
      }

      if (Array.isArray(filterValue)) {
        return filterValue.includes(value)
      }

      return filterValue === value
    },
    [filters],
  )

  // Check if a staged filter is active
  const isStagedFilterActive = useCallback(
    (key: string, value?: string): boolean => {
      const filterValue = stagedFilters[key]

      if (value === undefined) {
        return filterValue !== undefined && !(Array.isArray(filterValue) && filterValue.length === 0)
      }

      if (Array.isArray(filterValue)) {
        return filterValue.includes(value)
      }

      return filterValue === value
    },
    [stagedFilters],
  )

  // Get the count of selected values for a filter
  const getSelectedCount = useCallback(
    (key: string): number => {
      const value = filters[key]
      if (!value) return 0
      return Array.isArray(value) ? value.length : 1
    },
    [filters],
  )

  // Get the count of selected values for a staged filter
  const getStagedSelectedCount = useCallback(
    (key: string): number => {
      const value = stagedFilters[key]
      if (!value) return 0
      return Array.isArray(value) ? value.length : 1
    },
    [stagedFilters],
  )

  // Get the total count of selected filters
  const totalSelectedFilters = Object.keys(filters).reduce((count, key) => {
    return count + getSelectedCount(key)
  }, 0)

  // Get the total count of selected staged filters
  const totalStagedFilters = Object.keys(stagedFilters).reduce((count, key) => {
    return count + getStagedSelectedCount(key)
  }, 0)

  // Set the current page
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage)
  }, [])

  return (
    <FilterContext.Provider
      value={{
        filters,
        stagedFilters,
        searchQuery,
        setSearchQuery,
        setFilter,
        setStagedFilter,
        applyFilters,
        clearFilters,
        clearFilter,
        toggleFilter,
        toggleStagedFilter,
        isFilterActive,
        isStagedFilterActive,
        getSelectedCount,
        getStagedSelectedCount,
        totalSelectedFilters,
        totalStagedFilters,
        page,
        setPage,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return context
}
