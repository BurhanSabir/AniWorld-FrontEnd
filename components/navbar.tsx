"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, User, Film, BookOpen, Bookmark, Star, LogOut, LogIn, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WatchlistCount } from "@/components/watchlist-count"
import { UserAvatar } from "@/components/user-avatar"
import { Input } from "@/components/ui/input"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Initialize search query from URL on component mount
  useEffect(() => {
    const query = searchParams.get("search") || ""
    setSearchQuery(query)
  }, [searchParams])

  // Focus search input when mobile search is opened
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isMobileSearchOpen])

  const mainRoutes = [
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
  ]

  const userRoutes = [
    {
      href: "/watchlist",
      label: "Watchlist",
      icon: <Bookmark className="h-4 w-4 mr-2" />,
      active: pathname === "/watchlist",
      badge: <WatchlistCount className="ml-2" />,
    },
    {
      href: "/rated",
      label: "Rated",
      icon: <Star className="h-4 w-4 mr-2" />,
      active: pathname === "/rated",
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
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery) {
      // Determine if we're on an anime or manga page to maintain context
      const routePrefix = pathname.startsWith("/manga") ? "/manga" : "/anime"
      router.push(`${routePrefix}?search=${encodeURIComponent(trimmedQuery)}`)
    }

    // On mobile, close the search after submitting
    if (window.innerWidth < 768) {
      setIsMobileSearchOpen(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    // Determine if we're on an anime or manga page to maintain context
    const routePrefix = pathname.startsWith("/manga") ? "/manga" : "/anime"
    router.push(routePrefix)

    // Focus back on the input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-background/90 backdrop-blur-md shadow-md" : "bg-background",
      )}
    >
      <div className="container flex h-16 items-center">
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
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
                    AniWorld
                  </span>
                </Link>
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="px-4 py-2 text-sm font-medium text-muted-foreground">Main</p>
                {mainRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-base font-medium rounded-lg transition-colors",
                      route.active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {route.icon}
                    {route.label}
                  </Link>
                ))}

                <p className="px-4 py-2 mt-4 text-sm font-medium text-muted-foreground">Collections</p>
                {userRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-base font-medium rounded-lg transition-colors",
                      route.active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {route.icon}
                    {route.label}
                    {route.badge}
                  </Link>
                ))}
              </div>
              <div className="mt-auto p-4 border-t border-border/40">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <UserAvatar size="sm" />
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
                  <Button asChild className="w-full bg-gradient hover:opacity-90">
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
        <Link href="/" className="flex items-center mr-6">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
            AniWorld
          </span>
        </Link>

        {/* Main Navigation */}
        <nav className="hidden md:flex md:items-center space-x-1">
          {mainRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                route.active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 mx-4">
          <form onSubmit={handleSearch} className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search anime..."
                className="pl-9 pr-9 h-9 rounded-full border-border/50 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Icon - Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto mr-2"
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Right Side: User Navigation */}
        <div className="flex items-center space-x-1">
          {/* User Routes (Watchlist, Rated) */}
          <nav className="hidden md:flex md:items-center space-x-1 mr-2">
            {userRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  route.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <span className="flex items-center">
                  {route.label}
                  {route.badge}
                </span>
              </Link>
            ))}
          </nav>

          {/* User Menu or Login */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <UserAvatar size="sm" />
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
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 animate-slide-in">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search anime..."
                className="pl-9 pr-9 h-9 rounded-full border-border/50 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
                autoFocus
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
