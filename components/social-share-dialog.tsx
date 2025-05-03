"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy, Facebook, Instagram, Share2, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"

interface SocialShareDialogProps {
  title: string
  url: string
  image?: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function SocialShareDialog({ title, url, image, description, children, className }: SocialShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  // Ensure we have absolute URLs for sharing
  const shareUrl = url.startsWith("http") ? url : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`

  // Prepare share URLs for different platforms
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
  const instagramShareUrl = `https://www.instagram.com/` // Instagram doesn't support direct sharing, but we'll open the app

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const handleShare = async (platform: string) => {
    let shareUrl: string

    switch (platform) {
      case "facebook":
        shareUrl = facebookShareUrl
        break
      case "twitter":
        shareUrl = twitterShareUrl
        break
      case "instagram":
        shareUrl = instagramShareUrl
        break
      default:
        return
    }

    window.open(shareUrl, "_blank")
    setOpen(false)
  }

  // Use Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
        setOpen(false)
      } catch (err) {
        console.error("Error sharing:", err)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className={cn("flex items-center gap-2", className)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share this {url.includes("/anime/") ? "anime" : "manga"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-4 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 bg-blue-500 hover:bg-blue-600 text-white border-none"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Share on Facebook</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 bg-sky-500 hover:bg-sky-600 text-white border-none"
              onClick={() => handleShare("twitter")}
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Share on Twitter</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 hover:opacity-90 text-white border-none"
              onClick={() => handleShare("instagram")}
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Share on Instagram</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="flex-1" onClick={(e) => e.currentTarget.select()} />
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "transition-all",
                copied && "bg-green-500 text-white border-green-500 hover:bg-green-600 hover:text-white",
              )}
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy link</span>
            </Button>
          </div>

          {navigator.share && (
            <Button onClick={handleNativeShare} className="w-full bg-gradient hover:opacity-90">
              <Share2 className="mr-2 h-4 w-4" />
              Share via...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
