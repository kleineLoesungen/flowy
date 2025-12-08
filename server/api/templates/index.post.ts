import type { FlowTemplate, NewFlowTemplate, FlowElement, FlowRelation, ElementLayout } from '../../db/schema'
import { useTemplateRepository, useUserRepository } from "../../storage/StorageFactory"
import { normalizeRelations } from "../../utils/relationNormalizer"
import jwt from 'jsonwebtoken'

/**
 * Request body for creating a template
 */
interface CreateTemplateRequest {
  name: string
  description: string
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  layout?: ElementLayout
}

/**
 * Response for template creation
 */
interface CreateTemplateResponse {
  success: true
  data: FlowTemplate
}

/**
 * GET current authenticated user
 */
async function getCurrentUser(event: any) {
  try {
    const token = getCookie(event, 'auth-token')
    if (!token) return null

    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    const decoded: any = jwt.verify(token, secretKey)

    const userRepo = useUserRepository()
    const user = await userRepo.findById(decoded.userId)
    return user
  } catch (error) {
    return null
  }
}

/**
 * POST /api/templates
 * 
 * Create a new flow template
 */
export default defineEventHandler(async (event) => {
  const templateRepo = useTemplateRepository()
  
  try {
    // Get current user for authorization
    const currentUser = await getCurrentUser(event)
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const body: CreateTemplateRequest = await readBody(event)
    
    // Basic validation
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template name is required'
      })
    }
    
    // Description is optional, but should be a string if provided
    const description = body.description && typeof body.description === 'string' 
      ? body.description 
      : ''
    
    // Normalize element templates according to their type requirements
    let normalizedElements = body.elements || []
    if (normalizedElements.length > 0) {
      normalizedElements = normalizedElements.map((element: any) => {
        const normalizedElement = { ...element }
        
        // Handle state and artefact elements - clear fields that should be null/empty
        if (element.type === 'state' || element.type === 'artefact') {
          normalizedElement.ownerTeamId = null
          normalizedElement.consultedTeamIds = []
          normalizedElement.expectedDuration = null
        }
        
        return normalizedElement
      })
    }

    // Normalize relations - group and correct direction
    let normalizedRelations = body.relations || []
    if (normalizedRelations.length > 0) {
      normalizedRelations = normalizeRelations(
        normalizedRelations as any[],
        body.startingElementId || '',
        normalizedElements.map((el: any) => ({ id: el.id, type: el.type, name: el.name }))
      ) as FlowRelation[]
    }

    const templateData = {
      name: body.name.trim(),
      description: description.trim(),
      elements: normalizedElements,
      relations: normalizedRelations,
      startingElementId: body.startingElementId || '',
      layout: body.layout || null
    }

    // Create template using repository (handles validation)
    const template = await templateRepo.create(templateData)
    
    return {
      success: true,
      data: template
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error creating template:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error creating template: ${error.message}`
    })
  }
})