import type { Flow } from '../../db/schema'
import { useFlowRepository, useUserRepository } from "../../storage/StorageFactory"
import jwt from 'jsonwebtoken'

// Optimized interface for flow overview/modal
interface FlowOverview {
  id: string
  name: string
  description?: string
  templateId?: string
  startedAt?: string
  completedAt?: string
  expectedEndDate?: string
  hidden?: boolean
}

/**
 * Response for all flows overview
 */
interface AllFlowsResponse {
  success: true
  data: FlowOverview[]
}

/**
 * GET /api/flows/all - Get all flows overview (optimized for listing)
 * @returns Simplified list of all flows for overview display
 */

async function getCurrentUser(event: any) {
  try {
    const token = getCookie(event, 'auth-token')
    if (!token) return null

    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    const decoded: any = jwt.verify(token, secretKey)

    const userRepo = useUserRepository()
    const user = await userRepo.findById(decoded.userId)
    return user
  } catch (error) {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const flowRepo = useFlowRepository()
  const user = await getCurrentUser(event)

  try {
    // Get all flows from repository
    const flows = await flowRepo.findAll()
    
    // Create optimized overview objects with only necessary fields
    const allFlowOverviews: FlowOverview[] = flows.map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description || undefined,
      templateId: flow.templateId || undefined,
      startedAt: flow.startedAt || undefined,
      completedAt: flow.completedAt || undefined,
      expectedEndDate: flow.expectedEndDate || undefined,
      hidden: flow.hidden || false
    }))

    // Authentication check - this is the "All Flows" endpoint
    // Allow access for authenticated users, but admins see everything, regular users see non-hidden flows
    if (!user) {
      // Non-authenticated users see only non-hidden flows
      const publicFlows = allFlowOverviews.filter(flow => !flow.hidden)
      return { data: publicFlows }
    }

    // Authenticated users (including admins) see all flows
    // This is the "All Flows" view, so show everything
    return { data: allFlowOverviews }
  } catch (error) {
    console.error('Error fetching flows:', error)
    return { data: [] }
  }
})