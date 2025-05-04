import type React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DatabaseInitializer } from "@/components/database-initializer"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:px-8 lg:px-10">
        <DatabaseInitializer />
        {children}
      </main>
      <Footer />
    </div>
  )
}
