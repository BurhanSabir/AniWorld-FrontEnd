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
import { AlertCircle, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirmation) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      await signup(name, email, password)
      router.push("/anime")
    } catch (err) {
      setError("Failed to create an account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-b from-background to-background/80">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-transparent opacity-90"></div>
      <Card className="w-full max-w-md relative z-10 border-primary/20">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">Enter your information to create an account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">Confirm Password</Label>
              <Input
                id="passwordConfirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-gradient hover:opacity-90" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
