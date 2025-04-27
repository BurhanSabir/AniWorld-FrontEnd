"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useFilters, type FilterGroup } from "@/context/filter-context"
import { ChevronDown, ChevronRight, FilterX, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface FilterSidebarProps {
  filterGroups: FilterGroup[]
  className?: string
}

export function FilterSidebar({ filterGroups, className }: FilterSidebarProps) {
  const {
    filters,
    stagedFilters,
    setStagedFilter,
    applyFilters,
    clearFilters,
    clearFilter,
    toggleStagedFilter,
    isFilterActive,
    isStagedFilterActive,
    getSelectedCount,
    getStagedSelectedCount,
    totalSelectedFilters,
    totalStagedFilters,
    isLoading,
  } = useFilters()

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(filterGroups.map((group) => [group.id, true])),
  )

  const isMobile = useMobile()

  // Check if there are any changes between active and staged filters
  const hasFilterChanges = () => {
    // Compare total counts first for a quick check
    if (totalSelectedFilters !== totalStagedFilters) return true

    // Deep comparison of filters and stagedFilters
    for (const key in filters) {
      const filterValue = filters[key]
      const stagedValue = stagedFilters[key]

      if (Array.isArray(filterValue) && Array.isArray(stagedValue)) {
        if (filterValue.length !== stagedValue.length) return true
        for (const item of filterValue) {
          if (!stagedValue.includes(item)) return true
        }
      } else if (filterValue !== stagedValue) {
        return true
      }
    }

    // Check for new filters in staged that aren't in active
    for (const key in stagedFilters) {
      if (filters[key] === undefined && stagedFilters[key] !== undefined) {
        return true
      }
    }

    return false
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  return (
    <div className={cn("flex flex-col space-y-4 rounded-lg", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        {totalSelectedFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            <FilterX className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <Separator className="bg-border/60" />

      <div className="space-y-4">
        {filterGroups.map((group) => {
          const selectedCount = getSelectedCount(group.id)
          const stagedSelectedCount = getStagedSelectedCount(group.id)
          const isExpanded = expandedGroups[group.id]

          return (
            <div key={group.id} className="pb-2">
              <div
                className="flex items-center justify-between cursor-pointer py-1"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center">
                  {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                  <h4 className="font-medium">{group.label}</h4>
                  {stagedSelectedCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stagedSelectedCount}
                    </Badge>
                  )}
                </div>

                {stagedSelectedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearFilter(group.id)
                    }}
                    className="h-6 w-6 rounded-full hover:bg-muted"
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear {group.label} filter</span>
                  </Button>
                )}
              </div>

              {isExpanded && (
                <div className="mt-2 pl-5 space-y-2">
                  {group.type === "checkbox" && group.options && (
                    <div className="space-y-1">
                      {group.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${group.id}-${option.id}`}
                            checked={isStagedFilterActive(group.id, option.id)}
                            onCheckedChange={() => toggleStagedFilter(group.id, option.id)}
                            disabled={isLoading}
                          />
                          <Label htmlFor={`${group.id}-${option.id}`} className="text-sm cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {group.type === "radio" && group.options && (
                    <RadioGroup
                      value={(stagedFilters[group.id] as string) || ""}
                      onValueChange={(value) => setStagedFilter(group.id, value)}
                      className="space-y-1"
                      disabled={isLoading}
                    >
                      {group.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={`${group.id}-${option.id}`} />
                          <Label htmlFor={`${group.id}-${option.id}`} className="text-sm cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {group.type === "select" && group.options && (
                    <Select
                      value={(stagedFilters[group.id] as string) || ""}
                      onValueChange={(value) => setStagedFilter(group.id, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${group.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {group.options.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {group.type === "range" && group.min !== undefined && group.max !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{group.min}</span>
                        <span>{group.max}</span>
                      </div>
                      <Slider
                        defaultValue={[(stagedFilters[group.id] as number) || group.min]}
                        min={group.min}
                        max={group.max}
                        step={group.step || 1}
                        onValueChange={(values) => setStagedFilter(group.id, values[0])}
                        disabled={isLoading}
                      />
                      <div className="text-center text-sm">Current: {stagedFilters[group.id] || group.min}</div>
                    </div>
                  )}
                </div>
              )}

              {group !== filterGroups[filterGroups.length - 1] && <Separator className="mt-2" />}
            </div>
          )
        })}
      </div>

      {/* Apply Filters Button */}
      <div className="pt-2">
        <Button className="w-full" onClick={applyFilters} disabled={!hasFilterChanges() || isLoading}>
          <Check className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
