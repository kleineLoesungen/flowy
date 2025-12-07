import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { useUserRepository } from '../../storage/StorageFactory'

/**
 * Request body for changing password
 */
interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * Response data for successful password change
 */
interface ChangePasswordResponse {
  success: true
  data: {
    message: string
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
 * POST /api/auth/change-password
 * 
 * Change user's password (requires authentication)
 */
export default defineEventHandler(async (event) => {
  try {
    // Get token from cookie for authentication
    const token = getCookie(event, 'auth-token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Verify JWT token
    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    
    let decoded: { userId: string }
    
    try {
      decoded = jwt.verify(token, secretKey) as { userId: string }
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    }

    const { currentPassword, newPassword }: ChangePasswordRequest = await readBody(event)
    
    // Validation
    if (!currentPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password and new password are required'
      })
    }

    if (newPassword.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password must be at least 6 characters long'
      })
    }

    const userRepo = useUserRepository()
    
    // Get user from database
    const user = await userRepo.findById(decoded.userId)
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Verify current password
    if (!user.passwordHash) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No password is currently set for this user'
      })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    
    if (!isCurrentPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect'
      })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)
    
    // Update user password
    await userRepo.update(decoded.userId, {
      passwordHash: hashedNewPassword
    })

    return {
      success: true,
      message: 'Password changed successfully'
    }
  } catch (error) {
    console.error('Change password error:', error)
    
    // Handle HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to change password'
    })
  }
})