import type { NewTeam, Team } from '../../db/schema'
import { useTeamRepository, useUserRepository } from "../../storage/StorageFactory"

/**
 * Request body for creating a team
 */
interface CreateTeamRequest {
  name: string
  userIds?: string[]
}

/**
 * Response for team creation
 */
interface CreateTeamResponse {
  success: true
  data: Team
}

/**
 * POST /api/teams
 * 
 * Create a new team
 */
export default defineEventHandler(async (event) => {
  const teamRepo = useTeamRepository()
  const userRepo = useUserRepository()
  
  try {
    const body: CreateTeamRequest = await readBody(event)

    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Team name is required'
      })
    }

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

    const teamData = {
      name: body.name,
      userIds: body.userIds || []
    }

    const team = await teamRepo.create(teamData)
    return { success: true, data: team }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Error creating team: ${error.message}`
    })
  }
})
