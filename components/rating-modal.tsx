"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"
import { useToast } from "@/hooks/use-toast"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number) => Promise<void>
  title: string
  initialRating?: number
}

export function RatingModal({ isOpen, onClose, onSubmit, title, initialRating = 0 }: RatingModalProps) {
  const [rating, setRating] = useState(initialRating)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(rating)
      toast({
        description: "Your rating has been submitted",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {title}</DialogTitle>
          <DialogDescription>
            Share your opinion by rating this title. Your rating helps others discover great content.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <StarRating initialRating={rating} onRatingChange={handleRatingChange} size="lg" className="space-x-2" />
          <p className="text-sm text-muted-foreground">
            {rating === 0
              ? "Select a rating"
              : rating === 1
                ? "Poor"
                : rating === 2
                  ? "Fair"
                  : rating === 3
                    ? "Good"
                    : rating === 4
                      ? "Very Good"
                      : "Excellent"}
          </p>
        </div>
        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
