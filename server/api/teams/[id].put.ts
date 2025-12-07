import type { Team } from '../../db/schema'
import { useTeamRepository, useUserRepository } from "../../storage/StorageFactory"

/**
 * Request body for updating a team
 */
interface UpdateTeamRequest {
  name?: string
  userIds?: string[]
}

/**
 * Response for team update
 */
interface UpdateTeamResponse {
  success: true
  data: Team
}

/**
 * PUT /api/teams/[id]
 * 
 * Update a team
 */
export default defineEventHandler(async (event) => {
  const teamRepo = useTeamRepository()
  const userRepo = useUserRepository()
  
  try {
    const teamId = getRouterParam(event, 'id')
    const body: UpdateTeamRequest = await readBody(event)
    
    if (!teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Team ID is required'
      })
    }
    
    // Check if team exists
    const existingTeam = await teamRepo.findById(teamId)
    if (!existingTeam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Team not found'
      })
    }
    
    // Basic validation
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Team name must be a string'
        })
      }
      body.name = body.name.trim()
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Team name cannot be empty'
        })
      }
    }

    // Validate user IDs if provided
    if (body.userIds && body.userIds.length > 0) {
      for (const userId of body.userIds) {
        const user = await userRepo.findById(userId)
        if (!user) {
          throw createError({
            statusCode: 400,
            statusMessage: `User with ID ${userId} not found`
          })
        }
      }
    }
    
    // Update team using repository (handles validation including duplicate names)
    const updatedTeam = await teamRepo.update(teamId, body)
    
    return {
      success: true,
      data: updatedTeam
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error updating team:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating team: ${error.message}`
    })
  }
})