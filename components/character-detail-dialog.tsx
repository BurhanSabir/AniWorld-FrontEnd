"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { Character } from "@/lib/api/anilist"

interface CharacterDetailDialogProps {
  character: Character | null
  isOpen: boolean
  onClose: () => void
}

export function CharacterDetailDialog({ character, isOpen, onClose }: CharacterDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Set loading state when character changes
    if (character) {
      setIsLoading(true)
      // Simulate loading delay for character details
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [character])

  if (!character) return null

  // Format birthday if available
  const formatBirthday = () => {
    if (!character.dateOfBirth) return null
    const { year, month, day } = character.dateOfBirth
    if (!month || !day) return null

    try {
      const date = new Date(year || 0, month - 1, day)
      return format(date, year ? "MMMM d, yyyy" : "MMMM d")
    } catch (e) {
      return null
    }
  }

  const birthday = formatBirthday()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{character.name}</DialogTitle>
          {character.nativeName && <DialogDescription>{character.nativeName}</DialogDescription>}
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-[150px_1fr]">
            <Skeleton className="h-[225px] w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-[150px_1fr]">
              <div className="relative aspect-[2/3] w-full max-w-[150px] overflow-hidden rounded-md mx-auto sm:mx-0">
                <Image
                  src={character.image || "/placeholder.svg?height=225&width=150"}
                  alt={character.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 150px, 150px"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Role</h4>
                  <Badge variant="secondary">{character.role}</Badge>
                </div>

                {(character.gender || character.age || birthday) && (
                  <div className="space-y-1">
                    {character.gender && (
                      <div className="text-sm">
                        <span className="font-medium">Gender:</span> {character.gender}
                      </div>
                    )}
                    {character.age && (
                      <div className="text-sm">
                        <span className="font-medium">Age:</span> {character.age}
                      </div>
                    )}
                    {birthday && (
                      <div className="text-sm">
                        <span className="font-medium">Birthday:</span> {birthday}
                      </div>
                    )}
                  </div>
                )}

                {character.voiceActors && character.voiceActors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Voice Actors</h4>
                    <div className="space-y-2">
                      {character.voiceActors.map((va) => (
                        <div key={va.id} className="flex items-center space-x-2">
                          {va.image && (
                            <div className="relative h-8 w-8 flex-shrink-0">
                              <Image
                                src={va.image || "/placeholder.svg"}
                                alt={va.name}
                                fill
                                className="rounded-full object-cover"
                                sizes="32px"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium">{va.name}</div>
                            <div className="text-xs text-muted-foreground">{va.nativeName}</div>
                          </div>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {va.language}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {character.description && (
              <>
                <Separator />
                <div className="max-h-[200px] overflow-y-auto">
                  <h4 className="font-medium mb-2">Background</h4>
                  <div
                    className="text-sm prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: character.description }}
                  />
                </div>
              </>
            )}
          </>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
