"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, User, Film, BookOpen, Bookmark, Star, LogOut, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WatchlistCount } from "@/components/watchlist-count"
import { UserAvatar } from "@/components/user-avatar"

export function Navbar() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)

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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-background/90 backdrop-blur-md shadow-md" : "bg-transparent",
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
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
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
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
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

        {/* Right Side: User Navigation */}
        <div className="flex items-center ml-auto space-x-1">
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
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
