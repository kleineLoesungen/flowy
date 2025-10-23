import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { UserWithPassword } from '../../types/UserWithPassword'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required'
    })
  }

  try {
    const storage = useDatabaseStorage()
    
    // Get all users from storage
    const userKeys = await storage.getKeys('users:')
    const users: UserWithPassword[] = []
    
    for (const key of userKeys) {
      const user = await storage.getItem(key) as UserWithPassword
      if (user) {
        users.push(user)
      }
    }
    
    // Find user by email
    const user = users.find(u => u.email === email)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Create JWT token
    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secretKey,
      { expiresIn: '24h' }
    )

    // Set HTTP-only cookie that expires at midnight
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
    
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: runtimeConfig.public.nodeEnv === 'production',
      sameSite: 'strict',
      expires: midnight
    })

    // Return user data without password hash
    const { passwordHash, ...userWithoutPassword } = user
    
    return {
      success: true,
      user: userWithoutPassword,
      message: 'Login successful'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})