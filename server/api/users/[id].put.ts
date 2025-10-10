import type { User } from '../../../types/User'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const userId = getRouterParam(event, 'id')
    const body = await readBody(event) as Omit<User, 'id'>
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }
    
    // Validate required fields
    if (!body.name || !body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and email are required'
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
    
    // Check if user exists
    const key = `users:${userId}`
    const existingUser = await storage.getItem(key) as User
    
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Check if email already exists (excluding current user)
    const existingUserKeys = await storage.getKeys('users:')
    for (const userKey of existingUserKeys) {
      if (userKey !== key) {
        const otherUser = await storage.getItem(userKey) as User
        if (otherUser && otherUser.email.toLowerCase() === body.email.toLowerCase()) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Email already exists'
          })
        }
      }
    }
    
    // Update the user
    const updatedUser: User = {
      id: userId,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase()
    }
    
    await storage.setItem(key, updatedUser)
    
    return {
      success: true,
      data: updatedUser
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user',
      data: error
    })
  }
})