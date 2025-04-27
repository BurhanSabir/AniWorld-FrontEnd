"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { AnimeCard } from "@/components/anime-card"
import { FilterProvider, useFilters } from "@/context/filter-context"
import { FilterSidebar } from "@/components/filter-sidebar"
import { MobileFilterDrawer } from "@/components/mobile-filter-drawer"
import { NoResults } from "@/components/no-results"
import { Pagination } from "@/components/pagination"
import { MobilePagination } from "@/components/mobile-pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, X } from "lucide-react"
import { fetchAnimeList, type TabType } from "@/lib/api/anilist"
import { animeFilterGroups } from "@/lib/api/filter"
import type { Anime } from "@/types/anime"
import type { PageInfo } from "@/lib/api/anilist"
import { useMobile } from "@/hooks/use-mobile"

function AnimePageContent() {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    total: 0,
    currentPage: 1,
    lastPage: 1,
    hasNextPage: false,
    perPage: 20,
  })
  const [activeTab, setActiveTab] = useState<TabType>("trending")
  const [initialLoad, setInitialLoad] = useState(true)
  const { filters, searchQuery, setSearchQuery, page, setPage, isLoading, setIsLoading } = useFilters()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const isMobile = useMobile()

  useEffect(() => {
    const loadAnime = async () => {
      try {
        setIsLoading(true)
        const response = await fetchAnimeList(searchQuery, filters, page, 20, activeTab)
        setAnimeList(response.data)
        setPageInfo(response.pageInfo)
        setInitialLoad(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load anime list",
          variant: "destructive",
        })
        setInitialLoad(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Add a delay to prevent API calls on every keystroke
    const handler = setTimeout(() => {
      loadAnime()
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, filters, page, activeTab, toast, setIsLoading])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType)
    setPage(1) // Reset to page 1 when changing tabs
  }

  const renderAnimeList = () => {
    if (initialLoad || isLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[250px] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )
    }

    if (animeList.length === 0) {
      return <NoResults searchQuery={searchQuery} resetSearch={clearSearch} />
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} showAddToWatchlist={isAuthenticated} />
          ))}
        </div>

        {/* Pagination - show different components based on screen size */}
        <div className="mt-8">
          {isMobile ? (
            <MobilePagination
              currentPage={pageInfo.currentPage}
              totalPages={pageInfo.lastPage}
              onPageChange={handlePageChange}
            />
          ) : (
            <Pagination
              currentPage={pageInfo.currentPage}
              totalPages={pageInfo.lastPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing {(pageInfo.currentPage - 1) * pageInfo.perPage + 1}-
          {Math.min(pageInfo.currentPage * pageInfo.perPage, pageInfo.total)} of {pageInfo.total} results
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discover Anime</h1>
      </div>

      <Tabs defaultValue="trending" onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          {isMobile && (
            <div className="flex-1">
              <MobileFilterDrawer filterGroups={animeFilterGroups} />
            </div>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search anime..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={handleSearch}
            disabled={isLoading}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <div className="hidden md:block">
              <FilterSidebar filterGroups={animeFilterGroups} />
            </div>
          )}

          <div>
            <TabsContent value="trending" className="mt-0">
              {renderAnimeList()}
            </TabsContent>

            <TabsContent value="popular" className="mt-0">
              {renderAnimeList()}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              {renderAnimeList()}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

export default function AnimePage() {
  return (
    <FilterProvider>
      <AnimePageContent />
    </FilterProvider>
  )
}
