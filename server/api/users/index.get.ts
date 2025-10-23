import type { User } from '../../../types/User'
import type { UserWithPassword } from '../../types/UserWithPassword'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
  try {
    // Get all users from storage
    const userKeys = await storage.getKeys('users:')
    const users: (User & { hasPassword: boolean })[] = []
    
    for (const key of userKeys) {
      const userData = await storage.getItem(key) as UserWithPassword
      if (userData) {
        // Remove passwordHash before returning to client, but include hasPassword flag
        const { passwordHash, ...user } = userData
        const userWithPasswordStatus = {
          ...user,
          hasPassword: passwordHash != null && passwordHash.trim() !== ''
        }
        users.push(userWithPasswordStatus)
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