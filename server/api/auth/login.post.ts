import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { useUserRepository } from '../../storage/StorageFactory'
import type { User } from '../../db/schema'

/**
 * Request body for user login
 */
interface LoginRequest {
  email: string
  password: string
}

/**
 * Response data for successful login
 */
interface LoginResponse {
  success: true
  message: string
  data: {
    user: Omit<User, 'passwordHash'> & { hasPassword: boolean }
    token: string
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
 * POST /api/auth/login
 * 
 * Authenticate a user with email and password
 * 
 * @param event.body LoginRequest - User credentials
 * @returns LoginResponse - User data and JWT token
 */
export default defineEventHandler(async (event) => {
  try {
    const loginData: LoginRequest = await readBody(event)
    const { email, password } = loginData

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    const userRepo = useUserRepository()
    
    // Find user by email
    const user = await userRepo.findByEmail(email)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No password set for this user. Please contact an administrator.'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // Generate JWT token
    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      secretKey,
      { expiresIn: '24h' }
    )

    // Set auth cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    // Return user data without password hash
    const { passwordHash, ...userResponse } = user

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: { ...userResponse, hasPassword: true },
        token
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    
    // Handle HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})