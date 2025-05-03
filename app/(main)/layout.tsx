import type React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-8">{children}</main>
      <Footer />
    </div>
  )
}
