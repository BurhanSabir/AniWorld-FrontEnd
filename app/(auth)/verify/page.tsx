"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { EmailVerification } from "@/components/email-verification"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function VerifyPage() {
  const [email, setEmail] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get email from local storage if available
    const storedEmail = localStorage.getItem("verificationEmail")
    if (storedEmail) {
      setEmail(storedEmail)
    }

    // Check if we have a token in the URL
    const token = searchParams.get("token")
    const type = searchParams.get("type")

    if (token && type === "signup") {
      handleVerification(token)
    }
  }, [searchParams])

  const handleVerification = async (token: string) => {
    try {
      setIsVerifying(true)

      // This is a placeholder - in a real app, you would verify the token with Supabase
      // For now, we'll just simulate a successful verification
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsVerified(true)
      toast({
        description: "Email verified successfully! You can now log in.",
      })

      // Clear the stored email
      localStorage.removeItem("verificationEmail")

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("Error verifying email:", error)
      toast({
        title: "Error",
        description: "Failed to verify your email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-b from-background to-background/80">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Verifying your email...</h2>
          <p className="text-muted-foreground">Please wait while we verify your email address.</p>
        </div>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-b from-background to-background/80">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Email Verified!</h2>
          <p className="text-muted-foreground">Your email has been successfully verified.</p>
          <Button asChild className="mt-4 bg-gradient hover:opacity-90">
            <a href="/login">Continue to Login</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-b from-background to-background/80">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-transparent opacity-90"></div>
      <div className="relative z-10 w-full max-w-md">
        <EmailVerification email={email} />
      </div>
    </div>
  )
}
