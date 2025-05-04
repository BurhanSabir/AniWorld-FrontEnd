import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DatabaseHealthCheck } from "@/components/database-health-check"

export function Footer() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-gradient">AniWorld</h2>
            <p className="text-muted-foreground mb-4">
              Your ultimate destination for anime and manga discovery. Track your favorites, rate what you've watched,
              and find new series to enjoy.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                  </svg>
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href="https://discord.com" target="_blank" rel="noopener noreferrer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M9 12h.01M15 12h.01M8.5 17H9l1 2h4l1-2h.5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-10a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z"></path>
                    <path d="M9 12c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z"></path>
                    <path d="M15 12c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z"></path>
                  </svg>
                  <span className="sr-only">Discord</span>
                </Link>
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/anime" className="text-muted-foreground hover:text-foreground transition-colors">
                  Anime
                </Link>
              </li>
              <li>
                <Link href="/manga" className="text-muted-foreground hover:text-foreground transition-colors">
                  Manga
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-muted-foreground hover:text-foreground transition-colors">
                  Watchlist
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/database-tools" className="text-muted-foreground hover:text-foreground transition-colors">
                  Database Tools
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/rated" className="text-muted-foreground hover:text-foreground transition-colors">
                  Rated Items
                </Link>
              </li>
              <li>
                <a
                  href="https://anilist.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AniList API
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AniWorld. All rights reserved.</p>
          <DatabaseHealthCheck />
        </div>
      </div>
    </footer>
  )
}
