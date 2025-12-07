import type { Flow } from '../../db/schema'
import { useDatabaseStorage } from "../../utils/FlowyStorage"
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

    const storage = useDatabaseStorage()
    const user = await storage.getItem(`users:${decoded.userId}`)
    return user
  } catch (error) {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  const user = await getCurrentUser(event)

  let allFlowOverviews: FlowOverview[] = []

  // Try to get flows from organized structure first
  try {
    const flowsKeys = await storage.getKeys('flows:')

    for (const key of flowsKeys) {
      const flow = await storage.getItem(key) as Flow
      if (flow) {
        // Create optimized overview object with only necessary fields
        const overview: FlowOverview = {
          id: flow.id,
          name: flow.name,
          description: flow.description || undefined,
          templateId: flow.templateId || undefined,
          startedAt: flow.startedAt || undefined,
          completedAt: flow.completedAt || undefined,
          expectedEndDate: flow.expectedEndDate || undefined,
          hidden: flow.hidden || false
        }
        allFlowOverviews.push(overview)
      }
    }

    if (allFlowOverviews.length === 0) {
      // Fall back to legacy format if organized structure doesn't exist
      const flows = (await storage.getItem('flows') as Flow[]) || []
      const flowsArray = Array.isArray(flows) ? flows : []
      allFlowOverviews = flowsArray.map(flow => ({
        id: flow.id,
        name: flow.name,
        description: flow.description || undefined,
        templateId: flow.templateId || undefined,
        startedAt: flow.startedAt || undefined,
        completedAt: flow.completedAt || undefined,
        expectedEndDate: flow.expectedEndDate || undefined,
        hidden: flow.hidden || false
      }))
    }
  } catch (error) {
    console.log('Error accessing flows structure:', error)
    // Fallback to legacy array format
    const flows = (await storage.getItem('flows') as Flow[]) || []
    const flowsArray = Array.isArray(flows) ? flows : []
    allFlowOverviews = flowsArray.map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description || undefined,
      templateId: flow.templateId || undefined,
      startedAt: flow.startedAt || undefined,
      completedAt: flow.completedAt || undefined,
      expectedEndDate: flow.expectedEndDate || undefined,
      hidden: flow.hidden || false
    }))
  }

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
})