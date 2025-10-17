import type { User } from '../../../types/User'
import type { UserWithPassword } from '../../types/UserWithPassword'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    // Get all users from storage
    const userKeys = await storage.getKeys('users:')
    const users: User[] = []
    
    for (const key of userKeys) {
      const userData = await storage.getItem(key) as UserWithPassword
      if (userData) {
        // Remove passwordHash before returning to client
        const { passwordHash, ...user } = userData
        users.push(user)
      }
    }
    
    // Sort users by name
    users.sort((a, b) => a.name.localeCompare(b.name))
    
    return {
      success: true,
      data: users
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users',
      data: error
    })
  }
})