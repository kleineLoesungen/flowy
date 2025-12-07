import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockStorage, mockUserRepo, mockTeamRepo, clearAllMockData } from '../setup'

// Dynamic imports for the handlers
let createUserHandler: any
let getUsersHandler: any  
let updateUserHandler: any
let deleteUserHandler: any

describe('Users API CRUD Operations', () => {
  beforeEach(async () => {
    // Clear all mock data before each test
    clearAllMockData()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Reset repository mocks
    mockUserRepo.create.mockClear()
    mockUserRepo.findAll.mockClear()
    mockUserRepo.findById.mockClear()
    mockUserRepo.update.mockClear()
    mockUserRepo.delete.mockClear()
    mockUserRepo.findByEmail.mockClear()
    mockUserRepo.findAllPublic.mockClear()
    mockUserRepo.countAdmins.mockClear()
    mockUserRepo.validateData.mockClear()
    mockTeamRepo.findTeamsWithUser.mockClear()
    
    // Dynamic imports to avoid module resolution issues
    const createModule = await import('../../server/api/users/index.post')
    const getModule = await import('../../server/api/users/index.get')
    const updateModule = await import('../../server/api/users/[id].put')
    const deleteModule = await import('../../server/api/users/[id].delete')
    
    createUserHandler = createModule.default
    getUsersHandler = getModule.default
    updateUserHandler = updateModule.default
    deleteUserHandler = deleteModule.default
  })

  describe('CREATE - POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        password: 'password123'
      }

      const createdUser = {
        id: 'aofbc7mfymhgqo26o',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        hasPassword: true,
        createdAt: '2025-11-01T20:32:41.232Z',
        updatedAt: '2025-11-01T20:32:41.232Z'
      }

      ;(globalThis as any).readBody.mockResolvedValue(userData)
      mockUserRepo.create.mockResolvedValue(createdUser)

      const mockEvent = {}
      const result = await createUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(createdUser)
      expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }))
    })

    it('should create a user with default role when not specified', async () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane@example.com'
      }

      const createdUser = {
        id: 'q5glwgoz7mhgqo26t',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'member',
        hasPassword: false,
        createdAt: '2025-11-01T20:32:41.237Z',
        updatedAt: '2025-11-01T20:32:41.237Z'
      }

      ;(globalThis as any).readBody.mockResolvedValue(userData)
      mockUserRepo.create.mockResolvedValue(createdUser)

      const mockEvent = {}
      const result = await createUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.role).toBe('member') // Default role
      expect(result.data.passwordHash).toBeUndefined()
    })

    it('should normalize email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        role: 'admin'
      }

      const createdUser = {
        id: 'r2jlcwo7tmhgqo26t',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        hasPassword: false,
        createdAt: '2025-11-01T20:32:41.237Z',
        updatedAt: '2025-11-01T20:32:41.237Z'
      }

      ;(globalThis as any).readBody.mockResolvedValue(userData)
      mockUserRepo.create.mockResolvedValue(createdUser)

      const mockEvent = {}
      const result = await createUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.email).toBe('test@example.com')
    })

    it('should reject duplicate email addresses', async () => {
      const userData = {
        name: 'New User',
        email: 'john@example.com' // Same email
      }

      ;(globalThis as any).readBody.mockResolvedValue(userData)
      // Mock the repository to throw validation error
      mockUserRepo.create.mockRejectedValue(new Error('Email already exists'))

      const mockEvent = {}

      await expect(createUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Email already exists'
      })
    })

    it('should reject duplicate email with different case', async () => {
      const userData = {
        name: 'New User',
        email: 'JOHN@EXAMPLE.COM' // Same email, different case
      }

      ;(globalThis as any).readBody.mockResolvedValue(userData)
      // Mock the repository to throw validation error
      mockUserRepo.create.mockRejectedValue(new Error('Email already exists'))

      const mockEvent = {}

      await expect(createUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Email already exists'
      })
  })

  describe('READ - GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      mockUserRepo.findAllPublic.mockResolvedValue([])
      
      const mockEvent = {}
      const result = await getUsersHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should return users without password hashes', async () => {
      // Add mock users
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        passwordHash: 'secrethash123',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      })
      await mockStorage.setItem('users:user2', {
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin',
        passwordHash: null,
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z'
      })

      const mockEvent = {}
      const result = await getUsersHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      
      // Users should be sorted by name
      expect(result.data[0].name).toBe('Jane Smith')
      expect(result.data[1].name).toBe('John Doe')
      
      // Check password handling
      expect(result.data[0]).not.toHaveProperty('passwordHash')
      expect(result.data[0].hasPassword).toBe(false) // null password
      expect(result.data[1]).not.toHaveProperty('passwordHash')
      expect(result.data[1].hasPassword).toBe(true) // has password
      
      // Verify other properties are present
      expect(result.data[0]).toHaveProperty('id')
      expect(result.data[0]).toHaveProperty('email')
      expect(result.data[0]).toHaveProperty('role')
      expect(result.data[0]).toHaveProperty('createdAt')
      expect(result.data[0]).toHaveProperty('updatedAt')
    })

    it('should handle users with empty password strings', async () => {
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'member',
        passwordHash: '', // Empty string
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      })

      const mockEvent = {}
      const result = await getUsersHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].hasPassword).toBe(false) // Empty string = no password
    })
  })

  describe('UPDATE - PUT /api/users/:id', () => {
    beforeEach(async () => {
      // Setup existing users
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        passwordHash: 'oldpassword'
      })
      await mockStorage.setItem('users:admin1', {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        passwordHash: 'adminpass'
      })
    })

    it('should update an existing user', async () => {
      const updateData = {
        name: 'John Updated',
        email: 'john.updated@example.com',
        role: 'admin'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}
      const result = await updateUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('John Updated')
      expect(result.data.email).toBe('john.updated@example.com')
      expect(result.data.role).toBe('admin')
      expect(result.data).not.toHaveProperty('passwordHash')

      // Verify storage was updated
      const storedUser = await mockStorage.getItem('users:user1')
      expect(storedUser.name).toBe('John Updated')
    })

    it('should update password when provided', async () => {
      // Mock bcrypt.hash - access the mock directly
      const bcrypt = await import('bcryptjs')
      vi.mocked(bcrypt.default.hash).mockResolvedValue('newhashvalue' as never)

      const updateData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        password: 'newpassword123'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}
      const result = await updateUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(bcrypt.default.hash).toHaveBeenCalledWith('newpassword123', 12)

      // Check stored user has new password hash
      const storedUser = await mockStorage.getItem('users:user1')
      expect(storedUser.passwordHash).toBe('newhashvalue')
    })

    it('should preserve existing password when not provided', async () => {
      const updateData = {
        name: 'John Updated',
        email: 'john@example.com',
        role: 'member'
        // No password field
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}
      const result = await updateUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      
      // Password should remain unchanged
      const storedUser = await mockStorage.getItem('users:user1')
      expect(storedUser.passwordHash).toBe('oldpassword')
    })

    it('should reject invalid email format', async () => {
      const updateData = {
        name: 'John Doe',
        email: 'invalid-email',
        role: 'member'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    })

    it('should reject duplicate email addresses', async () => {
      const updateData = {
        name: 'John Doe',
        email: 'admin@example.com', // Email of another user
        role: 'member'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Email already exists'
      })
    })

    it('should prevent changing the last admin to member', async () => {
      const updateData = {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'member' // Trying to change admin to member
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('admin1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Cannot change role of the last admin user. At least one admin must remain in the system.'
      })
    })

    it('should allow changing admin to member when other admins exist', async () => {
      // Add another admin user
      await mockStorage.setItem('users:admin2', {
        id: 'admin2',
        name: 'Second Admin',
        email: 'admin2@example.com',
        role: 'admin',
        passwordHash: 'admin2pass'
      })

      const updateData = {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'member'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('admin1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}
      const result = await updateUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.role).toBe('member')
    })

    it('should reject update for non-existent user', async () => {
      const updateData = {
        name: 'Non Existent',
        email: 'nonexistent@example.com',
        role: 'member'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('nonexistent')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    })

    it('should reject update with missing required fields', async () => {
      const updateData = {
        name: 'John Doe'
        // Missing email and role
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Name, email, and role are required'
      })
    })
  })

  describe('DELETE - DELETE /api/users/:id', () => {
    beforeEach(async () => {
      // Setup existing users
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      })
      await mockStorage.setItem('users:admin1', {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      })
    })

    it('should delete an existing user', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue('user1')

      const mockEvent = {}
      const result = await deleteUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.message).toBe('User deleted successfully')

      // Verify user was removed from storage
      const deletedUser = await mockStorage.getItem('users:user1')
      expect(deletedUser).toBeNull()
    })

    it('should prevent deleting the last admin user', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue('admin1')

      const mockEvent = {}

      await expect(deleteUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Cannot delete the last admin user. At least one admin must remain in the system.'
      })
    })

    it('should allow deleting admin when other admins exist', async () => {
      // Add another admin user
      await mockStorage.setItem('users:admin2', {
        id: 'admin2',
        name: 'Second Admin',
        email: 'admin2@example.com',
        role: 'admin'
      })

      ;(globalThis as any).getRouterParam.mockReturnValue('admin1')

      const mockEvent = {}
      const result = await deleteUserHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.message).toBe('User deleted successfully')
    })

    it('should prevent deleting user referenced in teams', async () => {
      // Add a team that references the user
      await mockStorage.setItem('teams:team1', {
        id: 'team1',
        name: 'Development Team',
        userIds: ['user1'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      })

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')

      const mockEvent = {}

      await expect(deleteUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Cannot delete user. User is a member of teams: Development Team'
      })
    })

    it('should prevent deleting user referenced in multiple teams', async () => {
      // Add teams that reference the user
      await mockStorage.setItem('teams:team1', {
        id: 'team1',
        name: 'Team Alpha',
        userIds: ['user1', 'admin1'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      })
      await mockStorage.setItem('teams:team2', {
        id: 'team2',
        name: 'Team Beta',
        userIds: ['user1'],
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z'
      })

      ;(globalThis as any).getRouterParam.mockReturnValue('user1')

      const mockEvent = {}

      await expect(deleteUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Cannot delete user. User is a member of teams: Team Alpha, Team Beta'
      })
    })

    it('should reject deletion of non-existent user', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue('nonexistent')

      const mockEvent = {}

      await expect(deleteUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    })

    it('should reject deletion without user ID', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue(undefined)

      const mockEvent = {}

      await expect(deleteUserHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    })
  })

  describe('Full CRUD Integration Test', () => {
    it('should perform complete CRUD cycle: Create -> Read -> Update -> Read -> Delete -> Read', async () => {
      // Add an admin user first to ensure we can change roles later
      await mockStorage.setItem('users:admin0', {
        id: 'admin0',
        name: 'Initial Admin',
        email: 'initial@example.com',
        role: 'admin'
      })

      // 1. CREATE
      const createData = {
        name: 'Integration User',
        email: 'integration@example.com',
        role: 'member', // Start as member to avoid admin restrictions
        passwordHash: 'testpassword'
      }
      ;(globalThis as any).readBody.mockResolvedValue(createData)
      
      const createResult = await createUserHandler({} as any)
      expect(createResult.success).toBe(true)
      const userId = createResult.data.id

      // 2. READ after create
      let readResult = await getUsersHandler({} as any)
      expect(readResult.success).toBe(true)
      expect(readResult.data).toHaveLength(2) // admin0 + new user
      const integrationUser = readResult.data.find((u: any) => u.name === 'Integration User')
      expect(integrationUser).toBeDefined()
      expect(integrationUser?.hasPassword).toBe(true)

      // 3. UPDATE
      const updateData = {
        name: 'Updated Integration User',
        email: 'updated.integration@example.com',
        role: 'member' // Keep as member
      }
      ;(globalThis as any).getRouterParam.mockReturnValue(userId)
      ;(globalThis as any).readBody.mockResolvedValue(updateData)
      
      const updateResult = await updateUserHandler({} as any)
      expect(updateResult.success).toBe(true)
      expect(updateResult.data.name).toBe('Updated Integration User')
      expect(updateResult.data.role).toBe('member')

      // 4. READ after update
      readResult = await getUsersHandler({} as any)
      expect(readResult.success).toBe(true)
      expect(readResult.data).toHaveLength(2)
      const updatedUser = readResult.data.find((u: any) => u.name === 'Updated Integration User')
      expect(updatedUser).toBeDefined()
      expect(updatedUser?.email).toBe('updated.integration@example.com')

      // 5. DELETE (member user can be deleted)
      ;(globalThis as any).getRouterParam.mockReturnValue(userId)
      
      const deleteResult = await deleteUserHandler({} as any)
      expect(deleteResult.success).toBe(true)

      // 6. READ after delete
      readResult = await getUsersHandler({} as any)
      expect(readResult.success).toBe(true)
      expect(readResult.data).toHaveLength(1) // Only admin0 remains
      expect(readResult.data[0].name).toBe('Initial Admin')
    })
  })
})}
