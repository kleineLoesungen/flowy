import { vi } from 'vitest'

// Mock Nuxt utilities
;(globalThis as any).defineEventHandler = vi.fn((handler) => handler)
;(globalThis as any).getRouterParam = vi.fn()
;(globalThis as any).readBody = vi.fn()
;(globalThis as any).createError = vi.fn((error) => {
  const err = new Error(error.statusMessage || 'Error')
  ;(err as any).statusCode = error.statusCode
  ;(err as any).statusMessage = error.statusMessage
  ;(err as any).data = error.data
  return err
})

// Mock auth utilities for testing
let mockCurrentUser: any = null
let mockAuthToken: string | null = null

export const setMockUser = (user: any) => {
  mockCurrentUser = user
  mockAuthToken = 'mock-jwt-token'
  // Also add the user to the users Map
  users.set(user.id, user)
}

export const clearMockUser = () => {
  mockCurrentUser = null
  mockAuthToken = null
}

// Mock JWT and cookie functions
;(globalThis as any).getCookie = vi.fn((event: any, name: string) => {
  if (name === 'auth-token') {
    return mockAuthToken
  }
  return null
})

// Mock JWT verification
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn((token: string, secret: string) => {
    if (token === 'mock-jwt-token' && mockCurrentUser) {
      return { userId: mockCurrentUser.id }
    }
    throw new Error('Invalid token')
  }),
  sign: vi.fn(() => 'mock-jwt-token')
}))

// Mock runtime config
vi.mock('#imports', async () => {
  const actual = await vi.importActual('#imports')
  return {
    ...actual,
    useRuntimeConfig: vi.fn(() => ({
      jwtSecret: 'test-secret'
    }))
  }
})

// Mock storage interface
export const mockStorage = {
  storage: new Map<string, any>(), // Add storage property for flows.test.ts compatibility
  items: new Map<string, any>(),
  
  async getItem<T = any>(key: string): Promise<T | null> {
    return this.items.get(key) || null
  },
  
  async setItem<T = any>(key: string, value: T): Promise<void> {
    this.items.set(key, value)
  },
  
  async removeItem(key: string): Promise<void> {
    this.items.delete(key)
  },
  
  async getKeys(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.items.keys())
    return prefix ? keys.filter(key => key.startsWith(prefix)) : keys
  },
  
  clear(): void {
    this.items.clear()
    this.storage.clear() // Also clear the storage Map
  }
}

// In-memory storage for repositories
const users = new Map()
const teams = new Map()
const flows = new Map()
const templates = new Map()

// Mock repositories for testing with realistic behavior
export const mockUserRepo = {
  create: vi.fn().mockImplementation((userData) => {
    // Check for duplicate email
    const existingUser = Array.from(users.values()).find(u => u.email.toLowerCase() === userData.email.toLowerCase())
    if (existingUser) {
      const error = new Error('Email already exists')
      ;(error as any).statusCode = 409
      ;(error as any).statusMessage = 'Email already exists'
      throw error
    }

    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasPassword: !!userData.password || !!userData.passwordHash
    }
    delete user.password // Remove raw password
    delete user.passwordHash // Remove password hash from response
    users.set(user.id, user)
    return Promise.resolve(user)
  }),
  findAll: vi.fn(() => Promise.resolve(Array.from(users.values()))),
  findById: vi.fn((id) => {
    // Return mock current user if it matches
    if (mockCurrentUser && mockCurrentUser.id === id) {
      return Promise.resolve(mockCurrentUser)
    }
    return Promise.resolve(users.get(id) || null)
  }),
  update: vi.fn().mockImplementation((id, data) => {
    const existing = users.get(id)
    if (!existing) {
      const error = new Error('User not found')
      ;(error as any).statusCode = 404
      ;(error as any).statusMessage = 'User not found'
      throw error
    }
    
    // Check for duplicate email (if email is being updated)
    if (data.email && data.email !== existing.email) {
      const duplicateUser = Array.from(users.values()).find(u => u.id !== id && u.email.toLowerCase() === data.email.toLowerCase())
      if (duplicateUser) {
        const error = new Error('Email already exists')
        ;(error as any).statusCode = 409
        ;(error as any).statusMessage = 'Email already exists'
        throw error
      }
    }
    
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    users.set(id, updated)
    return Promise.resolve(updated)
  }),
  delete: vi.fn().mockImplementation((id) => {
    const existing = users.get(id)
    if (!existing) {
      const error = new Error('User not found')
      ;(error as any).statusCode = 404
      ;(error as any).statusMessage = 'User not found'
      throw error
    }
    
    users.delete(id)
    return Promise.resolve()
  }),
  findByEmail: vi.fn().mockImplementation((email) => {
    const user = Array.from(users.values()).find(u => u.email.toLowerCase() === email.toLowerCase())
    return Promise.resolve(user || null)
  }),
  findAllPublic: vi.fn(() => Promise.resolve(Array.from(users.values()).map(u => {
    const { passwordHash, ...publicUser } = u
    return publicUser
  }))),
  countAdmins: vi.fn(() => {
    const adminCount = Array.from(users.values()).filter(u => u.role === 'admin').length
    return Promise.resolve(adminCount)
  }),
  validateData: vi.fn(),
  clear: () => users.clear()
}

export const mockTeamRepo = {
  create: vi.fn().mockImplementation((teamData) => {
    const team = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...teamData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    teams.set(team.id, team)
    return Promise.resolve(team)
  }),
  findAll: vi.fn(() => Promise.resolve(Array.from(teams.values()))),
  findById: vi.fn((id) => Promise.resolve(teams.get(id) || null)),
  update: vi.fn().mockImplementation((id, data) => {
    const existing = teams.get(id)
    if (!existing) return Promise.resolve(null)
    
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    teams.set(id, updated)
    return Promise.resolve(updated)
  }),
  delete: vi.fn().mockImplementation((id) => {
    teams.delete(id)
    return Promise.resolve()
  }),
  findTeamsWithUser: vi.fn().mockImplementation((userId) => {
    const userTeams = Array.from(teams.values()).filter(t => t.userIds && t.userIds.includes(userId))
    return Promise.resolve(userTeams)
  }),
  findAllWithUsers: vi.fn(() => Promise.resolve(Array.from(teams.values()))),
  clear: () => teams.clear()
}

export const mockFlowRepo = {
  create: vi.fn().mockImplementation((flowData) => {
    const flow = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...flowData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    flows.set(flow.id, flow)
    return Promise.resolve(flow)
  }),
  findAll: vi.fn(() => Promise.resolve(Array.from(flows.values()))),
  findById: vi.fn((id) => Promise.resolve(flows.get(id) || null)),
  update: vi.fn().mockImplementation((id, data) => {
    const existing = flows.get(id)
    if (!existing) return Promise.resolve(null)
    
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    flows.set(id, updated)
    return Promise.resolve(updated)
  }),
  delete: vi.fn().mockImplementation((id) => {
    flows.delete(id)
    return Promise.resolve()
  }),
  findByTemplateId: vi.fn().mockImplementation((templateId) => {
    const templateFlows = Array.from(flows.values()).filter(f => f.templateId === templateId)
    return Promise.resolve(templateFlows)
  }),
  countByTemplate: vi.fn(() => {
    const counts = new Map()
    Array.from(flows.values()).forEach(f => {
      if (f.templateId) {
        counts.set(f.templateId, (counts.get(f.templateId) || 0) + 1)
      }
    })
    return Promise.resolve(counts)
  }),
  clear: () => flows.clear()
}

export const mockTemplateRepo = {
  create: vi.fn().mockImplementation((templateData) => {
    const template = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    templates.set(template.id, template)
    return Promise.resolve(template)
  }),
  findAll: vi.fn(() => Promise.resolve(Array.from(templates.values()))),
  findById: vi.fn((id) => Promise.resolve(templates.get(id) || null)),
  update: vi.fn().mockImplementation((id, data) => {
    const existing = templates.get(id)
    if (!existing) return Promise.resolve(null)
    
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    templates.set(id, updated)
    return Promise.resolve(updated)
  }),
  delete: vi.fn().mockImplementation((id) => {
    templates.delete(id)
    return Promise.resolve()
  }),
  clear: () => templates.clear()
}

// Helper function to clear all mock data
export function clearAllMockData() {
  users.clear()
  teams.clear()
  flows.clear()
  templates.clear()
  mockStorage.clear()
}

// Mock the new storage layer
vi.mock('../server/storage/StorageFactory', () => ({
  StorageContainer: {
    getInstance: vi.fn(() => ({
      getStorage: vi.fn(() => mockStorage)
    }))
  },
  useUserRepository: vi.fn(() => mockUserRepo),
  useTeamRepository: vi.fn(() => mockTeamRepo),
  useFlowRepository: vi.fn(() => mockFlowRepo),
  useTemplateRepository: vi.fn(() => mockTemplateRepo)
}))

// Mock useDatabaseStorage
vi.mock('../server/utils/FlowyStorage', () => ({
  useDatabaseStorage: vi.fn(() => mockStorage)
}))

// Mock bcryptjs for password hashing
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('mockedhashvalue'),
    compare: vi.fn().mockResolvedValue(true)
  },
  hash: vi.fn().mockResolvedValue('mockedhashvalue'),
  compare: vi.fn().mockResolvedValue(true)
}))

// Mock JWT for authentication tests
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn()
  }
}))

// Mock Nuxt runtime config and cookies
;(globalThis as any).useRuntimeConfig = vi.fn(() => ({
  jwtSecret: 'test-jwt-secret'
}))
;(globalThis as any).getCookie = vi.fn()