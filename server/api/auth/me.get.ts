import jwt from 'jsonwebtoken'
import type { UserWithPassword } from '../../types/UserWithPassword'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  try {
    // Get the auth token from cookies
    const token = getCookie(event, 'auth-token')
    
    if (!token) {
      return {
        success: false,
        user: null,
        message: 'Not authenticated'
      }
    }

    // Verify the JWT token
    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    
    let decoded: any
    try {
      decoded = jwt.verify(token, secretKey)
    } catch (jwtError) {
      // Token is invalid or expired
      setCookie(event, 'auth-token', '', {
        httpOnly: true,
        secure: runtimeConfig.public.nodeEnv === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      })
      
      return {
        success: false,
        user: null,
        message: 'Invalid or expired token'
      }
    }

    // Get user from storage
    const storage = useDatabaseStorage()
    const user = await storage.getItem(`users:${decoded.userId}`) as UserWithPassword
    
    if (!user) {
      return {
        success: false,
        user: null,
        message: 'User not found'
      }
    }

    // Return user data without password hash
    const { passwordHash, ...userWithoutPassword } = user
    
    return {
      success: true,
      user: userWithoutPassword,
      message: 'Authenticated'
    }
  } catch (error: any) {
    return {
      success: false,
      user: null,
      message: 'Authentication check failed'
    }
  }
})