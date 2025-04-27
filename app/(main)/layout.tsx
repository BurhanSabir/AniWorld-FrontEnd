import type React from "react"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8 md:px-8 lg:px-10">{children}</main>
      <Toaster />
    </div>
  )
}
