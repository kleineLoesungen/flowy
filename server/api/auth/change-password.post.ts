import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { UserWithPassword } from '../../types/UserWithPassword'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const body = await readBody(event) as {
      currentPassword: string
      newPassword: string
    }
    
    // Get JWT token from cookies
    const token = getCookie(event, 'auth-token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required. Please log in again.'
      })
    }
    
    // Verify JWT token
    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    
    let userId: string
    try {
      const decoded = jwt.verify(token, secretKey) as { userId: string }
      userId = decoded.userId
    } catch (error: any) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication token has expired. Please log in again.'
      })
    }
    
    // Validate required fields
    if (!body.currentPassword || !body.newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password and new password are required'
      })
    }
    
    // Validate new password length
    if (body.newPassword.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password must be at least 6 characters long'
      })
    }
    
    // Get user from storage
    const key = `users:${userId}`
    const user = await storage.getItem(key) as UserWithPassword
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Check if user has a password set
    if (!user.passwordHash) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No password set for this user'
      })
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(body.currentPassword, user.passwordHash)
    
    if (!isCurrentPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect'
      })
    }
    
    // Hash the new password
    const newPasswordHash = await bcrypt.hash(body.newPassword, 12)
    
    // Update user with new password
    const updatedUser = {
      ...user,
      passwordHash: newPasswordHash
    }
    
    await storage.setItem(key, updatedUser)
    
    return {
      success: true,
      message: 'Password changed successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to change password',
      data: error
    })
  }
})