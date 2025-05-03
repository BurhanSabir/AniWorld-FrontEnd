"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Copy, Facebook, Instagram, Share2, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"

interface SocialShareButtonProps {
  title: string
  url: string
  description?: string
  className?: string
  iconOnly?: boolean
}

export function SocialShareButton({ title, url, description, className, iconOnly = false }: SocialShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  // Ensure we have absolute URLs for sharing
  const shareUrl = url.startsWith("http") ? url : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`

  // Prepare share URLs for different platforms
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
  const instagramShareUrl = `https://www.instagram.com/` // Instagram doesn't support direct sharing, but we'll open the app

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const handleShare = async (e: React.MouseEvent, platform: string) => {
    e.preventDefault()
    e.stopPropagation()

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
  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={iconOnly ? "icon" : "sm"}
          className={cn(
            "rounded-full bg-black/70 hover:bg-black/90 text-white",
            iconOnly ? "p-1.5" : "px-2 py-1 text-xs",
            className,
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <Share2 className={cn("transition-transform", iconOnly ? "h-4 w-4" : "h-3 w-3 mr-1")} />
          {!iconOnly && "Share"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-none"
              onClick={(e) => handleShare(e, "facebook")}
            >
              <Facebook className="h-4 w-4" />
              <span className="sr-only">Share on Facebook</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-sky-500 hover:bg-sky-600 text-white border-none"
              onClick={(e) => handleShare(e, "twitter")}
            >
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Share on Twitter</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 hover:opacity-90 text-white border-none"
              onClick={(e) => handleShare(e, "instagram")}
            >
              <Instagram className="h-4 w-4" />
              <span className="sr-only">Share on Instagram</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                copied
                  ? "bg-green-500 text-white border-green-500 hover:bg-green-600 hover:text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700",
              )}
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy link</span>
            </Button>
          </div>

          {navigator.share && (
            <Button size="sm" className="w-full bg-gradient hover:opacity-90 text-xs" onClick={handleNativeShare}>
              <Share2 className="mr-1 h-3 w-3" />
              Share via...
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
