"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Share2, Facebook, Twitter, Linkedin, LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SocialShareButtonProps {
  title: string
  url: string
  description?: string
  iconOnly?: boolean
  className?: string
}

export function SocialShareButton({
  title,
  url,
  description = "",
  iconOnly = false,
  className,
}: SocialShareButtonProps) {
  const [copied, setCopied] = useState(false)

  // Ensure URL is absolute
  const fullUrl = typeof window !== "undefined" ? new URL(url, window.location.origin).toString() : url

  const shareData = {
    title,
    text: description,
    url: fullUrl,
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.error("Error sharing:", error)
      }
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(title)}`,
      "_blank",
    )
  }

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
      "_blank",
    )
  }

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, "_blank")
  }

  if (iconOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full bg-black/70 p-1.5 text-white transition-all hover:bg-black/90"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={shareFacebook} className="cursor-pointer">
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareTwitter} className="cursor-pointer">
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareLinkedIn} className="cursor-pointer">
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
            <LinkIcon className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy Link"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("flex items-center gap-2", className)}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={shareFacebook} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTwitter} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareLinkedIn} className="cursor-pointer">
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <LinkIcon className="h-4 w-4 mr-2" />
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
