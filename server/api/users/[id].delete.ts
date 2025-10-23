import type { User } from '../../../types/User'
import type { Team } from '../../../types/Team'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
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

    // Get current authenticated user to prevent self-deletion
    const token = getCookie(event, 'auth-token')
    if (token) {
      try {
        const runtimeConfig = useRuntimeConfig()
        const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
        const decoded = jwt.verify(token, secretKey) as { userId: string }
        
        if (decoded.userId === userId) {
          throw createError({
            statusCode: 403,
            statusMessage: 'You cannot delete your own account. Please ask another admin to delete it for you.'
          })
        }
      } catch (jwtError) {
        // If JWT is invalid, we'll let the deletion proceed (this means no one is authenticated)
        // This covers API calls made without proper authentication
      }
    }
    
    // Check if this is an admin user and if deleting would leave no admins
    if (user.role === 'admin') {
      const allUserKeys = await storage.getKeys('users:')
      const adminUsers: User[] = []
      
      for (const userKey of allUserKeys) {
        const u = await storage.getItem(userKey) as User
        if (u && u.role === 'admin' && u.id !== userId) {
          adminUsers.push(u)
        }
      }
      
      if (adminUsers.length === 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Cannot delete the last admin user. At least one admin must remain in the system.'
        })
      }
    }
    
    // Check if user is referenced in any teams
    const teamKeys = await storage.getKeys('teams:')
    const referencingTeams: string[] = []
    
    for (const teamKey of teamKeys) {
      const team = await storage.getItem(teamKey) as Team
      if (team && team.userIds && team.userIds.includes(userId)) {
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