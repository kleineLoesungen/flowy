import type { Flow } from '../../db/schema'
import { useFlowRepository, useUserRepository, useTeamRepository } from "../../storage/StorageFactory"
import jwt from 'jsonwebtoken'

/**
 * Response for flows list
 */
interface FlowsListResponse {
  success: true
  data: Flow[]
}

/**
 * GET /api/flows - Get flows (public endpoint)
 * @returns List of flows (all flows for public access, filtered by role if authenticated)
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
  
  try {
    // Get current user from JWT (optional for this endpoint)
    const currentUser = await getCurrentUser(event)

    // Get flows accessible to user
    // If user is authenticated: admin sees all, member sees only flows for their teams
    // If user is not authenticated: show all flows (public access)
    let flows: Flow[]
    if (!currentUser) {
      // Public access - show only non-hidden, active (non-completed) flows
      flows = await flowRepo.findActive()
    } else if (currentUser.role === 'admin') {
      // Admin sees all active (non-completed) flows, including hidden ones
      const allFlows = await flowRepo.findAll()
      flows = allFlows.filter(flow => !flow.completedAt)
    } else {
      // For non-admin users, find active flows where their teams are involved
      // Include hidden flows if user is part of the involved teams
      const teamRepo = useTeamRepository()
      const userTeams = await teamRepo.findTeamsWithUser(currentUser.id)
      const userTeamIds = userTeams.map(team => team.id)
      
      // Get all non-completed flows and filter by team involvement
      const allFlows = await flowRepo.findAll()
      flows = allFlows.filter(flow => {
        // Exclude completed flows
        if (flow.completedAt) return false
        
        // Check if user is involved in the flow
        const isInvolved = flow.elements.some(element => 
          (element.ownerTeamId && userTeamIds.includes(element.ownerTeamId)) ||
          (element.consultedTeamIds && element.consultedTeamIds.some(teamId => userTeamIds.includes(teamId)))
        )
        
        return isInvolved
      })
    }

    // Sort flows by creation date (newest first)
    flows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      success: true,
      data: flows
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Flows API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch flows',
      data: { message: error.message, stack: error.stack }
    })
  }
})