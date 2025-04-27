import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"

export default function Loading() {
  return (
    <div className="space-y-8">
      <Button variant="ghost" disabled className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
        <Skeleton className="h-[450px] w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>

      {/* Characters Section Loading */}
      <div className="mt-8">
        <div className="mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          <h2 className="text-2xl font-bold">Characters</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
