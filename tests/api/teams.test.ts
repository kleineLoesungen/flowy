import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockStorage, setMockUser, clearMockUser, clearAllMockData } from '../setup'

// Dynamic imports for the handlers
let createTeamHandler: any
let getTeamsHandler: any  
let updateTeamHandler: any
let deleteTeamHandler: any

describe('Teams API CRUD Operations', () => {
  beforeEach(async () => {
    // Clear all mock data before each test
    clearAllMockData()
    clearMockUser()
    
    // Set up a mock authenticated user
    setMockUser({
      id: 'testuser1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    })
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Dynamic imports to avoid module resolution issues
    const createModule = await import('../../server/api/teams/index.post')
    const getModule = await import('../../server/api/teams/index.get')
    const updateModule = await import('../../server/api/teams/[id].put')
    const deleteModule = await import('../../server/api/teams/[id].delete')
    
    createTeamHandler = createModule.default
    getTeamsHandler = getModule.default
    updateTeamHandler = updateModule.default
    deleteTeamHandler = deleteModule.default
  })

  describe('CREATE - POST /api/teams', () => {
    it('should create a new team with valid data', async () => {
      // Add some mock users to storage
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      })
      await mockStorage.setItem('users:user2', {
        id: 'user2',
        name: 'Jane Smith', 
        email: 'jane@example.com',
        role: 'admin'
      })

      const teamData = {
        name: 'Development Team',
        userIds: ['user1', 'user2']
      }

      // Mock readBody to return our test data
      ;(globalThis as any).readBody.mockResolvedValue(teamData)

      const mockEvent = {}
      const result = await createTeamHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Development Team')
      expect(result.data.userIds).toEqual(['user1', 'user2'])
      expect(result.data.id).toBeDefined()
      expect(result.data.createdAt).toBeDefined()
      expect(result.data.updatedAt).toBeDefined()

      // Verify team was stored
      const storedTeam = await mockStorage.getItem(`teams:${result.data.id}`)
      expect(storedTeam).toEqual(result.data)
    })

    it('should create a team without userIds', async () => {
      const teamData = {
        name: 'Empty Team'
      }

      ;(globalThis as any).readBody.mockResolvedValue(teamData)

      const mockEvent = {}
      const result = await createTeamHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Empty Team')
      expect(result.data.userIds).toEqual([])
    })

    it('should reject duplicate team names', async () => {
      // Create an existing team
      await mockStorage.setItem('teams:existing', {
        id: 'existing',
        name: 'Existing Team',
        userIds: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      })

      const teamData = {
        name: 'Existing Team'
      }

      ;(globalThis as any).readBody.mockResolvedValue(teamData)

      const mockEvent = {}

      await expect(createTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Team name already exists'
      })
    })

    it('should reject invalid user IDs', async () => {
      const teamData = {
        name: 'Test Team',
        userIds: ['invalidUser1', 'invalidUser2']
      }

      ;(globalThis as any).readBody.mockResolvedValue(teamData)

      const mockEvent = {}

      await expect(createTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid user IDs: invalidUser1, invalidUser2'
      })
    })
  })

  describe('READ - GET /api/teams', () => {
    it('should return empty array when no teams exist', async () => {
      const mockEvent = {}
      const result = await getTeamsHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should return teams with populated user data', async () => {
      // Add mock users
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      })
      await mockStorage.setItem('users:user2', {
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin',
        created_at: '2025-01-02T00:00:00.000Z',
        updated_at: '2025-01-02T00:00:00.000Z'
      })

      // Add mock teams
      await mockStorage.setItem('teams:team1', {
        id: 'team1',
        name: 'Team Alpha',
        userIds: ['user1'],
        created_at: '2025-01-03T00:00:00.000Z',
        updated_at: '2025-01-03T00:00:00.000Z'
      })
      await mockStorage.setItem('teams:team2', {
        id: 'team2',
        name: 'Team Beta',
        userIds: ['user1', 'user2'],
        created_at: '2025-01-04T00:00:00.000Z',
        updated_at: '2025-01-04T00:00:00.000Z'
      })

      const mockEvent = {}
      const result = await getTeamsHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      
      // Teams should be sorted by name
      expect(result.data[0].name).toBe('Team Alpha')
      expect(result.data[1].name).toBe('Team Beta')
      
      // Check user population
      expect(result.data[0].users).toHaveLength(1)
      expect(result.data[0].users[0]).toEqual({
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      })

      expect(result.data[1].users).toHaveLength(2)
    })

    it('should handle teams with no users gracefully', async () => {
      await mockStorage.setItem('teams:team1', {
        id: 'team1',
        name: 'Empty Team',
        userIds: [],
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      })

      const mockEvent = {}
      const result = await getTeamsHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].users).toEqual([])
    })
  })

  describe('UPDATE - PUT /api/teams/:id', () => {
    beforeEach(async () => {
      // Setup existing team
      await mockStorage.setItem('teams:team1', {
        id: 'team1',
        name: 'Original Team',
        userIds: ['user1']
      })

      // Setup users
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com'
      })
      await mockStorage.setItem('users:user2', {
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com'
      })
    })

    it('should update an existing team', async () => {
      const updateData = {
        name: 'Updated Team Name',
        userIds: ['user1', 'user2']
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('team1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}
      const result = await updateTeamHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Team Name')
      expect(result.data.userIds).toEqual(['user1', 'user2'])

      // Verify storage was updated
      const storedTeam = await mockStorage.getItem('teams:team1')
      expect(storedTeam.name).toBe('Updated Team Name')
    })

    it('should reject update to duplicate team name', async () => {
      // Add another team
      await mockStorage.setItem('teams:team2', {
        id: 'team2',
        name: 'Other Team',
        userIds: []
      })

      const updateData = {
        name: 'Other Team',
        userIds: []
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('team1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Team name already exists'
      })
    })

    it('should reject update with invalid user IDs', async () => {
      const updateData = {
        name: 'Updated Team',
        userIds: ['invalidUser']
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('team1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Invalid user IDs: invalidUser'
      })
    })

    it('should reject update for non-existent team', async () => {
      const updateData = {
        name: 'Updated Team',
        userIds: []
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('nonexistent')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 404,
        statusMessage: 'Team not found'
      })
    })

    it('should reject update without team name', async () => {
      const updateData = {
        userIds: ['user1']
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('team1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Team name is required'
      })
    })
  })

  describe('DELETE - DELETE /api/teams/:id', () => {
    beforeEach(async () => {
      // Setup existing team
      await mockStorage.setItem('teams:team1', {
        id: 'team1',
        name: 'Team to Delete',
        userIds: []
      })
    })

    it('should delete an existing team', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue('team1')

      const mockEvent = {}
      const result = await deleteTeamHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Team deleted successfully')

      // Verify team was removed from storage
      const deletedTeam = await mockStorage.getItem('teams:team1')
      expect(deletedTeam).toBeNull()
    })

    it('should reject deletion of non-existent team', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue('nonexistent')

      const mockEvent = {}

      await expect(deleteTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 404,
        statusMessage: 'Team not found'
      })
    })

    it('should reject deletion without team ID', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue(undefined)

      const mockEvent = {}

      await expect(deleteTeamHandler(mockEvent as any)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Team ID is required'
      })
    })
  })

  describe('Full CRUD Integration Test', () => {
    it('should perform complete CRUD cycle: Create -> Read -> Update -> Read -> Delete -> Read', async () => {
      // Setup users first
      await mockStorage.setItem('users:user1', {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      })

      // 1. CREATE
      const createData = {
        name: 'Integration Test Team',
        userIds: ['user1']
      }
      ;(globalThis as any).readBody.mockResolvedValue(createData)
      
      const createResult = await createTeamHandler({} as any)
      expect(createResult.success).toBe(true)
      const teamId = createResult.data.id

      // 2. READ after create
      let readResult = await getTeamsHandler({} as any)
      expect(readResult.success).toBe(true)
      expect(readResult.data).toHaveLength(1)
      expect(readResult.data[0].name).toBe('Integration Test Team')

      // 3. UPDATE
      const updateData = {
        name: 'Updated Integration Team',
        userIds: []
      }
      ;(globalThis as any).getRouterParam.mockReturnValue(teamId)
      ;(globalThis as any).readBody.mockResolvedValue(updateData)
      
      const updateResult = await updateTeamHandler({} as any)
      expect(updateResult.success).toBe(true)
      expect(updateResult.data.name).toBe('Updated Integration Team')

      // 4. READ after update
      readResult = await getTeamsHandler({} as any)
      expect(readResult.success).toBe(true)
      expect(readResult.data).toHaveLength(1)
      expect(readResult.data[0].name).toBe('Updated Integration Team')
      expect(readResult.data[0].users).toEqual([])

      // 5. DELETE
      ;(globalThis as any).getRouterParam.mockReturnValue(teamId)
      
      const deleteResult = await deleteTeamHandler({} as any)
      expect(deleteResult.success).toBe(true)

      // 6. READ after delete
      readResult = await getTeamsHandler({} as any)
      expect(readResult.success).toBe(true)
      expect(readResult.data).toHaveLength(0)
    })
  })
})