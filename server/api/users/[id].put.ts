import type { User } from '../../../types/User'
import type { UserWithPassword } from '../../types/UserWithPassword'
import useFileStorage from '../../utils/useFileStorage'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const userId = getRouterParam(event, 'id')
    const body = await readBody(event) as Omit<User, 'id'> & { password?: string }
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }
    
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
    
    // Check if user exists
    const key = `users:${userId}`
    const existingUser = await storage.getItem(key) as UserWithPassword
    
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Check if trying to change the last admin to member
    if (existingUser.role === 'admin' && body.role === 'member') {
      const allUserKeys = await storage.getKeys('users:')
      const otherAdminUsers: User[] = []
      
      for (const userKey of allUserKeys) {
        if (userKey !== key) {
          const u = await storage.getItem(userKey) as User
          if (u && u.role === 'admin') {
            otherAdminUsers.push(u)
          }
        }
      }
      
      if (otherAdminUsers.length === 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Cannot change role of the last admin user. At least one admin must remain in the system.'
        })
      }
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
    
    // Hash new password if provided, otherwise preserve existing passwordHash
    let newPasswordHash = existingUser.passwordHash
    if (body.password) {
      newPasswordHash = await bcrypt.hash(body.password, 12)
    }

    // Update the user
    const updatedUser = {
      id: userId,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role,
      ...(newPasswordHash && { passwordHash: newPasswordHash })
    }

    await storage.setItem(key, updatedUser)

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser
    
    return {
      success: true,
      data: userWithoutPassword
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