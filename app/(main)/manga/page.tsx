"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterProvider, useFilters } from "@/context/filter-context"
import { SimplifiedFilterSidebar } from "@/components/simplified-filter-sidebar"
import { NoResults } from "@/components/no-results"
import { Pagination } from "@/components/pagination"
import { MobilePagination } from "@/components/mobile-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { HeroSlider } from "@/components/hero-slider"
import { SearchBar } from "@/components/search-bar"
import { TrendingUp, FlameIcon as Fire, Calendar } from "lucide-react"
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
  const [featuredManga, setFeaturedManga] = useState<Manga[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    total: 0,
    currentPage: 1,
    lastPage: 1,
    hasNextPage: false,
    perPage: 16,
  })
  const [activeTab, setActiveTab] = useState<TabType>("trending")
  const [initialLoad, setInitialLoad] = useState(true)
  const { filters, searchQuery, setSearchQuery, page, setPage, isLoading, setIsLoading } = useFilters()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const isMobile = useMobile()

  // Function to handle search from the SearchBar component
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setPage(1) // Reset to page 1 when searching
    },
    [setSearchQuery, setPage],
  )

  useEffect(() => {
    const loadManga = async () => {
      try {
        setIsLoading(true)

        // First, load featured manga for hero slider
        if (page === 1 && !searchQuery && Object.keys(filters).length === 0) {
          const featuredResponse = await fetchMangaList("", filters, 1, 8, activeTab)
          setFeaturedManga(featuredResponse.data)
        }

        // Then load the paginated list
        const response = await fetchMangaList(searchQuery, filters, page, 16, activeTab)
        setMangaList(response.data)
        setPageInfo(response.pageInfo)

        setInitialLoad(false)
      } catch (error) {
        console.error("Error loading manga:", error)
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
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, filters, page, activeTab, toast, setIsLoading])

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
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 16 }).map((_, i) => (
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
      return <NoResults searchQuery={searchQuery} resetSearch={() => setSearchQuery("")} />
    }

    return (
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {mangaList.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          initialQuery={searchQuery}
          placeholder="Search for manga titles..."
          routePrefix="/manga"
          className="max-w-2xl mx-auto"
          onSearch={handleSearch}
        />
      </div>

      {/* Hero Slider - only show on first page with no search/filters */}
      {page === 1 && !searchQuery && Object.keys(filters).length === 0 && featuredManga.length > 0 && (
        <HeroSlider animeList={featuredManga} className="mb-12" />
      )}

      {/* Tabs and Content */}
      <Tabs defaultValue="trending" onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <TabsList className="bg-card/50 p-1 rounded-full">
            <TabsTrigger
              value="trending"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-full"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="popular"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-full"
            >
              <Fire className="h-4 w-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Filter sidebar */}
          <SimplifiedFilterSidebar filterGroups={mangaFilterGroups} />

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

            {/* Pagination */}
            {mangaList.length > 0 && (
              <div className="mt-12">
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

                {/* Results count */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Showing {(pageInfo.currentPage - 1) * pageInfo.perPage + 1}-
                  {Math.min(pageInfo.currentPage * pageInfo.perPage, pageInfo.total)} of {pageInfo.total} results
                </div>
              </div>
            )}
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
