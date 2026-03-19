/**
 * DASP Orchestrator - Master Agent Coordinator
 * Handles routing, parallel/sequential execution, result assembly, and error handling
 * Ensures graceful degradation and fallback behavior
 */

import { sql } from '@/lib/neon-client'
import type { AgentRequest, AgentResponse, RoutingDecision } from './agent-network'
import {
  determineRouting,
  getAgent,
  isAgentAvailable,
  getFallbackAgent,
  AGENT_REGISTRY,
} from './agent-network'
import type { DeepUserProfile } from '../types/deep-user-profile'

/**
 * Orchestration context for tracking execution
 */
export interface OrchestrationContext {
  orchestrationId: string
  userId: string
  requestId: string
  userProfile?: DeepUserProfile
  routing: RoutingDecision
  agentRequests: AgentRequest[]
  agentResponses: Map<string, AgentResponse>
  startTime: Date
  endTime?: Date
  status: 'pending' | 'executing' | 'completed' | 'partial_failure' | 'failed'
  errors: string[]
}

/**
 * Execution queue for tracking agent workload
 */
class ExecutionQueue {
  private queue: AgentRequest[] = []
  private activeRequests: Map<string, AgentRequest> = new Map()
  private agentLoad: Record<string, number> = {}

  enqueue(request: AgentRequest): void {
    this.queue.push(request)
    this.agentLoad[request.agentId] = (this.agentLoad[request.agentId] || 0) + 1
  }

  dequeue(): AgentRequest | undefined {
    const request = this.queue.shift()
    if (request) {
      this.activeRequests.set(request.requestId, request)
    }
    return request
  }

  complete(requestId: string): void {
    const request = this.activeRequests.get(requestId)
    if (request) {
      this.agentLoad[request.agentId] = Math.max(0, (this.agentLoad[request.agentId] || 1) - 1)
      this.activeRequests.delete(requestId)
    }
  }

  getAgentLoad(): Record<string, number> {
    return { ...this.agentLoad }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getActiveRequestCount(): number {
    return this.activeRequests.size
  }
}

// Global execution queue
const executionQueue = new ExecutionQueue()

/**
 * Create orchestration context for a request
 */
export function createOrchestrationContext(
  userId: string,
  requestId: string,
  routing: RoutingDecision,
  userProfile?: DeepUserProfile
): OrchestrationContext {
  return {
    orchestrationId: `orch_${userId}_${Date.now()}`,
    userId,
    requestId,
    userProfile,
    routing,
    agentRequests: [],
    agentResponses: new Map(),
    startTime: new Date(),
    status: 'pending',
    errors: [],
  }
}

/**
 * Execute orchestration with parallel or sequential agent coordination
 */
export async function executeOrchestration(
  context: OrchestrationContext
): Promise<OrchestrationContext> {
  try {
    console.log(`[DASP Orchestrator] Starting orchestration: ${context.orchestrationId}`)

    context.status = 'executing'

    // Create agent requests
    for (const agentId of context.routing.agents) {
      const agent = getAgent(agentId)
      if (!agent) continue

      const agentRequest: AgentRequest = {
        agentId,
        requestId: `${context.requestId}_${agentId}`,
        userId: context.userId,
        userProfile: context.userProfile,
        input: {},
        priority: 'normal',
        timestamp: new Date(),
      }

      context.agentRequests.push(agentRequest)
      executionQueue.enqueue(agentRequest)
    }

    // Execute based on routing type
    if (context.routing.executionOrder === 'parallel') {
      await executeAgentsInParallel(context)
    } else {
      await executeAgentsInSequence(context)
    }

    context.endTime = new Date()

    // Check if all agents succeeded
    const failedCount = Array.from(context.agentResponses.values()).filter(
      r => r.status === 'failed'
    ).length

    if (failedCount === 0) {
      context.status = 'completed'
    } else if (failedCount < context.agentRequests.length) {
      context.status = 'partial_failure'
    } else {
      context.status = 'failed'
    }

    // Log orchestration
    await logOrchestration(context)

    console.log(`[DASP Orchestrator] Orchestration completed: ${context.orchestrationId} (${context.status})`)

    return context
  } catch (error) {
    console.error('[DASP Orchestrator] Error during orchestration:', error)
    context.status = 'failed'
    context.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return context
  }
}

/**
 * Execute agents in parallel
 */
async function executeAgentsInParallel(context: OrchestrationContext): Promise<void> {
  const promises = context.agentRequests.map(agentRequest =>
    executeAgentWithFallback(context, agentRequest)
  )

  const results = await Promise.allSettled(promises)

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      context.errors.push(`Agent ${context.agentRequests[index].agentId} failed: ${result.reason}`)
    }
  })
}

/**
 * Execute agents in sequence
 */
async function executeAgentsInSequence(context: OrchestrationContext): Promise<void> {
  for (const agentRequest of context.agentRequests) {
    try {
      await executeAgentWithFallback(context, agentRequest)
    } catch (error) {
      context.errors.push(
        `Sequential execution failed at ${agentRequest.agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      // Continue to next agent even if one fails
    }
  }
}

/**
 * Execute a single agent with fallback behavior
 */
async function executeAgentWithFallback(
  context: OrchestrationContext,
  agentRequest: AgentRequest
): Promise<void> {
  try {
    const agent = getAgent(agentRequest.agentId)
    if (!agent) {
      throw new Error(`Agent ${agentRequest.agentId} not found`)
    }

    // Check agent availability
    const agentLoad = executionQueue.getAgentLoad()
    if (!isAgentAvailable(agentRequest.agentId, agentLoad)) {
      console.warn(`[DASP Orchestrator] Agent ${agentRequest.agentId} at capacity, using fallback`)
      await executeAgentFallback(context, agentRequest)
      return
    }

    // Execute agent (simulated - in production would call actual agent)
    const response = await callAgent(agentRequest, agent)

    context.agentResponses.set(agentRequest.agentId, response)
    executionQueue.complete(agentRequest.requestId)

    if (response.status === 'failed') {
      // Try fallback
      console.warn(`[DASP Orchestrator] Agent ${agentRequest.agentId} failed, trying fallback`)
      await executeAgentFallback(context, agentRequest)
    }
  } catch (error) {
    console.error(`[DASP Orchestrator] Error executing agent:`, error)
    await executeAgentFallback(context, agentRequest)
  }
}

/**
 * Execute agent fallback behavior
 */
async function executeAgentFallback(
  context: OrchestrationContext,
  agentRequest: AgentRequest
): Promise<void> {
  try {
    const fallbackAgent = getFallbackAgent(agentRequest.agentId)

    if (fallbackAgent) {
      console.log(`[DASP Orchestrator] Using fallback agent: ${fallbackAgent.id}`)

      const fallbackRequest: AgentRequest = {
        ...agentRequest,
        agentId: fallbackAgent.id,
      }

      const response = await callAgent(fallbackRequest, fallbackAgent)
      response.fallbackUsed = true

      context.agentResponses.set(agentRequest.agentId, response)
    } else {
      // No fallback available, return graceful degradation
      const degradedResponse: AgentResponse = {
        agentId: agentRequest.agentId,
        requestId: agentRequest.requestId,
        status: 'failed',
        error: 'Agent unavailable and no fallback available',
        processingTimeMs: 0,
        timestamp: new Date(),
        fallbackUsed: false,
      }

      context.agentResponses.set(agentRequest.agentId, degradedResponse)
    }
  } catch (error) {
    console.error('[DASP Orchestrator] Fallback execution failed:', error)

    const failedResponse: AgentResponse = {
      agentId: agentRequest.agentId,
      requestId: agentRequest.requestId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Fallback failed',
      processingTimeMs: 0,
      timestamp: new Date(),
      fallbackUsed: false,
    }

    context.agentResponses.set(agentRequest.agentId, failedResponse)
  }
}

/**
 * Call an agent (simulated - in production would call actual agent API/service)
 */
async function callAgent(request: AgentRequest, agent: (typeof AGENT_REGISTRY)[keyof typeof AGENT_REGISTRY]): Promise<AgentResponse> {
  const startTime = Date.now()

  try {
    // Simulate agent processing
    // In production, would call actual agent API
    await new Promise(resolve => setTimeout(resolve, 1000))

    const response: AgentResponse = {
      agentId: request.agentId,
      requestId: request.requestId,
      status: 'completed',
      output: {
        // Simulated output - in production would be actual agent output
        generated: true,
        timestamp: new Date(),
      },
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date(),
      fallbackUsed: false,
    }

    return response
  } catch (error) {
    return {
      agentId: request.agentId,
      requestId: request.requestId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown agent error',
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date(),
      fallbackUsed: false,
    }
  }
}

/**
 * Assemble results from multiple agents
 */
export function assembleResults(context: OrchestrationContext): any {
  const results: Record<string, any> = {}

  context.agentResponses.forEach((response, agentId) => {
    results[agentId] = response
  })

  return {
    orchestrationId: context.orchestrationId,
    status: context.status,
    results,
    processingTimeMs: context.endTime
      ? context.endTime.getTime() - context.startTime.getTime()
      : 0,
    errors: context.errors,
  }
}

/**
 * Log orchestration execution for quality monitoring
 */
async function logOrchestration(context: OrchestrationContext): Promise<void> {
  try {
    await sql`
      INSERT INTO orchestration_logs (
        orchestration_id,
        user_id,
        request_id,
        routing_type,
        agents_executed,
        status,
        processing_time_ms,
        error_count,
        fallback_used,
        metadata
      )
      VALUES (
        ${context.orchestrationId},
        ${context.userId}::uuid,
        ${context.requestId},
        ${context.routing.type},
        ${JSON.stringify(context.routing.agents)},
        ${context.status},
        ${context.endTime ? context.endTime.getTime() - context.startTime.getTime() : 0},
        ${context.errors.length},
        ${Array.from(context.agentResponses.values()).some(r => r.fallbackUsed)},
        ${JSON.stringify({
          agentResults: Array.from(context.agentResponses.values()).map(r => ({
            agent: r.agentId,
            status: r.status,
            timeMs: r.processingTimeMs,
          })),
        })}
      )
    `
  } catch (error) {
    console.error('[DASP Orchestrator] Error logging orchestration:', error)
  }
}

/**
 * Get orchestration status and metrics
 */
export function getOrchestrationMetrics(): {
  queueLength: number
  activeRequests: number
  agentLoad: Record<string, number>
} {
  return {
    queueLength: executionQueue.getQueueLength(),
    activeRequests: executionQueue.getActiveRequestCount(),
    agentLoad: executionQueue.getAgentLoad(),
  }
}
