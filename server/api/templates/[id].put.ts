import type { FlowTemplate, FlowElement, FlowRelation, ElementLayout } from '../../db/schema'
import { useTemplateRepository, useUserRepository } from "../../storage/StorageFactory"
import { normalizeRelations } from "../../utils/relationNormalizer"
import jwt from 'jsonwebtoken'

/**
 * Request body for updating a template
 */
interface UpdateTemplateRequest {
  name?: string
  description?: string
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  layout?: ElementLayout
}

/**
 * Response for template update
 */
interface UpdateTemplateResponse {
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

export default defineEventHandler(async (event) => {
  const templateRepo = useTemplateRepository()
  
  try {
    const templateId = getRouterParam(event, 'id')
    const body = await readBody(event) as Partial<FlowTemplate>
    
    if (!templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    }

    // Get current user for authorization
    const currentUser = await getCurrentUser(event)
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }
    
    // Check if template exists
    const existingTemplate = await templateRepo.findById(templateId)
    if (!existingTemplate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    }
    
    // Basic validation for updated fields
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Template name must be a non-empty string'
        })
      }
      body.name = body.name.trim()
    }
    
    if (body.description !== undefined) {
      if (typeof body.description !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Template description must be a string'
        })
      }
      body.description = body.description.trim()
    }
    
    // Normalize element templates if provided
    if (body.elements && body.elements.length > 0) {
      body.elements = body.elements.map((element: any) => {
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
    
    // Normalize relations if provided - group and correct direction
    if (body.relations && body.relations.length > 0) {
      const elements = body.elements || existingTemplate.elements || []
      body.relations = normalizeRelations(
        body.relations as any[], 
        body.startingElementId || existingTemplate.startingElementId,
        elements.map((el: any) => ({ id: el.id, type: el.type, name: el.name }))
      ) as FlowRelation[]
    }
    
    // Update template using repository
    const updatedTemplate = await templateRepo.update(templateId, body)
    
    return {
      success: true,
      data: updatedTemplate
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error updating template:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating template: ${error.message}`
    })
  }
})