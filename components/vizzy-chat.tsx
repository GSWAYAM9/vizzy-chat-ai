"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { ImageLightbox } from "@/components/image-lightbox"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sparkles, Plus, Sun, Moon, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import type { ChatMessage as ChatMessageType } from "@/lib/types"

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function isImageGenerationIntent(input: string): boolean {
  const lowerInput = input.toLowerCase()
  
  // Strong image generation keywords - these clearly indicate image creation
  const strongKeywords = [
    "generate", "create", "make", "draw", "paint", "design", "illustrate",
    "render", "show me", "imagine", "visualize", "picture of",
    "image of", "photo of", "artwork of", "concept art",
    "i want", "i need", "can you", "please make", "please generate",
    "please create", "please draw",
  ]
  
  // Weak keywords that need additional context - words that could be in chat
  const weakKeywords = ["style", "aesthetic", "vibe", "art", "character", "scene", "landscape"]
  
  // Check if it starts with clear generation intent
  const hasStrongIntent = strongKeywords.some((keyword) =>
    lowerInput.includes(keyword)
  )
  
  if (hasStrongIntent) {
    return true
  }
  
  // For weak keywords, require a strong generation verb nearby
  const hasWeakKeyword = weakKeywords.some((keyword) =>
    lowerInput.includes(keyword)
  )
  
  if (hasWeakKeyword) {
    // Only treat as image generation if paired with creation verbs
    const generationVerbs = ["in", "for", "of", "with", "a ", "the "]
    const beforeKeyword = generationVerbs.some((verb) => {
      const keywordIndex = lowerInput.indexOf("style") + 
                          lowerInput.indexOf("aesthetic") +
                          lowerInput.indexOf("vibe") +
                          lowerInput.indexOf("art") +
                          lowerInput.indexOf("character") +
                          lowerInput.indexOf("scene") +
                          lowerInput.indexOf("landscape")
      return keywordIndex > 0
    })
    
    // More conservative: only consider weak keywords as generation intent
    // if they're in the context of "create X in style Y" or similar
    const generationPatterns = [
      /create.*style/i,
      /generate.*style/i,
      /make.*style/i,
      /design.*style/i,
      /in.*style of/i,
      /style.*image/i,
      /make.*character/i,
      /create.*character/i,
      /design.*character/i,
    ]
    
    return generationPatterns.some((pattern) => pattern.test(lowerInput))
  }
  
  return false
}

function buildRefinedPrompt(messages: ChatMessageType[], newInput: string): string {
  const previousPrompts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .slice(-3)

  const previousImages = messages
    .filter((m) => m.role === "assistant" && m.images && m.images.length > 0)
    .slice(-1)

  const refinementWords = [
    "make it", "change", "more", "less", "add", "remove", "try",
    "darker", "brighter", "bigger", "smaller", "different", "same but",
    "like that but", "adjust", "modify", "keep", "turn it", "transform",
    "switch", "convert", "instead", "also", "but with", "now make",
    "could you", "can you", "please make", "update", "tweak",
  ]

  const isRefinement = refinementWords.some((word) =>
    newInput.toLowerCase().includes(word)
  )

  if (isRefinement && previousPrompts.length > 0 && previousImages.length > 0) {
    const lastImagePrompt =
      previousImages[0].images?.[0]?.prompt || previousPrompts[previousPrompts.length - 1]
    return `${lastImagePrompt}. Modification: ${newInput}`
  }

  return newInput
}

function parseNumImages(input: string): number {
  const patterns = [
    /(\d+)\s*(images?|versions?|variations?|options?|alternatives?|concepts?|ideas?|visuals?)/i,
    /generate\s*(\d+)/i,
    /create\s*(\d+)/i,
    /make\s*(\d+)/i,
    /show\s*(?:me\s*)?(\d+)/i,
    /give\s*(?:me\s*)?(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      return Math.min(Math.max(num, 1), 4)
    }
  }

  return 1
}

function generateAssistantText(numImages: number, prompt: string): string {
  if (numImages > 1) {
    return `Here are ${numImages} variations based on your vision:`
  }

  // Contextual responses based on intent
  const lowerPrompt = prompt.toLowerCase()
  if (lowerPrompt.includes("poster") || lowerPrompt.includes("signage"))
    return "Here's your design:"
  if (lowerPrompt.includes("product") || lowerPrompt.includes("photo"))
    return "Here's the product visual:"
  if (lowerPrompt.includes("brand") || lowerPrompt.includes("marketing"))
    return "Here's your brand visual:"
  if (lowerPrompt.includes("dream") || lowerPrompt.includes("emotion") || lowerPrompt.includes("feel"))
    return "Here's what I envisioned for you:"
  if (lowerPrompt.includes("story") || lowerPrompt.includes("scene"))
    return "Here's the scene I created:"
  if (lowerPrompt.includes("moodboard") || lowerPrompt.includes("vision board"))
    return "Here's your moodboard concept:"

  return "Here's what I created for you:"
}

export function VizzyChat() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxPrompt, setLightboxPrompt] = useState("")
  const [uploadedImage, setUploadedImage] = useState<{ url: string; fileName: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = useCallback(async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      content: trimmedInput,
      timestamp: Date.now(),
    }

    const assistantMessage: ChatMessageType = {
      id: generateId(),
      role: "assistant",
      content: "",
      isLoading: true,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsLoading(true)

    try {
      const isImageGen = isImageGenerationIntent(trimmedInput)
      console.log("[v0] User input:", trimmedInput)
      console.log("[v0] Is image generation intent:", isImageGen)
      
      // Check if user has uploaded an image and wants to enhance it
      const hasUploadedImage = uploadedImage !== null
      console.log("[v0] Has uploaded image:", hasUploadedImage)

      if (hasUploadedImage && trimmedInput) {
        // Image enhancement flow - enhance uploaded image based on user description
        const response = await fetch("/api/enhance-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: uploadedImage.url,
            prompt: trimmedInput,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to enhance image")
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: `I've enhanced your uploaded image based on: "${trimmedInput}"`,
                  images: [
                    {
                      url: data.enhancedImage.url,
                      prompt: trimmedInput,
                      isUploaded: true,
                    },
                  ],
                  uploadedImages: [
                    {
                      id: generateId(),
                      url: uploadedImage.url,
                      fileName: uploadedImage.fileName,
                      fileSize: 0,
                      uploadedAt: Date.now(),
                    },
                  ],
                  isLoading: false,
                }
              : m
          )
        )
        
        // Clear uploaded image after enhancement
        setUploadedImage(null)
      } else if (isImageGen) {
        // Image generation flow
        const refinedPrompt = buildRefinedPrompt(
          [...messages, userMessage],
          trimmedInput
        )
        const numResults = parseNumImages(trimmedInput)

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: refinedPrompt,
            aspect_ratio: aspectRatio,
            num_results: numResults,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate image")
        }

        const assistantText = generateAssistantText(data.images.length, refinedPrompt)

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: assistantText,
                  images: data.images.map((img: { url: string; seed?: number }) => ({
                    url: img.url,
                    prompt: refinedPrompt,
                    seed: img.seed,
                  })),
                  isLoading: false,
                }
              : m
          )
        )
      } else {
        // LLM chat flow
        console.log("[v0] Using LLM chat flow")
        const conversationMessages = [
          ...messages,
          userMessage,
        ].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        console.log("[v0] Sending to chat API:", conversationMessages.length, "messages")
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversationMessages }),
        })

        const data = await response.json()
        console.log("[v0] Chat API response status:", response.status)
        console.log("[v0] Chat API response:", data)

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate response")
        }

        console.log("[v0] Chat response content:", data.content)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: data.content,
                  isLoading: false,
                }
              : m
          )
        )
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: "", isLoading: false, error: errorMessage }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, aspectRatio, uploadedImage])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion)
  }, [])

  const handleRetry = useCallback(
    (messageId: string) => {
      const msgIndex = messages.findIndex((m) => m.id === messageId)
      if (msgIndex < 1) return
      const userMsg = messages[msgIndex - 1]
      if (userMsg.role !== "user") return
      setInput(userMsg.content)
      setMessages((prev) => prev.filter((_, i) => i < msgIndex - 1))
    },
    [messages]
  )

  const handleNewChat = useCallback(() => {
    setMessages([])
    setInput("")
    setIsLoading(false)
    setLightboxImage(null)
  }, [])

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Premium Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/60 bg-card/60 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="relative size-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Sparkles className="size-[18px] text-accent" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold font-[family-name:var(--font-heading)] text-foreground tracking-tight leading-none">
              Vizzy
            </h1>
            <span className="text-[10px] text-muted-foreground/70 tracking-wide uppercase leading-none mt-0.5">
              Creative Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasMessages && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleNewChat}
                    className="text-muted-foreground hover:text-foreground rounded-xl"
                    aria-label="New conversation"
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New chat</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleNewChat}
                    className="text-muted-foreground hover:text-destructive rounded-xl"
                    aria-label="Clear conversation"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear chat</TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-muted-foreground hover:text-foreground rounded-xl"
                aria-label="Toggle theme"
              >
                <Sun className="size-4 hidden dark:block" />
                <Moon className="size-4 block dark:hidden" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle theme</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {!hasMessages ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="flex flex-col gap-5 py-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onImageClick={(url, prompt) => {
                  setLightboxImage(url)
                  setLightboxPrompt(prompt)
                }}
                onRetry={
                  message.error ? () => handleRetry(message.id) : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pb-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          uploadedImage={uploadedImage}
          onImageUpload={(imageUrl) => {
            setUploadedImage({
              url: imageUrl,
              fileName: 'uploaded-image.png',
            })
          }}
          onImageRemove={() => setUploadedImage(null)}
        />
      </div>

      {/* Lightbox */}
      <ImageLightbox
        imageUrl={lightboxImage}
        prompt={lightboxPrompt}
        onClose={() => {
          setLightboxImage(null)
          setLightboxPrompt("")
        }}
      />
    </div>
  )
}
