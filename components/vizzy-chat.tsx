"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { ImageLightbox } from "@/components/image-lightbox"
import { Sparkles } from "lucide-react"
import type { ChatMessage as ChatMessageType } from "@/lib/types"

const SUGGESTIONS = [
  "A serene Japanese garden at sunset with cherry blossoms",
  "Futuristic cityscape with neon lights and flying cars",
  "Oil painting of a cozy cabin in a snowy forest",
  "Minimalist product photo of a glass perfume bottle",
  "Watercolor illustration of a hot air balloon festival",
  "Cyberpunk portrait of a woman with neon face paint",
]

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildRefinedPrompt(messages: ChatMessageType[], newInput: string): string {
  // Look at the conversation history to build context
  const previousPrompts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .slice(-3) // Last 3 user messages for context

  const previousImages = messages
    .filter((m) => m.role === "assistant" && m.images && m.images.length > 0)
    .slice(-1)

  // If user is making a refinement request (short message, references previous)
  const refinementWords = [
    "make it",
    "change",
    "more",
    "less",
    "add",
    "remove",
    "try",
    "darker",
    "brighter",
    "bigger",
    "smaller",
    "different",
    "same but",
    "like that but",
    "adjust",
    "modify",
    "keep",
  ]

  const isRefinement = refinementWords.some((word) =>
    newInput.toLowerCase().includes(word)
  )

  if (isRefinement && previousPrompts.length > 0 && previousImages.length > 0) {
    const lastImagePrompt = previousImages[0].images?.[0]?.prompt || previousPrompts[previousPrompts.length - 1]
    return `${lastImagePrompt}. Modification: ${newInput}`
  }

  return newInput
}

function parseNumImages(input: string): number {
  const patterns = [
    /(\d+)\s*(images?|versions?|variations?|options?|alternatives?)/i,
    /generate\s*(\d+)/i,
    /create\s*(\d+)/i,
    /make\s*(\d+)/i,
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

export function VizzyChat() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxPrompt, setLightboxPrompt] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: numResults > 1
                  ? `Here are ${data.images.length} variations for you:`
                  : "Here's what I created for you:",
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: "",
                isLoading: false,
                error: errorMessage,
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, aspectRatio])

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInput(suggestion)
      // Small delay then submit
      setTimeout(() => {
        setInput(suggestion)
      }, 0)
    },
    []
  )

  const handleRetry = useCallback(
    (messageId: string) => {
      const failedAssistant = messages.find((m) => m.id === messageId)
      if (!failedAssistant) return

      // Find the user message before this assistant message
      const msgIndex = messages.findIndex((m) => m.id === messageId)
      if (msgIndex < 1) return
      const userMsg = messages[msgIndex - 1]
      if (userMsg.role !== "user") return

      setInput(userMsg.content)
      // Remove the failed messages
      setMessages((prev) => prev.filter((_, i) => i < msgIndex - 1))
    },
    [messages]
  )

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles className="size-4 text-accent-foreground" />
          </div>
          <h1 className="text-base font-semibold font-[family-name:var(--font-heading)] text-foreground tracking-tight">
            Vizzy
          </h1>
        </div>
        <div className="text-xs text-muted-foreground">
          AI Image Generation
        </div>
      </header>

      {/* Chat Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {!hasMessages ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <div className="flex flex-col items-center gap-3 mb-10">
              <div className="size-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Sparkles className="size-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-heading)] text-foreground tracking-tight text-balance text-center">
                What would you like to create?
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
                Describe any image and I will generate it for you. You can
                iterate, refine, and generate multiple variations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left px-4 py-3 rounded-xl border bg-card text-sm text-foreground hover:bg-secondary hover:border-ring/30 transition-colors leading-relaxed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="flex flex-col gap-6 py-6">
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

      {/* Input Bar */}
      <div className="flex-shrink-0 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
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
