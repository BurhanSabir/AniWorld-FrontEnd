"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AvatarUploadProps {
  userId: string
  url: string | null
  onUpload: (url: string) => void
  size?: "sm" | "md" | "lg" | "xl"
}

export function AvatarUpload({ userId, url, onUpload, size = "lg" }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const sizes = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  }

  const avatarSize = sizes[size]

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const filePath = `avatars/${userId}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

      onUpload(data.publicUrl)

      toast({
        description: "Avatar uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className={avatarSize}>
        <AvatarImage src={url || undefined} alt="Profile" />
        <AvatarFallback className="bg-primary/10 text-primary text-lg">{userId.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex items-center">
        <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary hover:underline flex items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Change Avatar"
          )}
        </Label>
        <Input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  )
}
