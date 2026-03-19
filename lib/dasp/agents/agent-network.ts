/**
 * Agent Network Architecture - DASP 1.2
 * Defines the 7 specialized agents and their capabilities
 * All agents are coordinated by the DASP Orchestrator
 */

import type { DeepUserProfile } from '@/lib/dasp/types/deep-user-profile'

/**
 * Agent Interface - Base contract for all agents
 */
export interface Agent {
  id: string
  name: string
  version: string
  capability: string
  models: string[]
  inputTypes: string[]
  outputType: string
  maxConcurrentRequests: number
  timeoutSeconds: number
  fallbackBehavior: string
  requiresProfileContext: boolean
}

/**
 * Agent Request - Unified interface for all agent requests
 */
export interface AgentRequest {
  agentId: string
  requestId: string
  userId: string
  userProfile?: DeepUserProfile
  input: {
    prompt?: string
    textInput?: string
    imageInput?: string
    parameters?: Record<string, any>
    style?: string
    mood?: string
    duration?: number
    quality?: string
  }
  metadata?: Record<string, any>
  priority: 'low' | 'normal' | 'high'
  timestamp: Date
}

/**
 * Agent Response - Unified interface for all agent responses
 */
export interface AgentResponse {
  agentId: string
  requestId: string
  status: 'completed' | 'partial' | 'failed' | 'timeout'
  output?: any
  error?: string
  processingTimeMs: number
  metadata?: Record<string, any>
  timestamp: Date
  fallbackUsed: boolean
}

/**
 * The 7 Specialized Agents - DASP 1.2
 */

// Agent 1: Vizzy Visual Agent (VVA)
export const VIZZY_VISUAL_AGENT: Agent = {
  id: 'vva',
  name: 'Vizzy Visual Agent',
  version: '1.2',
  capability: 'Generates original visual artworks and abstract compositions',
  models: ['flux-pro', 'sdxl', 'midjourney'],
  inputTypes: ['text_prompt', 'style_params', 'color_palette', 'mood'],
  outputType: 'high_resolution_image_4k',
  maxConcurrentRequests: 5,
  timeoutSeconds: 60,
  fallbackBehavior: 'return_cached_similar_content',
  requiresProfileContext: true,
}

// Agent 2: Vizzy Poster & Typography Agent (VPTA)
export const VIZZY_POSTER_TYPOGRAPHY_AGENT: Agent = {
  id: 'vpta',
  name: 'Vizzy Poster & Typography Agent',
  version: '1.2',
  capability: 'Generates designed posters, quote cards, and typographic layouts',
  models: ['llm_for_text', 'image_generation_layout', 'font_renderer'],
  inputTypes: ['text_input', 'quote', 'theme', 'aesthetic_direction'],
  outputType: 'designed_poster_4k',
  maxConcurrentRequests: 3,
  timeoutSeconds: 45,
  fallbackBehavior: 'return_template_based_poster',
  requiresProfileContext: true,
}

// Agent 3: Vizzy Video & Motion Agent (VVMA)
export const VIZZY_VIDEO_MOTION_AGENT: Agent = {
  id: 'vvma',
  name: 'Vizzy Video & Motion Agent',
  version: '1.2',
  capability: 'Generates short-form videos and animated sequences',
  models: ['runway-gen3', 'kling', 'stability-video'],
  inputTypes: ['text_prompt', 'reference_image', 'motion_style', 'duration'],
  outputType: 'mp4_video_1080p_4k',
  maxConcurrentRequests: 2,
  timeoutSeconds: 120,
  fallbackBehavior: 'return_animated_slideshow',
  requiresProfileContext: false,
}

// Agent 4: Vizzy Music & Audio Agent (VMAA)
export const VIZZY_MUSIC_AUDIO_AGENT: Agent = {
  id: 'vmaa',
  name: 'Vizzy Music & Audio Agent',
  version: '1.2',
  capability: 'Generates original music, soundscapes, and audio atmospheres',
  models: ['suno', 'udio', 'audio-craft'],
  inputTypes: ['mood', 'genre', 'tempo', 'duration', 'thematic_direction'],
  outputType: 'audio_wav_mp3',
  maxConcurrentRequests: 3,
  timeoutSeconds: 180,
  fallbackBehavior: 'return_ambient_background_music',
  requiresProfileContext: true,
}

// Agent 5: Vizzy Curation Agent (VCA)
export const VIZZY_CURATION_AGENT: Agent = {
  id: 'vca',
  name: 'Vizzy Curation Agent',
  version: '1.2',
  capability: 'Discovers and surfaces third-party content aligned to user profile',
  models: ['search_ranking_model', 'content_classifier', 'safety_filter'],
  inputTypes: ['aesthetic_filters', 'mood', 'interests', 'content_sources'],
  outputType: 'curated_content_set',
  maxConcurrentRequests: 10,
  timeoutSeconds: 30,
  fallbackBehavior: 'return_trending_general_content',
  requiresProfileContext: true,
}

// Agent 6: Vizzy Narrative & Context Agent (VNCA)
export const VIZZY_NARRATIVE_CONTEXT_AGENT: Agent = {
  id: 'vnca',
  name: 'Vizzy Narrative & Context Agent',
  version: '1.2',
  capability: 'Generates contextual narratives and meaning-layers for content',
  models: ['llm_narrative_generator', 'emotion_framer', 'context_extractor'],
  inputTypes: ['content_description', 'user_context', 'emotional_state'],
  outputType: 'narrative_text_and_metadata',
  maxConcurrentRequests: 5,
  timeoutSeconds: 30,
  fallbackBehavior: 'return_generic_description',
  requiresProfileContext: true,
}

// Agent 7: DASP Orchestrator (DO) - Master Coordinator
export const DASP_ORCHESTRATOR: Agent = {
  id: 'do',
  name: 'DASP Orchestrator',
  version: '1.2',
  capability: 'Coordinates all other agents and manages execution flows',
  models: ['intent_router', 'parallel_executor', 'result_assembler'],
  inputTypes: ['natural_language', 'structured_request'],
  outputType: 'multi_modal_response',
  maxConcurrentRequests: 100,
  timeoutSeconds: 180,
  fallbackBehavior: 'return_graceful_degradation',
  requiresProfileContext: true,
}

/**
 * All agents registry
 */
export const AGENT_REGISTRY: Record<string, Agent> = {
  vva: VIZZY_VISUAL_AGENT,
  vpta: VIZZY_POSTER_TYPOGRAPHY_AGENT,
  vvma: VIZZY_VIDEO_MOTION_AGENT,
  vmaa: VIZZY_MUSIC_AUDIO_AGENT,
  vca: VIZZY_CURATION_AGENT,
  vnca: VIZZY_NARRATIVE_CONTEXT_AGENT,
  do: DASP_ORCHESTRATOR,
}

/**
 * Request routing types based on complexity and content
 */
export type RequestRoutingType = 
  | 'direct_api' // Direct call to single agent
  | 'agent_activation' // Single agent activation
  | 'orchestrated' // Multiple agents coordinated
  | 'parallel_execution' // Multiple agents in parallel
  | 'sequential_execution' // Multiple agents in sequence

/**
 * Routing decision logic
 */
export interface RoutingDecision {
  type: RequestRoutingType
  agents: string[] // Which agents to activate
  executionOrder: 'parallel' | 'sequential'
  estimatedDurationMs: number
  confidence: number
}

/**
 * Intent classification for routing
 */
export interface RequestIntent {
  intentType: 'visual' | 'text' | 'audio' | 'video' | 'curation' | 'narrative' | 'complex'
  complexity: 'simple' | 'moderate' | 'complex'
  requiresMultipleAgents: boolean
  primaryAgent: string
  secondaryAgents: string[]
  confidence: number
}

/**
 * Determine routing for a user request
 */
export function determineRouting(intent: RequestIntent): RoutingDecision {
  let routing: RoutingDecision = {
    type: 'direct_api',
    agents: [intent.primaryAgent],
    executionOrder: 'parallel',
    estimatedDurationMs: 15000,
    confidence: 0.95,
  }

  // If single agent and simple, use direct API
  if (!intent.requiresMultipleAgents && intent.complexity === 'simple') {
    routing.type = 'direct_api'
    routing.estimatedDurationMs = 15000
    return routing
  }

  // If single agent but more complex
  if (!intent.requiresMultipleAgents && intent.complexity !== 'simple') {
    routing.type = 'agent_activation'
    routing.estimatedDurationMs = 30000
    return routing
  }

  // If multiple agents needed
  if (intent.requiresMultipleAgents) {
    routing.type = 'orchestrated'
    routing.agents = [intent.primaryAgent, ...intent.secondaryAgents]

    // Determine execution order based on dependencies
    if (canExecuteInParallel(intent.primaryAgent, intent.secondaryAgents)) {
      routing.executionOrder = 'parallel'
      routing.estimatedDurationMs = 45000
    } else {
      routing.executionOrder = 'sequential'
      routing.estimatedDurationMs = 60000
    }

    routing.type = routing.executionOrder === 'parallel' ? 'parallel_execution' : 'sequential_execution'
  }

  return routing
}

/**
 * Check if agents can execute in parallel
 */
export function canExecuteInParallel(primaryAgent: string, secondaryAgents: string[]): boolean {
  // Some agents depend on others' output
  const dependencyMap: Record<string, string[]> = {
    vvma: ['vva'], // Video agent might depend on visual agent
    vnca: ['vva', 'vvma'], // Narrative agent needs content to describe
  }

  const dependencies = dependencyMap[primaryAgent] || []
  return !secondaryAgents.some(agent => dependencies.includes(agent))
}

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): Agent | undefined {
  return AGENT_REGISTRY[agentId]
}

/**
 * Get all agents
 */
export function getAllAgents(): Agent[] {
  return Object.values(AGENT_REGISTRY)
}

/**
 * Filter agents by capability
 */
export function getAgentsByCapability(capabilityKeyword: string): Agent[] {
  return Object.values(AGENT_REGISTRY).filter(agent =>
    agent.capability.toLowerCase().includes(capabilityKeyword.toLowerCase())
  )
}

/**
 * Check agent availability
 */
export function isAgentAvailable(agentId: string, currentLoad?: Record<string, number>): boolean {
  const agent = getAgent(agentId)
  if (!agent) return false

  if (!currentLoad) return true

  const currentRequests = currentLoad[agentId] || 0
  return currentRequests < agent.maxConcurrentRequests
}

/**
 * Get fallback agent for capability
 */
export function getFallbackAgent(primaryAgentId: string): Agent | undefined {
  const primary = getAgent(primaryAgentId)
  if (!primary) return undefined

  // Return a different agent with similar capability
  const similar = Object.values(AGENT_REGISTRY).find(
    agent => agent.capability.includes(primary.capability.split(' ')[0]) && agent.id !== primaryAgentId
  )
  return similar
}
