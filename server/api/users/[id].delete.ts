import { useUserRepository, useTeamRepository } from '../../storage/StorageFactory'
import jwt from 'jsonwebtoken'

/**
 * Response for user deletion
 */
interface DeleteUserResponse {
  success: true
  message: string
}

/**
 * JWT token payload for current user verification
 */
interface JwtPayload {
  userId: string
  email: string
  role: 'admin' | 'member'
}

/**
 * DELETE /api/users/[id]
 * 
 * Delete a user (admin only)
 */
export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, 'id')
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }
    
    const userRepo = useUserRepository()
    const teamRepo = useTeamRepository()
    
    // Check if user exists
    const user = await userRepo.findById(userId)
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
      }
    }
    
    // Check if this is an admin user and if deleting would leave no admins
    if (user.role === 'admin') {
      const adminCount = await userRepo.countAdmins()
      if (adminCount <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot delete the last admin user'
        })
      }
    }
    
    // Remove user from all teams
    const userTeams = await teamRepo.findTeamsWithUser(userId)
    for (const team of userTeams) {
      await teamRepo.removeUserFromTeam(team.id, userId)
    }
    
    // Delete the user
    const deleted = await userRepo.delete(userId)
    
    if (!deleted) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete user'
      })
    }
    
    return {
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    
    // Handle HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete user'
    })
  }
})