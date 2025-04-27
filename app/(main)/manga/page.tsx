"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, X, TrendingUp, FlameIcon as Fire, Calendar } from "lucide-react"
import { FilterProvider, useFilters } from "@/context/filter-context"
import { CollapsibleFilterSidebar } from "@/components/collapsible-filter-sidebar"
import { NoResults } from "@/components/no-results"
import { Pagination } from "@/components/pagination"
import { MobilePagination } from "@/components/mobile-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { mangaFilterGroups } from "@/lib/api/filter"
import { fetchMangaList, type TabType } from "@/lib/api/anilist"
import { useMobile } from "@/hooks/use-mobile"
import { MangaCard } from "@/components/manga-card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import type { Manga } from "@/types/anime"
import type { PageInfo } from "@/lib/api/anilist"

function MangaPageContent() {
  const [mangaList, setMangaList] = useState<Manga[]>([])
  const [featuredManga, setFeaturedManga] = useState<Manga | null>(null)
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
    const loadManga = async () => {
      try {
        setIsLoading(true)
        const response = await fetchMangaList(searchQuery, filters, page, 20, activeTab)
        setMangaList(response.data)
        setPageInfo(response.pageInfo)

        // Set featured manga from the first result if on first page and no search query
        if (page === 1 && !searchQuery && Object.keys(filters).length === 0) {
          setFeaturedManga(response.data[0] || null)
        } else {
          setFeaturedManga(null)
        }

        setInitialLoad(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load manga list",
          variant: "destructive",
        })
        setInitialLoad(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Add a delay to prevent API calls on every keystroke
    const handler = setTimeout(() => {
      loadManga()
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

  const renderMangaList = () => {
    if (initialLoad || isLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )
    }

    if (mangaList.length === 0) {
      return <NoResults searchQuery={searchQuery} resetSearch={clearSearch} />
    }

    // If we have a featured manga and we're on the first page with no search/filters
    const displayList = featuredManga ? mangaList.filter((manga) => manga.id !== featuredManga.id) : mangaList

    return (
      <>
        {featuredManga && (
          <div className="mb-8 animate-fade-in">
            <MangaCard manga={featuredManga} featured={true} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayList.map((manga) => (
            <MangaCard key={manga.id} manga={manga} showAddToWatchlist={isAuthenticated} />
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
      <div className="hero-section py-8 px-4 -mx-4 md:-mx-8 lg:-mx-10 mb-8 rounded-b-3xl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Discover Manga</h1>
          <p className="text-muted-foreground text-lg mb-6">Explore the world of manga with our curated collection</p>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for manga titles..."
              className="pl-10 pr-10 h-12 rounded-full border-primary/20 focus:border-primary"
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
                <X className="h-5 w-5" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="trending" onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <TabsList className="bg-card/50 border border-border/50 p-1">
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Fire className="h-4 w-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Collapsible Filter Sidebar */}
          <CollapsibleFilterSidebar filterGroups={mangaFilterGroups} />

          <div>
            <TabsContent value="trending" className="mt-0">
              {renderMangaList()}
            </TabsContent>

            <TabsContent value="popular" className="mt-0">
              {renderMangaList()}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              {renderMangaList()}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

export default function MangaPage() {
  return (
    <FilterProvider>
      <MangaPageContent />
    </FilterProvider>
  )
}
