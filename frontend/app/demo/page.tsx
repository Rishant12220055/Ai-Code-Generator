import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, ArrowLeft, Sparkles, Play } from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <Code className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-medium text-gray-900">ComponentAI Demo</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              Live Demo
            </Badge>
          </div>
        </div>
      </header>

      {/* Demo Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">See ComponentAI in Action</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Watch how easy it is to generate, preview, and export React components using natural language.
            </p>
          </div>

          {/* Demo Video/Screenshot Placeholder */}
          <div className="mb-16">
            <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Play className="h-10 w-10 text-white ml-1" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">Interactive Demo</h3>
                <p className="text-gray-600 mb-6 text-lg">Experience the full ComponentAI workflow</p>
                <Link href="/signup">
                  <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3">Try It Now</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Demo Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-gray-700 font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Describe Your Component</h3>
              <p className="text-gray-600 leading-relaxed">
                Simply tell our AI what you want to build: "Create a modern button with hover effects" or "Build a
                responsive card layout"
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-gray-700 font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Preview Instantly</h3>
              <p className="text-gray-600 leading-relaxed">
                Watch your component come to life in our secure sandbox environment with real-time rendering and
                interaction
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-gray-700 font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Export & Use</h3>
              <p className="text-gray-600 leading-relaxed">
                Copy the clean, production-ready code or download a complete package ready for your project
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gray-50 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start building?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already using ComponentAI
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/signup">
                <Button size="lg" className="bg-black text-white hover:bg-gray-800 px-8 py-4">
                  Get Started Free
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="px-8 py-4 border-gray-200 bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
