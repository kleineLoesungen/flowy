import type { User } from '../../../types/User'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const body = await readBody(event) as Omit<User, 'id'>
    
    // Validate required fields
    if (!body.name || !body.email || !body.role) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, email, and role are required'
      })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    // Check if email already exists
    const existingUserKeys = await storage.getKeys('users:')
    for (const key of existingUserKeys) {
      const existingUser = await storage.getItem(key) as User
      if (existingUser && existingUser.email.toLowerCase() === body.email.toLowerCase()) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email already exists'
        })
      }
    }
    
    // Create new user
    const user: User = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role,
      teamIds: body.teamIds || []
    }
    
    // Store the user
    const key = `users:${user.id}`
    await storage.setItem(key, user)
    
    return {
      success: true,
      data: user
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user',
      data: error
    })
  }
})