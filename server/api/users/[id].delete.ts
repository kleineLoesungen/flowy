import type { User } from '../../../types/User'
import type { Team } from '../../../types/Team'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const userId = getRouterParam(event, 'id')
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }
    
    // Check if user exists
    const userKey = `users:${userId}`
    const user = await storage.getItem(userKey) as User
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Check if user is referenced in any teams
    const teamKeys = await storage.getKeys('teams:')
    const referencingTeams: string[] = []
    
    for (const teamKey of teamKeys) {
      const team = await storage.getItem(teamKey) as Team
      if (team && team.userIds.includes(userId)) {
        referencingTeams.push(team.name)
      }
    }
    
    if (referencingTeams.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot delete user. User is a member of teams: ${referencingTeams.join(', ')}`
      })
    }
    
    // Delete the user
    await storage.removeItem(userKey)
    
    return {
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete user',
      data: error
    })
  }
})