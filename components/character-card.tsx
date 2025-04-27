"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Character } from "@/lib/api/anilist"

interface CharacterCardProps {
  character: Character
  onClick: () => void
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-md hover:shadow-primary/5 cursor-pointer border-border/60"
      onClick={onClick}
    >
      <div className="flex h-full">
        <div className="relative h-24 w-20 flex-shrink-0">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0">
              <Skeleton className="h-full w-full" />
            </div>
          )}
          <Image
            src={
              imageError
                ? "/placeholder.svg?height=96&width=80"
                : character.image || "/placeholder.svg?height=96&width=80"
            }
            alt={character.name}
            fill
            className="object-cover"
            sizes="80px"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
        <CardContent className="flex flex-col justify-center p-3">
          <h4 className="font-medium line-clamp-1">{character.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{character.nativeName}</p>
          <Badge variant="outline" className="mt-1 w-fit text-xs">
            {character.role}
          </Badge>
        </CardContent>
      </div>
    </Card>
  )
}
