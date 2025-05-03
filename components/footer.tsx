import Link from "next/link"
import { Facebook, Twitter, Instagram, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-950 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-amber-500">Contact</h3>
            <p className="mb-2 text-gray-300">Email: contact@aniworld.com</p>
            <p className="mb-2 text-gray-300">Phone: +1 (123) 456-7890</p>
            <p className="mb-4 text-gray-300">Address: 123 Anime Street, Tokyo, Japan</p>
            <div className="flex space-x-4 mt-4">
              <Link href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-amber-500">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/" className="text-gray-300 hover:text-amber-500 transition-colors">
                Home
              </Link>
              <Link href="/anime" className="text-gray-300 hover:text-amber-500 transition-colors">
                Anime
              </Link>
              <Link href="/manga" className="text-gray-300 hover:text-amber-500 transition-colors">
                Manga
              </Link>
              <Link href="/watchlist" className="text-gray-300 hover:text-amber-500 transition-colors">
                Watchlist
              </Link>
              <Link href="/rated" className="text-gray-300 hover:text-amber-500 transition-colors">
                Rated
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-amber-500 transition-colors">
                Profile
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-amber-500 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-300 hover:text-amber-500 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} AniWorld. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
