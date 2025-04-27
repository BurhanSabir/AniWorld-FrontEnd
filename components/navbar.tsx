"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, User, Search, X, Film, BookOpen, Bookmark, LogOut, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WatchlistCount } from "@/components/watchlist-count"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()

  const routes = [
    {
      href: "/anime",
      label: "Anime",
      icon: <Film className="h-4 w-4 mr-2" />,
      active: pathname === "/anime" || pathname.startsWith("/anime/"),
    },
    {
      href: "/manga",
      label: "Manga",
      icon: <BookOpen className="h-4 w-4 mr-2" />,
      active: pathname === "/manga" || pathname.startsWith("/manga/"),
    },
    {
      href: "/watchlist",
      label: "Watchlist",
      icon: <Bookmark className="h-4 w-4 mr-2" />,
      active: pathname === "/watchlist",
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const path = pathname.startsWith("/manga") ? "/manga" : "/anime"
      router.push(`${path}?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-background/90 backdrop-blur-md border-b border-border/40 shadow-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:px-8">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border/40">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gradient">AniWorld</span>
                </Link>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-base font-medium rounded-lg transition-colors",
                      route.active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {route.icon}
                    {route.label}
                    {route.href === "/watchlist" && <WatchlistCount />}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4 border-t border-border/40">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="font-medium">{user?.name || "User"}</div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-gradient">AniWorld</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex items-center space-x-1 ml-8">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  route.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="flex items-center">
                  {route.label}
                  {route.href === "/watchlist" && <WatchlistCount />}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Search and User Menu */}
        <div className="flex items-center ml-auto space-x-2">
          {/* Search Button/Form */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(isSearchOpen && "bg-muted")}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              <span className="sr-only">Search</span>
            </Button>

            {isSearchOpen && (
              <form
                onSubmit={handleSearch}
                className="absolute right-0 top-full mt-2 w-[280px] animate-fade-in glass-effect rounded-lg p-2 shadow-lg"
              >
                <div className="flex items-center">
                  <Input
                    type="search"
                    placeholder="Search anime or manga..."
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="ml-2">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start p-2 border-b border-border/40">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuItem className="cursor-pointer flex items-center" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-gradient hover:opacity-90">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
