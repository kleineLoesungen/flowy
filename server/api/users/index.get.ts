import { useUserRepository } from '../../storage/StorageFactory'
import type { User } from '../../db/schema'

/**
 * User response (without sensitive data)
 */
interface UserResponse {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Response for users list
 */
interface UsersListResponse {
  success: true
  data: UserResponse[]
}

/**
 * GET /api/users
 * 
 * Get list of all users (admin only)
 */
export default defineEventHandler(async (event) => {
  try {
    const userRepo = useUserRepository()
    
    // Get all users without password hash
    const users = await userRepo.findAllPublic()
    
    // Sort users by name
    const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name))
    
    return {
      success: true,
      data: sortedUsers
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users'
    })
  }
})