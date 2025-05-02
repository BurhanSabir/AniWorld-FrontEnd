"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, LogIn, Mail } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { login, loading, resendConfirmationEmail } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    setError("")
    setShowConfirmationMessage(false)
    setIsSubmitting(true)

    try {
      await login(email, password)
      router.push("/anime")
    } catch (err: any) {
      // Check if the error is about email confirmation
      if (err.message && err.message.toLowerCase().includes("confirm your account")) {
        setError(err.message)
        setShowConfirmationMessage(true)
      } else {
        setError(err.message || "Invalid email or password")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address to resend the confirmation email")
      return
    }

    try {
      setIsResendingEmail(true)
      await resendConfirmationEmail(email)
    } catch (err: any) {
      // Error is handled in the auth context with toast
    } finally {
      setIsResendingEmail(false)
    }
  }

  // Determine if button should be disabled
  const isButtonDisabled = loading || isSubmitting || isResendingEmail

  // Determine button text
  const getButtonText = () => {
    if (isSubmitting) return "Logging in..."
    if (loading && !isSubmitting) return "Please wait..."
    return "Login"
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-b from-background to-background/80">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-transparent opacity-90"></div>
      <Card className="w-full max-w-md relative z-10 border-primary/20">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {showConfirmationMessage ? (
              <Alert className="bg-amber-500/10 border-amber-500/50 text-amber-500">
                <Mail className="h-4 w-4" />
                <AlertTitle>Email Confirmation Required</AlertTitle>
                <AlertDescription className="mt-2">
                  Your account needs to be verified. Please check your email for a confirmation link.
                </AlertDescription>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleResendConfirmation}
                    disabled={isResendingEmail}
                  >
                    {isResendingEmail ? "Sending..." : "Resend Confirmation Email"}
                  </Button>
                </div>
              </Alert>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              disabled={isButtonDisabled}
            >
              {getButtonText()}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
