import type { NewUser, User } from '../../db/schema'
import { useUserRepository } from '../../storage/StorageFactory'
import bcrypt from 'bcryptjs'

/**
 * Request body for creating a user
 */
interface CreateUserRequest {
  name: string
  email: string
  password?: string
  passwordHash?: string
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
 * Response for user creation
 */
interface CreateUserResponse {
  success: true
  data: UserResponse
}

/**
 * POST /api/users
 * 
 * Create a new user (admin only)
 */
export default defineEventHandler(async (event) => {
  try {
    const body: CreateUserRequest = await readBody(event)
    const { name, email, password, passwordHash, role = 'member' } = body

    // Validation
    if (!name || !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and email are required'
      })
    }

    const userRepo = useUserRepository()

    // Create user data - handle both password and passwordHash
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash: passwordHash || (password ? await bcrypt.hash(password, 12) : ''),
      role
    }

    const user = await userRepo.create(userData)
    
    // Return user without password hash
    const { passwordHash: _, ...userResponse } = user
    
    return {
      success: true,
      data: { ...userResponse, hasPassword: !!user.passwordHash }
    }
  } catch (error) {
    console.error('Error creating user:', error)
    
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
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user'
    })
  }
})