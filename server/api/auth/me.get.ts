import jwt from 'jsonwebtoken'
import { useUserRepository } from '../../storage/StorageFactory'
import type { User } from '../../db/schema'

/**
 * Response data for user profile
 */
interface MeResponse {
  success: true
  data: {
    user: Omit<User, 'passwordHash'> & { hasPassword: boolean }
  }
}

/**
 * JWT token payload
 */
interface JwtPayload {
  userId: string
  email: string
  role: 'admin' | 'member'
}

/**
 * GET /api/auth/me
 * 
 * Get current user information
 */
export default defineEventHandler(async (event) => {
  try {
    // Get token from cookie
    const token = getCookie(event, 'auth-token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No authentication token provided'
      })
    }

    // Verify JWT token
    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    
    let decoded: { userId: string; email: string; role: string }
    
    try {
      decoded = jwt.verify(token, secretKey) as { userId: string; email: string; role: string }
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    }

    // Get user from database to ensure they still exist and get latest data
    const userRepo = useUserRepository()
    const user = await userRepo.findById(decoded.userId)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found'
      })
    }

    // Return user data without password hash
    const { passwordHash, ...userResponse } = user

    return {
      success: true,
      data: {
        user: { ...userResponse, hasPassword: !!passwordHash },
        tokenValid: true
      }
    }
  } catch (error) {
    // Handle HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Only log unexpected server errors, not expected authentication errors (401)
      if (error.statusCode !== 401) {
        console.error('Auth verification error:', error)
      }
      throw error
    }
    
    // Log unexpected errors
    console.error('Auth verification error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication verification failed'
    })
  }
})