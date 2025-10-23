import type { Team } from '../../../types/Team'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
  try {
    const teamId = getRouterParam(event, 'id')
    
    if (!teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Team ID is required'
      })
    }
    
    // Check if team exists
    const teamKey = `teams:${teamId}`
    const team = await storage.getItem(teamKey) as Team
    
    if (!team) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Team not found'
      })
    }
    
    // Delete the team
    await storage.removeItem(teamKey)
    
    return {
      success: true,
      message: 'Team deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete team',
      data: error
    })
  }
})