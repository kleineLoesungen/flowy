import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockStorage, mockUserRepo, mockTemplateRepo, mockFlowRepo, clearAllMockData, setMockUser, clearMockUser } from '../setup'

// Dynamic imports for the handlers
let getTemplatesHandler: any
let createTemplateHandler: any
let getTemplateHandler: any
let updateTemplateHandler: any
let deleteTemplateHandler: any

describe('Templates API CRUD Operations', () => {
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
    
    // Reset repository mocks
    mockTemplateRepo.create.mockClear()
    mockTemplateRepo.findAll.mockClear()
    mockTemplateRepo.findById.mockClear()
    mockTemplateRepo.update.mockClear()
    mockTemplateRepo.delete.mockClear()
    mockUserRepo.findById.mockClear()
    mockFlowRepo.findByTemplateId.mockClear()
    
    // Dynamic imports to avoid module resolution issues
    const getModule = await import('../../server/api/templates/index.get')
    const createModule = await import('../../server/api/templates/index.post')
    const getOneModule = await import('../../server/api/templates/[id].get')
    const updateModule = await import('../../server/api/templates/[id].put')
    const deleteModule = await import('../../server/api/templates/[id].delete')
    
    getTemplatesHandler = getModule.default
    createTemplateHandler = createModule.default
    getTemplateHandler = getOneModule.default
    updateTemplateHandler = updateModule.default
    deleteTemplateHandler = deleteModule.default
  })

  describe('CREATE - POST /api/templates', () => {
    it('should create a new template with valid data', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'A test template',
        elements: [
          {
            id: 'element1',
            type: 'task',
            x: 100,
            y: 200,
            data: { title: 'Task 1' }
          }
        ],
        relations: []
      }

      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      const createdTemplate = {
        id: 'template1',
        ...templateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(globalThis as any).readBody.mockResolvedValue(templateData)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.create.mockResolvedValue(createdTemplate)

      const mockEvent = {}
      const result = await createTemplateHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Test Template')
      expect(mockTemplateRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Template',
        description: 'A test template',
        elements: expect.any(Array),
        relations: expect.any(Array)
      }))
    })

    it('should reject template creation without authentication', async () => {
      // Clear mock user to simulate unauthenticated request
      clearMockUser()
      
      const templateData = {
        name: 'Test Template',
        elements: [],
        relations: []
      }

      ;(globalThis as any).readBody.mockResolvedValue(templateData)

      const mockEvent = {}

      await expect(createTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    })

    it('should reject template creation with missing required fields', async () => {
      const templateData = {
        elements: [],
        relations: []
        // Missing name
      }

      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      ;(globalThis as any).readBody.mockResolvedValue(templateData)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)

      const mockEvent = {}

      await expect(createTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Template name is required'
      })
    })

    it('should create template with default elements and relations if not provided', async () => {
      const templateData = {
        name: 'Minimal Template'
        // No elements or relations specified
      }

      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      const createdTemplate = {
        id: 'template1',
        name: 'Minimal Template',
        description: '',
        elements: [],
        relations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      ;(globalThis as any).readBody.mockResolvedValue(templateData)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.create.mockResolvedValue(createdTemplate)

      const mockEvent = {}
      const result = await createTemplateHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(mockTemplateRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Minimal Template',
        description: '',
        elements: [],
        relations: []
      }))
    })
  })

  describe('READ - GET /api/templates', () => {
    it('should return empty array when no templates exist', async () => {
      mockTemplateRepo.findAll.mockResolvedValue([])

      const result = await getTemplatesHandler({})

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should return all templates', async () => {
      const mockTemplates = [
        {
          id: 'template1',
          name: 'Template 1',
          description: 'First template',
          elements: [],
          relations: [],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'template2',
          name: 'Template 2',
          description: 'Second template',
          elements: [],
          relations: [],
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z'
        }
      ]

      mockTemplateRepo.findAll.mockResolvedValue(mockTemplates)

      const result = await getTemplatesHandler({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe('Template 1')
      expect(result.data[1].name).toBe('Template 2')
    })
  })

  describe('READ - GET /api/templates/:id', () => {
    it('should return template by ID', async () => {
      const mockTemplate = {
        id: 'template1',
        name: 'Test Template',
        description: 'A test template',
        elements: [
          {
            id: 'element1',
            type: 'task',
            x: 100,
            y: 200,
            data: { title: 'Task 1' }
          }
        ],
        relations: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('template1')
      mockTemplateRepo.findById.mockResolvedValue(mockTemplate)

      const mockEvent = {}
      const result = await getTemplateHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Test Template')
      expect(result.data.elements).toHaveLength(1)
    })

    it('should return error for non-existent template', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue('nonexistent')
      mockTemplateRepo.findById.mockResolvedValue(null)

      const mockEvent = {}

      await expect(getTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    })

    it('should return error when template ID is missing', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue(undefined)

      const mockEvent = {}

      await expect(getTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    })
  })

  describe('UPDATE - PUT /api/templates/:id', () => {
    it('should update an existing template', async () => {
      const updateData = {
        name: 'Updated Template',
        description: 'Updated description',
        elements: [
          {
            id: 'element1',
            type: 'decision',
            x: 150,
            y: 250,
            data: { title: 'Updated Task' }
          }
        ]
      }

      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      const existingTemplate = {
        id: 'template1',
        name: 'Original Template',
        description: 'Original description',
        elements: [],
        relations: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      const updatedTemplate = {
        ...existingTemplate,
        ...updateData,
        updatedAt: new Date().toISOString()
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('template1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.findById.mockResolvedValue(existingTemplate)
      mockTemplateRepo.update.mockResolvedValue(updatedTemplate)

      const mockEvent = {}
      const result = await updateTemplateHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Template')
      expect(mockTemplateRepo.update).toHaveBeenCalledWith('template1', expect.objectContaining({
        name: 'Updated Template',
        description: 'Updated description'
      }))
    })

    it('should reject update without authentication', async () => {
      // Clear mock user to simulate unauthenticated request
      clearMockUser()
      
      const updateData = {
        name: 'Updated Template'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('template1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)

      const mockEvent = {}

      await expect(updateTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    })

    it('should reject update for non-existent template', async () => {
      const updateData = {
        name: 'Updated Template'
      }

      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('nonexistent')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.findById.mockResolvedValue(null)

      const mockEvent = {}

      await expect(updateTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    })

    it('should reject update with empty name', async () => {
      const updateData = {
        name: '',
        description: 'Updated description'
      }

      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      const existingTemplate = {
        id: 'template1',
        name: 'Original Template',
        description: 'Original description',
        elements: [],
        relations: []
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('template1')
      ;(globalThis as any).readBody.mockResolvedValue(updateData)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.findById.mockResolvedValue(existingTemplate)

      const mockEvent = {}

      await expect(updateTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Template name cannot be empty'
      })
    })
  })

  describe('DELETE - DELETE /api/templates/:id', () => {
    it('should delete an existing template', async () => {
      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      const existingTemplate = {
        id: 'template1',
        name: 'Template to Delete',
        description: 'Will be deleted',
        elements: [],
        relations: []
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('template1')
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.findById.mockResolvedValue(existingTemplate)
      mockFlowRepo.findByTemplateId.mockResolvedValue([]) // No flows using this template
      mockTemplateRepo.delete.mockResolvedValue(undefined)

      const mockEvent = {}
      const result = await deleteTemplateHandler(mockEvent)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Template deleted successfully')
      expect(mockTemplateRepo.delete).toHaveBeenCalledWith('template1')
    })

    it('should reject deletion without authentication', async () => {
      // Clear mock user to simulate unauthenticated request
      clearMockUser()
      
      ;(globalThis as any).getRouterParam.mockReturnValue('template1')

      const mockEvent = {}

      await expect(deleteTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    })

    it('should reject deletion of non-existent template', async () => {
      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      ;(globalThis as any).getRouterParam.mockReturnValue('nonexistent')
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.findById.mockResolvedValue(null)

      const mockEvent = {}

      await expect(deleteTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    })

    it('should reject deletion of template used by existing flows', async () => {
      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'member'
      }

      const existingTemplate = {
        id: 'template1',
        name: 'Template in Use',
        description: 'Used by flows',
        elements: [],
        relations: []
      }

      const existingFlows = [
        { id: 'flow1', name: 'Flow 1', templateId: 'template1' },
        { id: 'flow2', name: 'Flow 2', templateId: 'template1' }
      ]

      ;(globalThis as any).getRouterParam.mockReturnValue('template1')
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockTemplateRepo.findById.mockResolvedValue(existingTemplate)
      mockFlowRepo.findByTemplateId.mockResolvedValue(existingFlows)

      const mockEvent = {}

      await expect(deleteTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 409,
        statusMessage: 'Cannot delete template. It is being used by 2 flow(s). Please delete or modify those flows first.'
      })
    })

    it('should reject deletion without template ID', async () => {
      ;(globalThis as any).getRouterParam.mockReturnValue(undefined)

      const mockEvent = {}

      await expect(deleteTemplateHandler(mockEvent)).rejects.toThrow()
      expect((globalThis as any).createError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    })
  })

  describe('Template Integration Tests', () => {
    it('should perform complete CRUD cycle: Create -> Read -> Update -> Delete', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      }

      // 1. Create
      const createData = {
        name: 'Integration Test Template',
        description: 'For testing CRUD operations',
        elements: [
          {
            id: 'start',
            type: 'start',
            x: 50,
            y: 100,
            data: { title: 'Start' }
          }
        ],
        relations: []
      }

      ;(globalThis as any).readBody.mockResolvedValue(createData)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)

      const createdTemplate = {
        id: 'integration-test',
        ...createData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockTemplateRepo.create.mockResolvedValue(createdTemplate)

      let result = await createTemplateHandler({})
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Integration Test Template')

      // 2. Read single
      ;(globalThis as any).getRouterParam.mockReturnValue('integration-test')
      mockTemplateRepo.findById.mockResolvedValue(createdTemplate)

      result = await getTemplateHandler({})
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Integration Test Template')

      // 3. Update
      const updateData = {
        name: 'Updated Integration Template',
        description: 'Updated for testing'
      }

      ;(globalThis as any).readBody.mockResolvedValue(updateData)
      const updatedTemplate = {
        ...createdTemplate,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
      mockTemplateRepo.update.mockResolvedValue(updatedTemplate)

      result = await updateTemplateHandler({})
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Integration Template')

      // 4. Delete
      mockFlowRepo.findByTemplateId.mockResolvedValue([]) // No flows using template
      mockTemplateRepo.delete.mockResolvedValue(undefined)

      result = await deleteTemplateHandler({})
      expect(result.success).toBe(true)
      expect(result.message).toBe('Template deleted successfully')
    })

    it('should handle complex template with multiple elements and relations', async () => {
      const complexTemplate = {
        name: 'Complex Workflow Template',
        description: 'A template with multiple connected elements',
        elements: [
          {
            id: 'start',
            type: 'start',
            x: 100,
            y: 100,
            data: { title: 'Start Process' }
          },
          {
            id: 'task1',
            type: 'task',
            x: 300,
            y: 100,
            data: { title: 'Review Document', assignee: 'manager' }
          },
          {
            id: 'decision',
            type: 'decision',
            x: 500,
            y: 100,
            data: { title: 'Approve?', options: ['Yes', 'No'] }
          },
          {
            id: 'end_approved',
            type: 'end',
            x: 700,
            y: 50,
            data: { title: 'Approved' }
          },
          {
            id: 'end_rejected',
            type: 'end',
            x: 700,
            y: 150,
            data: { title: 'Rejected' }
          }
        ],
        relations: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'decision' },
          { from: 'decision', to: 'end_approved', condition: 'Yes' },
          { from: 'decision', to: 'end_rejected', condition: 'No' }
        ]
      }

      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      }

      ;(globalThis as any).readBody.mockResolvedValue(complexTemplate)
      ;(globalThis as any).getCookie.mockReturnValue('valid-token')
      mockUserRepo.findById.mockResolvedValue(mockUser)

      const createdTemplate = {
        id: 'complex-template',
        ...complexTemplate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockTemplateRepo.create.mockResolvedValue(createdTemplate)

      const result = await createTemplateHandler({})

      expect(result.success).toBe(true)
      expect(result.data.elements).toHaveLength(5)
      expect(result.data.relations).toHaveLength(4)
      expect(mockTemplateRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Complex Workflow Template',
        elements: expect.arrayContaining([
          expect.objectContaining({ id: 'start', type: 'start' }),
          expect.objectContaining({ id: 'task1', type: 'task' }),
          expect.objectContaining({ id: 'decision', type: 'decision' })
        ]),
        relations: expect.arrayContaining([
          expect.objectContaining({ from: 'start', to: 'task1' }),
          expect.objectContaining({ from: 'task1', to: 'decision' })
        ])
      }))
    })
  })
})