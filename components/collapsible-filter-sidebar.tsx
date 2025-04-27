"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import type { FilterGroup } from "@/context/filter-context"

interface CollapsibleFilterSidebarProps {
  filterGroups: FilterGroup[]
  className?: string
}

export function CollapsibleFilterSidebar({ filterGroups, className }: CollapsibleFilterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isMobile = useMobile()

  // On mobile, always start collapsed
  useEffect(() => {
    setIsCollapsed(isMobile)
  }, [isMobile])

  return (
    <div className={cn("relative", className)}>
      {/* Toggle button for desktop */}
      {!isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-0 z-10 h-8 w-8 rounded-full border border-border bg-background shadow-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand filters" : "Collapse filters"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      )}

      {/* Mobile filter button */}
      {isMobile && (
        <Button variant="outline" size="sm" className="mb-4 w-full" onClick={() => setIsCollapsed(!isCollapsed)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {isCollapsed ? "Show Filters" : "Hide Filters"}
        </Button>
      )}

      {/* Filter sidebar with animation */}
      <div
        className={cn(
          "sidebar-filter overflow-hidden transition-all duration-300",
          isCollapsed ? "collapsed h-0" : "expanded",
        )}
      >
        <div className={cn("transition-opacity duration-300", isCollapsed ? "opacity-0" : "opacity-100")}>
          <FilterSidebar filterGroups={filterGroups} />
        </div>
      </div>
    </div>
  )
}
