import type { Flow, Team } from '../../../db/schema'
import { useFlowRepository, useUserRepository, useTeamRepository } from "../../../storage/StorageFactory"
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

    const userRepo = useUserRepository()
    const user = await userRepo.findById(decoded.userId)
    return user
  } catch (error) {
    return null
  }
}

async function getUserTeamIds(userId: string): Promise<Set<string>> {
  const teamIds = new Set<string>()
  try {
    const teamRepo = useTeamRepository()
    const teams = await teamRepo.findTeamsWithUser(userId)
    teams.forEach(team => teamIds.add(team.id))
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
  const flowRepo = useFlowRepository()
  const user = await getCurrentUser(event)

  try {
    // Get all flows from repository
    const allFlows = await flowRepo.findAll()
    
    // Filter to only completed flows
    const completedFlows = allFlows.filter(flow => flow.completedAt)

    // If no user is logged in, return all non-hidden completed flows
    if (!user) {
      const publicFlows = completedFlows.filter(flow => !flow.hidden)
      // Sort by completion date (most recent first)
      publicFlows.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      return { data: publicFlows }
    }

    // Get user's team memberships
    const userTeamIds = await getUserTeamIds(user.id)
    const isAdmin = user.role === 'admin'

    // Filter flows based on user relevance
    const relevantFlows = completedFlows.filter(flow => 
      isFlowRelevantToUser(flow, userTeamIds, isAdmin)
    )

    // Sort by completion date (most recent first)
    relevantFlows.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

    return { data: relevantFlows }
  } catch (error) {
    console.error('Error fetching completed flows:', error)
    return { data: [] }
  }
})