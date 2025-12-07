import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDatabaseStorage } from '../../server/utils/FlowyStorage'
import { setMockUser, clearMockUser, clearAllMockData } from '../setup'

describe('/api/flows POST', () => {
  const mockStorage = useDatabaseStorage()
  
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
    
    // Clear flows storage - using the Map directly from setup.ts
    const storage = (mockStorage as any).storage as Map<string, any>
    for (const key of storage.keys()) {
      if (key.startsWith('flows:')) {
        storage.delete(key)
      }
    }
  })

  it('should create a flow with proper timestamp handling', async () => {
    // Import the API handler
    const handler = await import('../../server/api/flows/index.post')
    
    // Mock request body with timestamps
    const testFlow = {
      name: 'Test Flow Creation',
      description: 'Testing flow creation with timestamps',
      templateId: null,
      startedAt: '2025-11-01T20:00:00.000Z',
      expectedEndDate: null,
      completedAt: null,
      elements: [
        {
          id: 'test-element-1',
          name: 'Test Element',
          description: 'A test element',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          completedAt: null,
          expectedEndedAt: null,
          status: 'pending',
          comments: []
        }
      ],
      relations: [],
      startingElementId: 'test-element-1',
      hidden: false,
      layout: null,
      createdAt: '2025-11-01T20:00:00.000Z',
      updatedAt: '2025-11-01T20:00:00.000Z'
    }

    // Mock event object
    const event = {
      node: {
        req: {
          method: 'POST',
          headers: { 'content-type': 'application/json' }
        }
      },
      context: {},
      headers: {},
      method: 'POST'
    }

    // Mock readBody to return our test data
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(testFlow))

    const result = await handler.default(event)
    
    // Verify the flow was created successfully
    expect(result).toBeDefined()
    expect(result.name).toBe('Test Flow Creation')
    expect(result.elements).toHaveLength(1)
    expect(result.createdAt).toBe('2025-11-01T20:00:00.000Z')
    expect(result.updatedAt).toBe('2025-11-01T20:00:00.000Z')
    
    // Verify it was stored in the database
    const stored = await mockStorage.getItem(`flows:${result.id}`)
    expect(stored).toBeDefined()
    expect(stored.name).toBe('Test Flow Creation')
    
    vi.unstubAllGlobals()
  })

  it('should handle flows without explicit timestamps', async () => {
    const handler = await import('../../server/api/flows/index.post')
    
    const testFlow = {
      name: 'Flow Without Timestamps',
      description: 'Testing flow creation without explicit timestamps',
      templateId: null,
      elements: [],
      relations: [],
      startingElementId: '',
      hidden: false,
      layout: null
      // No createdAt/updatedAt provided
    }

    const event = {
      node: { req: { method: 'POST', headers: { 'content-type': 'application/json' } } },
      context: {},
      headers: {},
      method: 'POST'
    }

    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(testFlow))

    const result = await handler.default(event)
    
    // Verify timestamps were auto-generated
    expect(result).toBeDefined()
    expect(result.name).toBe('Flow Without Timestamps')
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
    expect(typeof result.createdAt).toBe('string')
    expect(typeof result.updatedAt).toBe('string')
    
    // Verify ISO format
    expect(() => new Date(result.createdAt)).not.toThrow()
    expect(() => new Date(result.updatedAt)).not.toThrow()
    
    vi.unstubAllGlobals()
  })

  it('should handle complex flow with elements and relations', async () => {
    const handler = await import('../../server/api/flows/index.post')
    
    const testFlow = {
      name: 'Complex Flow Test',
      description: 'Testing complex flow creation',
      templateId: 'template-123',
      startedAt: '2025-11-01T20:00:00.000Z',
      elements: [
        {
          id: 'element-1',
          name: 'Start Action',
          description: 'Starting action',
          type: 'action',
          ownerTeamId: 'team-1',
          consultedTeamIds: ['team-2', 'team-3'],
          completedAt: null,
          expectedEndedAt: '2025-11-02T20:00:00.000Z',
          status: 'in-progress',
          comments: []
        },
        {
          id: 'element-2',
          name: 'End State',
          description: 'Final state',
          type: 'state',
          ownerTeamId: null,
          consultedTeamIds: [],
          completedAt: null,
          expectedEndedAt: null,
          status: 'completed',
          comments: []
        }
      ],
      relations: [
        {
          id: 'rel-1',
          type: 'flow',
          connections: [
            {
              fromElementId: 'element-1',
              toElementId: 'element-2'
            }
          ]
        }
      ],
      startingElementId: 'element-1',
      hidden: false,
      layout: { 'element-1': { x: 100, y: 100 }, 'element-2': { x: 200, y: 200 } },
      createdAt: '2025-11-01T20:00:00.000Z',
      updatedAt: '2025-11-01T20:00:00.000Z'
    }

    const event = {
      node: { req: { method: 'POST', headers: { 'content-type': 'application/json' } } },
      context: {},
      headers: {},
      method: 'POST'
    }

    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(testFlow))

    const result = await handler.default(event)
    
    // Verify complex structure was preserved
    expect(result).toBeDefined()
    expect(result.name).toBe('Complex Flow Test')
    expect(result.templateId).toBe('template-123')
    expect(result.elements).toHaveLength(2)
    expect(result.relations).toHaveLength(1)
    expect(result.layout).toEqual({ 'element-1': { x: 100, y: 100 }, 'element-2': { x: 200, y: 200 } })
    
    // Verify elements were normalized for state/artefact types
    const endState = result.elements.find((e: any) => e.id === 'element-2')
    expect(endState.status).toBe('completed')
    expect(endState.ownerTeamId).toBeNull()
    expect(endState.consultedTeamIds).toEqual([])
    
    vi.unstubAllGlobals()
  })
})