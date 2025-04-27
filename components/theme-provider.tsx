"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ThemeProviderProps } from "next-themes"

type Theme = "dark"

type ThemeContextType = {
  theme: Theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  // Force dark theme
  useEffect(() => {
    document.documentElement.classList.add("dark")
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <ThemeContext.Provider value={{ theme: "dark" }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
