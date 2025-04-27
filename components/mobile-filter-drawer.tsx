"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Check, FilterX, SlidersHorizontal } from "lucide-react"
import { useFilters, type FilterGroup } from "@/context/filter-context"
import { useState } from "react"

interface MobileFilterDrawerProps {
  filterGroups: FilterGroup[]
}

export function MobileFilterDrawer({ filterGroups }: MobileFilterDrawerProps) {
  const { totalSelectedFilters, totalStagedFilters, clearFilters, applyFilters, isLoading } = useFilters()
  const [open, setOpen] = useState(false)

  const handleApplyFilters = () => {
    applyFilters()
    setOpen(false)
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {totalSelectedFilters > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalSelectedFilters}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {totalStagedFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                <FilterX className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="px-4 py-3 overflow-y-auto h-[calc(100vh-10rem)]">
          <FilterSidebar filterGroups={filterGroups} />
        </div>
        <SheetFooter className="px-4 py-3 border-t">
          <Button className="w-full" onClick={handleApplyFilters} disabled={isLoading}>
            <Check className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
