"use client"

import { useState, useRef, useEffect } from "react"
import { LiveProvider, LivePreview, LiveError } from "react-live"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Code,
  Eye,
  Download,
  Copy,
  Plus,
  History,
  Settings,
  User,
  LogOut,
  Paperclip,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  code?: {
    jsx: string
    css: string
  }
}

interface Session {
  id: string
  name: string
  lastModified: Date
  messageCount: number
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your AI assistant for generating React components. Describe what you'd like to build, and I'll create it for you with live preview and clean code.",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentCode, setCurrentCode] = useState({
    jsx: `// Your generated component will appear here
export default function GeneratedComponent() {
  return (
    <div className="p-12 text-center bg-gray-50 min-h-full flex items-center justify-center">
      <div className="max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to ComponentAI
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Start a conversation to generate your first component!
        </p>
      </div>
    </div>
  )
}`,
    css: `/* Component styles will appear here */
.generated-component {
  /* Your custom styles */
}`,
  })
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      name: "Button Components",
      lastModified: new Date(Date.now() - 86400000),
      messageCount: 12,
    },
    {
      id: "2",
      name: "Card Layouts",
      lastModified: new Date(Date.now() - 172800000),
      messageCount: 8,
    },
    {
      id: "3",
      name: "Form Elements",
      lastModified: new Date(Date.now() - 259200000),
      messageCount: 15,
    },
  ])
  const [activeTab, setActiveTab] = useState("preview")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsGenerating(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/generate-component`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: inputMessage }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch component from backend")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: data.message || "Here is your generated component!",
        timestamp: new Date(),
        code: {
          jsx: data.component.jsx,
          css: data.component.css,
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
      setCurrentCode(assistantMessage.code!)
      setActiveTab("preview")
    } catch (error) {
      console.error("Error generating component:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant",
          content: "Sorry, there was an error generating your component.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode.jsx)
  }

  const handleDownloadCode = () => {
    const element = document.createElement("a")
    const file = new Blob([currentCode.jsx], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "component.jsx"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <Code className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-medium text-gray-900">ComponentAI</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-gray-200 text-gray-700">JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <Link href="/">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button className="w-full bg-black text-white hover:bg-gray-800 h-10">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <History className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Recent Sessions</span>
            </div>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate mb-1">{session.name}</h4>
                        <p className="text-xs text-gray-500">{session.messageCount} messages</p>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        {session.lastModified.toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="space-y-4">
            <Textarea
              placeholder="Describe the component you want to build..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="min-h-[100px] resize-none border-gray-200 focus:border-gray-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleFileUpload} className="text-gray-500">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isGenerating}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              console.log("File uploaded:", e.target.files?.[0])
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <ScrollArea className="h-full">
            <div className="p-8 space-y-8 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-2xl ${
                      message.type === "user" ? "bg-black text-white" : "bg-white border border-gray-200"
                    } rounded-2xl p-6 shadow-sm`}
                  >
                    <div className="flex items-start space-x-4">
                      {message.type === "assistant" && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className={`${message.type === "user" ? "text-white" : "text-gray-800"} leading-relaxed`}>
                          {message.content}
                        </p>
                        <p className={`text-xs mt-3 ${message.type === "user" ? "text-gray-300" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-gray-600 animate-spin" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Component Preview & Code */}
        <div className="h-96 border-t border-gray-200 bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="preview" className="flex items-center space-x-2 data-[state=active]:bg-white">
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger value="jsx" className="flex items-center space-x-2 data-[state=active]:bg-white">
                  <Code className="h-4 w-4" />
                  <span>JSX</span>
                </TabsTrigger>
                <TabsTrigger value="css" className="flex items-center space-x-2 data-[state=active]:bg-white">
                  <Code className="h-4 w-4" />
                  <span>CSS</span>
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={handleCopyCode} className="border-gray-200 bg-transparent">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCode}
                  className="border-gray-200 bg-transparent"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="preview" className="h-full m-0">
                <div className="h-full bg-gray-50 overflow-auto p-8">
                  <LiveProvider code={currentCode.jsx} noInline>
                    <div className="border rounded-lg bg-white p-6 min-h-[200px]">
                      <LivePreview />
                    </div>
                    <LiveError className="text-red-500 mt-2" />
                  </LiveProvider>
                </div>
              </TabsContent>

              <TabsContent value="jsx" className="h-full m-0">
                <ScrollArea className="h-full">
                  <pre className="p-8 text-sm bg-gray-900 text-gray-100 overflow-x-auto font-mono">
                    <code>{currentCode.jsx}</code>
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="css" className="h-full m-0">
                <ScrollArea className="h-full">
                  <pre className="p-8 text-sm bg-gray-900 text-gray-100 overflow-x-auto font-mono">
                    <code>{currentCode.css}</code>
                  </pre>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
