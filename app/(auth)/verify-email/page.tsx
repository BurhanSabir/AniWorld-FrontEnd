"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending")
  const { resendConfirmationEmail } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  // Check if user is already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        setIsVerifying(true)

        // Check if we have a session already
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          setVerificationStatus("success")

          // Redirect after a short delay to show success message
          setTimeout(() => {
            router.push("/anime")
          }, 2000)
        } else {
          setVerificationStatus("pending")
        }
      } catch (error) {
        console.error("Error checking verification status:", error)
        setVerificationStatus("pending")
      } finally {
        setIsVerifying(false)
      }
    }

    checkVerificationStatus()
  }, [])

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend the verification email",
        variant: "destructive",
      })
      return
    }

    try {
      setIsResending(true)
      await resendConfirmationEmail(email)
    } catch (error: any) {
      // Error is handled in the auth context with toast
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-b from-background to-background/80">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-transparent opacity-90"></div>
      <Card className="w-full max-w-md relative z-10 border-primary/20">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isVerifying ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : verificationStatus === "success" ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
          </div>

          {verificationStatus === "success" ? (
            <>
              <CardTitle className="text-2xl font-bold text-center text-green-500">Email Verified!</CardTitle>
              <CardDescription className="text-center">
                Your email has been successfully verified. You will be redirected to the homepage shortly.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
              <CardDescription className="text-center">
                We've sent a verification email to your inbox. Please check and click the link to activate your account.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {verificationStatus === "pending" && (
          <>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-md border border-green-100 dark:border-green-900">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-300">What to do next:</h3>
                    <ul className="mt-1 text-sm text-green-700 dark:text-green-400 list-disc list-inside">
                      <li>Check your email inbox</li>
                      <li>Click the verification link in the email</li>
                      <li>Return to AniWorld and log in</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive an email? Enter your address to resend:</p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={handleResendEmail}
                className="w-full bg-gradient hover:opacity-90"
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Return to Login
                </Link>
              </div>
            </CardFooter>
          </>
        )}

        {verificationStatus === "success" && (
          <CardFooter className="flex flex-col space-y-4">
            <Button onClick={() => router.push("/anime")} className="w-full bg-gradient hover:opacity-90">
              Go to Homepage
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
