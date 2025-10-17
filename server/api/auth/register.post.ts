import bcrypt from 'bcryptjs'
import type { UserWithPassword } from '../../types/UserWithPassword'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const { name, email, password } = await readBody(event)

  if (!name || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name, email and password are required'
    })
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 6 characters long'
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format'
    })
  }

  try {
    const storage = useFileStorage()
    
    // Get all existing users
    const userKeys = await storage.getKeys('users:')
    const existingUsers: UserWithPassword[] = []
    
    for (const key of userKeys) {
      const userData = await storage.getItem(key) as UserWithPassword
      if (userData) {
        existingUsers.push(userData)
      }
    }
    
    // Check if email already exists
    const existingUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already exists'
      })
    }

    // Determine role: first user is admin, others are members
    const role = existingUsers.length === 0 ? 'admin' : 'member'

    // Hash the password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser: UserWithPassword = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      passwordHash
    }

    // Store the user
    const userKey = `users:${newUser.id}`
    await storage.setItem(userKey, newUser)
    
    return {
      success: true,
      message: `User registered successfully${role === 'admin' ? ' as administrator' : ''}`
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