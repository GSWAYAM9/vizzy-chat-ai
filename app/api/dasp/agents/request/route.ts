import { NextRequest, NextResponse } from 'next/server'
import { getDeepUserProfile } from '@/lib/dasp/services/deep-user-profile-service'
import type { RequestIntent } from '@/lib/dasp/agents/agent-network'
import { determineRouting } from '@/lib/dasp/agents/agent-network'
import { createOrchestrationContext, executeOrchestration, assembleResults } from '@/lib/dasp/agents/orchestrator'

/**
 * POST /api/dasp/agents/request
 * Submit a request that will be routed through the agent network
 * The request can activate single or multiple agents based on complexity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, prompt, requestType } = body

    if (!userId || !prompt) {
      return NextResponse.json(
        { error: 'userId and prompt are required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Agent request from user ${userId}: ${requestType || 'general'}`)

    // Get user profile for context
    const userProfile = await getDeepUserProfile(userId)

    // Classify request intent (in production, would use LLM for more sophisticated classification)
    const intent = classifyRequestIntent(prompt, requestType)

    // Determine routing strategy
    const routing = determineRouting(intent)

    console.log(`[DASP] Routing decision: ${routing.type}, agents: ${routing.agents.join(', ')}`)

    // Create orchestration context
    const orchestrationContext = createOrchestrationContext(
      userId,
      `req_${Date.now()}`,
      routing,
      userProfile || undefined
    )

    // Execute orchestration
    const result = await executeOrchestration(orchestrationContext)

    // Assemble results
    const response = assembleResults(result)

    return NextResponse.json(
      {
        message: 'Request processed',
        orchestrationId: result.orchestrationId,
        status: result.status,
        results: response,
      },
      {
        status: result.status === 'completed' ? 200 : result.status === 'partial_failure' ? 206 : 500,
      }
    )
  } catch (error) {
    console.error('[DASP] Error processing agent request:', error)
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Classify the intent of a user request
 */
function classifyRequestIntent(prompt: string, requestType?: string): RequestIntent {
  const lowerPrompt = prompt.toLowerCase()

  // Simple classification based on keywords
  let intentType: RequestIntent['intentType'] = 'visual'
  let complexity: RequestIntent['complexity'] = 'simple'
  let requiresMultipleAgents = false
  let primaryAgent = 'vva'
  let secondaryAgents: string[] = []

  // Intent classification
  if (lowerPrompt.includes('music') || lowerPrompt.includes('sound')) {
    intentType = 'audio'
    primaryAgent = 'vmaa'
  } else if (lowerPrompt.includes('video') || lowerPrompt.includes('motion')) {
    intentType = 'video'
    primaryAgent = 'vvma'
  } else if (lowerPrompt.includes('poster') || lowerPrompt.includes('quote') || lowerPrompt.includes('text')) {
    intentType = 'text'
    primaryAgent = 'vpta'
  } else if (lowerPrompt.includes('curate') || lowerPrompt.includes('discover')) {
    intentType = 'curation'
    primaryAgent = 'vca'
  } else if (lowerPrompt.includes('tell') || lowerPrompt.includes('story') || lowerPrompt.includes('describe')) {
    intentType = 'narrative'
    primaryAgent = 'vnca'
  }

  // Complexity analysis
  if (
    lowerPrompt.includes('with') ||
    lowerPrompt.includes('and') ||
    lowerPrompt.includes('plus') ||
    lowerPrompt.includes('also')
  ) {
    complexity = 'moderate'
    requiresMultipleAgents = true
  }

  if (lowerPrompt.length > 200 || lowerPrompt.includes('also') || lowerPrompt.includes('please')) {
    complexity = 'complex'
    requiresMultipleAgents = true
  }

  // Determine secondary agents based on multi-part requests
  if (lowerPrompt.includes('music') && lowerPrompt.includes('visual')) {
    secondaryAgents.push('vmaa')
    requiresMultipleAgents = true
  }

  if (lowerPrompt.includes('video') && lowerPrompt.includes('music')) {
    secondaryAgents.push('vmaa')
    requiresMultipleAgents = true
  }

  if (lowerPrompt.includes('story') || lowerPrompt.includes('narrative')) {
    secondaryAgents.push('vnca')
    requiresMultipleAgents = true
  }

  return {
    intentType,
    complexity,
    requiresMultipleAgents,
    primaryAgent,
    secondaryAgents,
    confidence: 0.8,
  }
}
