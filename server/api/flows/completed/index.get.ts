import type { Flow, Team } from '../../../db/schema'
import { useDatabaseStorage } from "../../../utils/FlowyStorage"
import jwt from 'jsonwebtoken'

/**
 * Response for completed flows
 */
interface CompletedFlowsResponse {
  success: true
  data: Flow[]
}

/**
 * GET /api/flows/completed - Get all completed flows for current user
 * @returns List of completed flows accessible to the current user
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

async function getUserTeamIds(userId: string, storage: any): Promise<Set<string>> {
  const teamIds = new Set<string>()
  try {
    const teamKeys = await storage.getKeys('teams:')
    for (const key of teamKeys) {
      const team = await storage.getItem(key) as Team
      if (team && team.userIds && team.userIds.includes(userId)) {
        teamIds.add(team.id)
      }
    }
  } catch (error) {
    console.error('Error getting user team IDs:', error)
  }
  return teamIds
}

function isFlowRelevantToUser(flow: Flow, userTeamIds: Set<string>, isAdmin: boolean): boolean {
  // For "My Flows", we want to show only flows where user is personally involved
  // Check if user owns or is consulted on any element
  const hasPersonalInvolvement = flow.elements.some(element => {
    // Check if user owns this element
    if (element.ownerTeamId && userTeamIds.has(element.ownerTeamId)) {
      return true
    }
    // Check if user is consulted on this element
    if (element.consultedTeamIds && element.consultedTeamIds.some(teamId => userTeamIds.has(teamId))) {
      return true
    }
    return false
  })

  // Return true only if user has personal involvement
  return hasPersonalInvolvement
}

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  const user = await getCurrentUser(event)

  let allFlows: Flow[] = []

  // Try to get flows from organized structure first
  try {
    const flowsKeys = await storage.getKeys('flows:')

    for (const key of flowsKeys) {
      const flow = await storage.getItem(key) as Flow
      if (flow && flow.completedAt) { // Only include completed flows
        allFlows.push(flow)
      }
    }

    if (allFlows.length === 0) {
      // Fall back to legacy format if organized structure doesn't exist
      const flows = (await storage.getItem('flows') as Flow[]) || []
      const flowsArray = Array.isArray(flows) ? flows : []
      allFlows = flowsArray.filter(flow => flow.completedAt)
    }
  } catch (error) {
    console.log('Error accessing flows structure:', error)
    // Fallback to legacy array format
    const flows = (await storage.getItem('flows') as Flow[]) || []
    const flowsArray = Array.isArray(flows) ? flows : []
    allFlows = flowsArray.filter(flow => flow.completedAt)
  }

  // If no user is logged in, return all non-hidden completed flows
  if (!user) {
    const publicFlows = allFlows.filter(flow => !flow.hidden)
    // Sort by completion date (most recent first)
    publicFlows.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    return { data: publicFlows }
  }

  // Get user's team memberships
  const userTeamIds = await getUserTeamIds(user.id, storage)
  const isAdmin = user.role === 'admin'

  // Filter flows based on user relevance
  const relevantFlows = allFlows.filter(flow => 
    isFlowRelevantToUser(flow, userTeamIds, isAdmin)
  )

  // Sort by completion date (most recent first)
  relevantFlows.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

  return { data: relevantFlows }
})