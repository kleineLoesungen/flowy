import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockUserRepo, clearAllMockData } from '../setup'

// Dynamic imports for the handlers
let registerHandler: any
let logoutHandler: any

describe('Auth API Operations', () => {
  beforeEach(async () => {
    // Clear all mock data before each test
    clearAllMockData()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Reset repository mocks
    mockUserRepo.create.mockClear()
    mockUserRepo.countAdmins.mockClear()
    
    // Dynamic imports to avoid module resolution issues
    const registerModule = await import('../../server/api/auth/register.post')
    const logoutModule = await import('../../server/api/auth/logout.post')
    
    registerHandler = registerModule.default
    logoutHandler = logoutModule.default
  })

  describe('REGISTER - POST /api/auth/register', () => {
    it('should register first user as admin', async () => {
      const registerData = {
        name: 'First Admin',
        email: 'admin@example.com',
        password: 'password123'
      }

      ;(globalThis as any).readBody.mockResolvedValue(registerData)
      mockUserRepo.countAdmins.mockResolvedValue(0) // No admins exist
      
      const createdUser = {
        id: 'user1',
        name: 'First Admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasPassword: true
      }
      mockUserRepo.create.mockResolvedValue(createdUser)

      const mockEvent = {}
      const result = await registerHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(result.message).toBe('User registered successfully')
      expect(result.user.role).toBe('admin')
      expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'First Admin',
        email: 'admin@example.com',
        role: 'admin'
      }))
    })

    it('should register subsequent users as members', async () => {
      const registerData = {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123'
      }

      ;(globalThis as any).readBody.mockResolvedValue(registerData)
      mockUserRepo.countAdmins.mockResolvedValue(1) // Admin exists
      
      const createdUser = {
        id: 'user2',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasPassword: true
      }
      mockUserRepo.create.mockResolvedValue(createdUser)

      const mockEvent = {}
      const result = await registerHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(result.user.role).toBe('member')
    })

    it('should reject registration with missing fields', async () => {
      const registerData = {
        email: 'user@example.com'
        // Missing name and password
      }

      ;(globalThis as any).readBody.mockResolvedValue(registerData)

      const mockEvent = {}

      await expect(registerHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Name, email, and password are required'
      })
    })

    it('should reject registration with invalid email format', async () => {
      const registerData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      }

      ;(globalThis as any).readBody.mockResolvedValue(registerData)

      const mockEvent = {}

      await expect(registerHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    })

    it('should handle duplicate email error from repository', async () => {
      const registerData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      }

      ;(globalThis as any).readBody.mockResolvedValue(registerData)
      mockUserRepo.countAdmins.mockResolvedValue(1)
      
      // Mock repository to throw duplicate error
      const duplicateError = new Error('Email already exists')
      ;(duplicateError as any).statusCode = 409
      ;(duplicateError as any).statusMessage = 'Email already exists'
      mockUserRepo.create.mockRejectedValue(duplicateError)

      const mockEvent = {}

      await expect(registerHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Email already exists'
      })
    })
  })

  describe('LOGOUT - POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const mockEvent = {}
      const result = await logoutHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Logout successful')
    })
  })

  describe('Auth Validation Tests', () => {
    it('should validate email format correctly', async () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        ''
      ]

      for (const email of invalidEmails) {
        const registerData = {
          name: 'Test User',
          email: email,
          password: 'password123'
        }

        ;(globalThis as any).readBody.mockResolvedValue(registerData)

        await expect(registerHandler({})).rejects.toThrow()
        expect((globalThis as any).createError).toHaveBeenCalledWith({
          statusCode: 400,
          statusMessage: 'Invalid email format'
        })
      }
    })

    it('should handle various registration error scenarios', async () => {
      // Test missing name
      let registerData = {
        email: 'test@example.com',
        password: 'password123'
      }
      ;(globalThis as any).readBody.mockResolvedValue(registerData)
      
      await expect(registerHandler({})).rejects.toThrow()

      // Test missing email  
      registerData = {
        name: 'Test User',
        password: 'password123'
      } as any
      ;(globalThis as any).readBody.mockResolvedValue(registerData)
      
      await expect(registerHandler({})).rejects.toThrow()

      // Test missing password
      registerData = {
        name: 'Test User',
        email: 'test@example.com'
      } as any
      ;(globalThis as any).readBody.mockResolvedValue(registerData)
      
      await expect(registerHandler({})).rejects.toThrow()
    })
  })

  describe('Auth Integration Tests', () => {
    it('should handle admin user registration flow', async () => {
      // First user becomes admin
      const firstUserData = {
        name: 'First Admin',
        email: 'admin@company.com',
        password: 'securePassword123'
      }

      ;(globalThis as any).readBody.mockResolvedValue(firstUserData)
      mockUserRepo.countAdmins.mockResolvedValue(0) // No admins
      
      const adminUser = {
        id: 'admin1',
        name: 'First Admin',
        email: 'admin@company.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasPassword: true
      }
      mockUserRepo.create.mockResolvedValue(adminUser)

      let result = await registerHandler({})
      expect(result.success).toBe(true)
      expect(result.user.role).toBe('admin')

      // Second user becomes member
      const secondUserData = {
        name: 'Regular Employee',
        email: 'employee@company.com', 
        password: 'password123'
      }

      ;(globalThis as any).readBody.mockResolvedValue(secondUserData)
      mockUserRepo.countAdmins.mockResolvedValue(1) // Admin exists now
      
      const memberUser = {
        id: 'member1',
        name: 'Regular Employee',
        email: 'employee@company.com',
        role: 'member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasPassword: true
      }
      mockUserRepo.create.mockResolvedValue(memberUser)

      result = await registerHandler({})
      expect(result.success).toBe(true)
      expect(result.user.role).toBe('member')
    })

    it('should handle logout after successful registration', async () => {
      // Register user
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      ;(globalThis as any).readBody.mockResolvedValue(registerData)
      mockUserRepo.countAdmins.mockResolvedValue(0)
      
      const createdUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasPassword: true
      }
      mockUserRepo.create.mockResolvedValue(createdUser)

      let result = await registerHandler({})
      expect(result.success).toBe(true)

      // Logout
      result = await logoutHandler({})
      expect(result.success).toBe(true)
      expect(result.message).toBe('Logout successful')
    })
  })
})