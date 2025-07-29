"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Code, Github, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Make API call to backend
    try {
      const response = await fetch("http://localhost:5000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Store tokens in localStorage or cookies
      localStorage.setItem("accessToken", data.data.tokens.accessToken)
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      // Ensure error is of type Error
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert("An unknown error occurred.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-12">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
            <Code className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-medium text-gray-900">ComponentAI</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account to continue building</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-200 focus:border-gray-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-gray-200 focus:border-gray-400"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-black text-white hover:bg-gray-800 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 border-gray-200 hover:bg-gray-50 bg-transparent">
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </Button>
            <Button variant="outline" className="h-12 border-gray-200 hover:bg-gray-50 bg-transparent">
              <Mail className="mr-2 h-5 w-5" />
              Google
            </Button>
          </div>

          <div className="text-center mt-8">
            <span className="text-gray-600">{"Don't have an account? "}</span>
            <Link href="/signup" className="text-black hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
