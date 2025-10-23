import type { Team } from '../../../types/Team'
import type { User } from '../../../types/User'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
  try {
    const teamId = getRouterParam(event, 'id')
    const body = await readBody(event) as Omit<Team, 'id'>
    
    if (!teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Team ID is required'
      })
    }
    
    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Team name is required'
      })
    }
    
    // Check if team exists
    const key = `teams:${teamId}`
    const existingTeam = await storage.getItem(key) as Team
    
    if (!existingTeam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Team not found'
      })
    }
    
    // Check if team name already exists (excluding current team)
    const existingTeamKeys = await storage.getKeys('teams:')
    for (const teamKey of existingTeamKeys) {
      if (teamKey !== key) {
        const otherTeam = await storage.getItem(teamKey) as Team
        if (otherTeam && otherTeam.name.toLowerCase() === body.name.toLowerCase()) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Team name already exists'
          })
        }
      }
    }
    
    // Validate user IDs if provided
    if (body.userIds && body.userIds.length > 0) {
      const userKeys = await storage.getKeys('users:')
      const existingUserIds = new Set<string>()
      
      for (const userKey of userKeys) {
        const user = await storage.getItem(userKey) as User
        if (user) {
          existingUserIds.add(user.id)
        }
      }
      
      const invalidUserIds = body.userIds.filter(userId => !existingUserIds.has(userId))
      if (invalidUserIds.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid user IDs: ${invalidUserIds.join(', ')}`
        })
      }
    }
    
    // Update the team
    const updatedTeam: Team = {
      id: teamId,
      name: body.name.trim(),
      userIds: body.userIds || []
    }
    
    await storage.setItem(key, updatedTeam)
    
    return {
      success: true,
      data: updatedTeam
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update team',
      data: error
    })
  }
})