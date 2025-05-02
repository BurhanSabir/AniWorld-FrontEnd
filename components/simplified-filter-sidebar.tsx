"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useFilters, type FilterGroup } from "@/context/filter-context"
import { cn } from "@/lib/utils"

interface SimplifiedFilterSidebarProps {
  filterGroups: FilterGroup[]
  className?: string
}

export function SimplifiedFilterSidebar({ filterGroups, className }: SimplifiedFilterSidebarProps) {
  const { filters, toggleFilter, setFilter, isFilterActive, getSelectedCount, clearFilter, isLoading } = useFilters()

  // Filter out only the requested filter types
  const allowedFilterTypes = ["genres", "status", "type", "season", "sort"]
  const visibleFilterGroups = filterGroups.filter((group) => allowedFilterTypes.includes(group.id))

  return (
    <div className={cn("rounded-xl bg-card/30 p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gradient">Filters</h3>
      </div>

      <div className="space-y-6">
        {visibleFilterGroups.map((group) => {
          const selectedCount = getSelectedCount(group.id)

          return (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{group.label}</h4>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {selectedCount}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {group.type === "checkbox" && group.options && (
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${group.id}-${option.id}`}
                          checked={isFilterActive(group.id, option.id)}
                          onCheckedChange={() => toggleFilter(group.id, option.id)}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor={`${group.id}-${option.id}`}
                          className="text-sm cursor-pointer hover:text-primary transition-colors"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {group.type === "radio" && group.options && (
                  <RadioGroup
                    value={(filters[group.id] as string) || ""}
                    onValueChange={(value) => setFilter(group.id, value)}
                    className="space-y-1"
                    disabled={isLoading}
                  >
                    {group.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.id}
                          id={`${group.id}-${option.id}`}
                          className="text-primary border-primary/50"
                        />
                        <Label
                          htmlFor={`${group.id}-${option.id}`}
                          className="text-sm cursor-pointer hover:text-primary transition-colors"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>

              {group !== visibleFilterGroups[visibleFilterGroups.length - 1] && <Separator className="mt-2" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
