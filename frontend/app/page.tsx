import { Button } from "@/components/ui/button"
import { Code, Zap, Users, Download, ChevronDown } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <Code className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-medium text-gray-900">ComponentAI</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 cursor-pointer">
                <span>Features</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 cursor-pointer">
                <span>Examples</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <span className="text-gray-700 hover:text-gray-900 cursor-pointer">Pricing</span>
              <span className="text-gray-700 hover:text-gray-900 cursor-pointer">Docs</span>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hidden sm:inline-flex">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-black text-white hover:bg-gray-800 text-sm sm:text-base">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Build, <span className="text-gray-500">generate,</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
              <span className="text-gray-500">export</span> components
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Your AI-powered micro-frontend playground. Generate React components through natural conversation, preview
              them instantly, and export production-ready code.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
              <Link href="/signup">
                <Button size="lg" className="bg-black text-white hover:bg-gray-800 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto">
                  Start Building
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-gray-300 bg-transparent w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating Elements - Hidden on mobile for better alignment */}
          <div className="hidden lg:block absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="hidden lg:block absolute top-40 right-32 w-6 h-6 bg-purple-400 rounded-full animate-bounce delay-300"></div>
          <div className="hidden lg:block absolute bottom-32 left-1/4 w-3 h-3 bg-green-400 rounded-full animate-bounce delay-700"></div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              From conversation to code, our platform handles the entire component generation workflow
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Code className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Generation</h3>
              <p className="text-gray-600 leading-relaxed">
                Describe your component in natural language and watch AI generate clean, production-ready React code.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Live Preview</h3>
              <p className="text-gray-600 leading-relaxed">
                See your components come to life instantly with our secure micro-frontend sandbox environment.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Session Persistence</h3>
              <p className="text-gray-600 leading-relaxed">
                Never lose your work. All chat history, code, and UI state is automatically saved and restored.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Download className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Export</h3>
              <p className="text-gray-600 leading-relaxed">
                Export your components as clean JSX/TSX files or download complete project packages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Ready to build amazing components?</h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Join thousands of developers who are already using ComponentAI to accelerate their React development
            workflow.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-black text-white hover:bg-gray-800 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <Code className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-medium text-gray-900">ComponentAI</span>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">© 2024 ComponentAI. Built with Next.js and AI magic.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
