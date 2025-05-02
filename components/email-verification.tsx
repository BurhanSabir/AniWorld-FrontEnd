"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Mail } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface EmailVerificationProps {
  email: string
}

export function EmailVerification({ email }: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const handleResendEmail = async () => {
    try {
      setIsResending(true)
      setError("")

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) throw error

      toast({
        description: "Verification email has been resent",
      })
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email")
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
        <CardDescription className="text-center">
          We've sent a verification link to <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-center">
          <p className="text-muted-foreground">
            Please check your email and click the verification link to complete your registration.
          </p>
          <div className="flex items-center justify-center">
            <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
            <span className="text-sm">The email might take a few minutes to arrive</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button variant="outline" className="w-full" onClick={handleResendEmail} disabled={isResending}>
          {isResending ? "Sending..." : "Resend Verification Email"}
        </Button>
        <div className="text-center text-sm">
          Already verified?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
