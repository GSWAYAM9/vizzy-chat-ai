/**
 * Vizzy Creation Canvas - DASP 1.2
 * The unified chat-first interface for all user interaction with DASP
 * Handles natural language input, output rendering, iteration, and history
 */

export type CanvasOutputType = 'visual' | 'video' | 'audio' | 'text' | 'narrative' | 'curated_content'

export type IterationAction = 'refine' | 'adjust' | 'replace' | 'combine' | 'compare'

/**
 * Canvas Message - Represents a user or assistant message in the chat thread
 */
export interface CanvasMessage {
  id: string
  timestamp: Date
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'output' | 'error' | 'system'
}

/**
 * Canvas Output - A creative output rendered in the chat
 */
export interface CanvasOutput {
  id: string
  type: CanvasOutputType
  title: string
  description: string
  content: {
    url?: string // For images, videos, audio
    text?: string // For text outputs
    metadata?: Record<string, any>
  }
  timestamp: Date
  generatedBy: string // Agent ID
  userRating?: number // 1-5
  saved: boolean
  variations?: CanvasOutput[] // Alternative versions
}

/**
 * Canvas Iteration - Represents refinement of an output
 */
export interface CanvasIteration {
  id: string
  originalOutputId: string
  iterationNumber: number
  action: IterationAction
  instruction: string
  resultingOutput: CanvasOutput
  timestamp: Date
}

/**
 * Canvas Session - Represents a conversation session
 */
export interface CanvasSession {
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
  title: string // Auto-generated from first request
  messages: CanvasMessage[]
  outputs: CanvasOutput[]
  iterations: CanvasIteration[]
  sessionMemory: string[] // Previous context for continuation
  isActive: boolean
}

/**
 * Quick Action - One-tap preset creation flows
 */
export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  prompt: string
  agents: string[]
  timeEstimate: number // seconds
}

/**
 * Canvas Session Interface
 */
export class VizzyCreationCanvas {
  private session: CanvasSession
  private sessionMemoryLimit = 5 // Remember last 5 interactions

  constructor(userId: string, sessionId?: string) {
    this.session = {
      id: sessionId || `canvas_${userId}_${Date.now()}`,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: 'New Vizzy Session',
      messages: [],
      outputs: [],
      iterations: [],
      sessionMemory: [],
      isActive: true,
    }
  }

  /**
   * Add a user message to the canvas
   */
  addUserMessage(content: string): CanvasMessage {
    const message: CanvasMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date(),
      role: 'user',
      content,
      type: 'text',
    }

    this.session.messages.push(message)
    this.session.updatedAt = new Date()

    // Update session title if this is the first message
    if (this.session.messages.length === 1) {
      this.session.title = this.generateSessionTitle(content)
    }

    // Update session memory
    this.updateSessionMemory(content)

    return message
  }

  /**
   * Add an assistant response
   */
  addAssistantMessage(content: string, type: 'text' | 'error' = 'text'): CanvasMessage {
    const message: CanvasMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date(),
      role: 'assistant',
      content,
      type,
    }

    this.session.messages.push(message)
    this.session.updatedAt = new Date()

    return message
  }

  /**
   * Add a creative output to the canvas
   */
  addOutput(output: CanvasOutput): void {
    this.session.outputs.push(output)
    this.session.updatedAt = new Date()

    // Add system message about the output
    this.addAssistantMessage(`Created: ${output.title}`, 'output')
  }

  /**
   * Create a variation of an existing output
   */
  createVariation(outputId: string, variation: CanvasOutput): void {
    const original = this.session.outputs.find(o => o.id === outputId)
    if (original) {
      if (!original.variations) {
        original.variations = []
      }
      original.variations.push(variation)
      this.session.updatedAt = new Date()
    }
  }

  /**
   * Record an iteration (refinement) of an output
   */
  recordIteration(
    originalOutputId: string,
    action: IterationAction,
    instruction: string,
    resultingOutput: CanvasOutput
  ): CanvasIteration {
    const iteration: CanvasIteration = {
      id: `iter_${Date.now()}`,
      originalOutputId,
      iterationNumber: this.session.iterations.filter(i => i.originalOutputId === originalOutputId).length + 1,
      action,
      instruction,
      resultingOutput,
      timestamp: new Date(),
    }

    this.session.iterations.push(iteration)
    this.session.outputs.push(resultingOutput)
    this.session.updatedAt = new Date()

    return iteration
  }

  /**
   * Get full message history
   */
  getHistory(): CanvasMessage[] {
    return [...this.session.messages]
  }

  /**
   * Get session memory for context continuation
   */
  getSessionMemory(): string {
    return this.session.sessionMemory.join(' | ')
  }

  /**
   * Get all outputs created in this session
   */
  getOutputs(): CanvasOutput[] {
    return [...this.session.outputs]
  }

  /**
   * Get iteration history for a specific output
   */
  getIterationHistory(outputId: string): CanvasIteration[] {
    return this.session.iterations.filter(i => i.originalOutputId === outputId)
  }

  /**
   * Save an output to user library
   */
  saveOutput(outputId: string): void {
    const output = this.session.outputs.find(o => o.id === outputId)
    if (output) {
      output.saved = true
      this.session.updatedAt = new Date()
    }
  }

  /**
   * Rate an output
   */
  rateOutput(outputId: string, rating: number): void {
    const output = this.session.outputs.find(o => o.id === outputId)
    if (output) {
      output.userRating = Math.max(1, Math.min(5, rating))
      this.session.updatedAt = new Date()
    }
  }

  /**
   * Get the session object
   */
  getSession(): CanvasSession {
    return { ...this.session }
  }

  /**
   * Generate a session title from first message
   */
  private generateSessionTitle(firstMessage: string): string {
    // Take first 50 characters or first sentence
    const sentences = firstMessage.split(/[.!?]/)
    const title = sentences[0].substring(0, 50).trim()
    return title || 'New Vizzy Session'
  }

  /**
   * Update session memory with new interactions
   */
  private updateSessionMemory(content: string): void {
    // Extract key topics/concepts from message
    const keywords = this.extractKeywords(content)
    this.session.sessionMemory.push(...keywords)

    // Keep only recent memories
    if (this.session.sessionMemory.length > this.sessionMemoryLimit * 10) {
      this.session.sessionMemory = this.session.sessionMemory.slice(-this.sessionMemoryLimit * 10)
    }
  }

  /**
   * Extract keywords from text for memory
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (in production, use NLP)
    const words = text.split(/\s+/)
    const stopwords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'is',
      'are',
      'be',
    ])
    return words.filter(w => w.length > 3 && !stopwords.has(w.toLowerCase())).slice(0, 5)
  }
}

/**
 * Predefined Quick Actions
 */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'surprise_me',
    label: 'Surprise me',
    description: 'Generate something unexpected based on your profile',
    icon: '✨',
    prompt:
      'Create something beautiful and unexpected for me based on what you know about my taste',
    agents: ['vva'],
    timeEstimate: 15,
  },
  {
    id: 'morning_artwork',
    label: 'Morning artwork',
    description: 'Energizing visual for your morning',
    icon: '🌅',
    prompt:
      'Create an uplifting, energizing piece to start my day with. Something that feels fresh and inspiring.',
    agents: ['vva', 'vnca'],
    timeEstimate: 20,
  },
  {
    id: 'calm_something',
    label: 'Calm something',
    description: 'Peaceful, grounding content',
    icon: '🧘',
    prompt: 'Create something deeply calm and grounding. I need to pause and breathe.',
    agents: ['vva', 'vmaa'],
    timeEstimate: 25,
  },
  {
    id: 'poster_today',
    label: 'Poster for today',
    description: 'Create a poster with meaning',
    icon: '📋',
    prompt: 'Create a beautiful poster for today with a meaningful quote or phrase',
    agents: ['vpta'],
    timeEstimate: 15,
  },
  {
    id: 'music_now',
    label: 'Music for now',
    description: 'Ambient audio for the current moment',
    icon: '🎵',
    prompt: 'Generate ambient music that matches my current mood and helps me focus',
    agents: ['vmaa'],
    timeEstimate: 20,
  },
  {
    id: 'discover',
    label: 'Discover',
    description: 'Find new content aligned to your taste',
    icon: '🔍',
    prompt: 'Discover something new that aligns with my aesthetic and interests',
    agents: ['vca'],
    timeEstimate: 10,
  },
]

/**
 * Iteration suggestions based on user feedback
 */
export const ITERATION_SUGGESTIONS = {
  darker: 'Make it darker with deeper colors and more shadow',
  lighter: 'Make it brighter and more luminous',
  minimal: 'Simplify - remove extra elements, focus on essence',
  maximal: 'Add more detail and complexity',
  colorful: 'Shift to a more vibrant, saturated color palette',
  monochrome: 'Reduce to black, white, and grays',
  abstract: 'Make it more abstract and less representational',
  realistic: 'Make it more photorealistic and detailed',
  faster: 'Make the motion faster and more dynamic',
  slower: 'Slow it down, create a more meditative pace',
  different_mood: 'Shift the overall mood and emotional tone',
  different_style: 'Try a completely different artistic style',
}
