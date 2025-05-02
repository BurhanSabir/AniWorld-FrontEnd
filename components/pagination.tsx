"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showPageNumbers?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showPageNumbers = true,
}: PaginationProps) {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Maximum number of page buttons to show

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than or equal to maxPagesToShow, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of page range
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're at the start or end
      if (currentPage <= 2) {
        endPage = 3
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2
      }

      // Add ellipsis before middle pages if needed
      if (startPage > 2) {
        pageNumbers.push("ellipsis-start")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis after middle pages if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-end")
      }

      // Always include last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="rounded-full hover:bg-primary/10 hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {showPageNumbers &&
        getPageNumbers().map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <Button
                key={`ellipsis-${index}`}
                variant="ghost"
                size="icon"
                disabled
                className="cursor-default"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
              className={cn(
                "rounded-full w-8 h-8",
                currentPage === page ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary",
              )}
            >
              {page}
            </Button>
          )
        })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="rounded-full hover:bg-primary/10 hover:text-primary"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
