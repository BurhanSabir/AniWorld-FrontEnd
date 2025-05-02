"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"

interface UserAvatarProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function UserAvatar({ className, size = "md" }: UserAvatarProps) {
  const { user } = useAuth()

  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const avatarSize = sizes[size]

  if (!user) {
    return null
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <Avatar className={avatarSize}>
      <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
      <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
    </Avatar>
  )
}
