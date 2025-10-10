import type { Team } from '../../../types/Team'
import type { User } from '../../../types/User'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const body = await readBody(event) as Omit<Team, 'id'>
    
    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Team name is required'
      })
    }
    
    // Check if team name already exists
    const existingTeamKeys = await storage.getKeys('teams:')
    for (const key of existingTeamKeys) {
      const existingTeam = await storage.getItem(key) as Team
      if (existingTeam && existingTeam.name.toLowerCase() === body.name.toLowerCase()) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Team name already exists'
        })
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
    
    // Create new team
    const team: Team = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: body.name.trim(),
      userIds: body.userIds || []
    }
    
    // Store the team
    const key = `teams:${team.id}`
    await storage.setItem(key, team)
    
    return {
      success: true,
      data: team
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create team',
      data: error
    })
  }
})