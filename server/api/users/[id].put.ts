import { useUserRepository } from '../../storage/StorageFactory'
import bcrypt from 'bcryptjs'
import type { User } from '../../db/schema'

/**
 * Request body for updating a user
 */
interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
  role?: 'admin' | 'member'
}

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
 * Response for user update
 */
interface UpdateUserResponse {
  success: true
  data: UserResponse
}

/**
 * PUT /api/users/[id]
 * 
 * Update a user (admin only or own profile)
 */
export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, 'id')
    const body: UpdateUserRequest = await readBody(event)
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const userRepo = useUserRepository()
    
    // Check if user exists
    const existingUser = await userRepo.findById(userId)
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Check if trying to demote the last admin
    if (existingUser.role === 'admin' && body.role === 'member') {
      const adminCount = await userRepo.countAdmins()
      if (adminCount <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot demote the last admin user'
        })
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }
    
    if (body.email !== undefined) {
      updateData.email = body.email.toLowerCase()
    }
    
    if (body.role !== undefined) {
      updateData.role = body.role
    }
    
    if (body.password !== undefined) {
      updateData.passwordHash = body.password ? await bcrypt.hash(body.password, 12) : ''
    }

    // Update the user
    const updatedUser = await userRepo.update(userId, updateData)
    
    // Return user without password hash
    const { passwordHash, ...userResponse } = updatedUser
    
    return {
      success: true,
      data: { ...userResponse, hasPassword: !!passwordHash }
    }
  } catch (error) {
    console.error('Error updating user:', error)
    
    // Handle specific validation errors
    if (error instanceof Error) {
      if (error.message === 'Email already exists') {
        throw createError({ statusCode: 409, statusMessage: error.message })
      }
      if (error.message === 'Invalid email format') {
        throw createError({ statusCode: 400, statusMessage: error.message })
      }
      if (error.message.includes('Invalid role')) {
        throw createError({ statusCode: 400, statusMessage: error.message })
      }
      if (error.message === 'Cannot demote the last admin user') {
        throw createError({ statusCode: 400, statusMessage: error.message })
      }
    }
    
    // Handle HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user'
    })
  }
})