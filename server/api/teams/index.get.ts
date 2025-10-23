import type { Team } from '../../../types/Team'
import type { User } from '../../../types/User'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
  try {
    // Get all teams from storage
    const teamKeys = await storage.getKeys('teams:')
    const teams: (Team & { users: User[] })[] = []
    
    // Get all users for population
    const userKeys = await storage.getKeys('users:')
    const allUsers: User[] = []
    for (const userKey of userKeys) {
      const user = await storage.getItem(userKey) as User
      if (user) {
        allUsers.push(user)
      }
    }
    
    // Create user lookup map
    const userMap = new Map(allUsers.map(user => [user.id, user]))
    
    for (const key of teamKeys) {
      const team = await storage.getItem(key) as Team
      if (team) {
        // Populate user details
        const users = team.userIds
          .map(userId => userMap.get(userId))
          .filter(user => user !== undefined) as User[]
        
        teams.push({
          ...team,
          users
        })
      }
    }
    
    // Sort teams by name
    teams.sort((a, b) => a.name.localeCompare(b.name))
    
    return {
      success: true,
      data: teams
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch teams',
      data: error
    })
  }
})