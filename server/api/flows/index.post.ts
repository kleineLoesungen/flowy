import type { Flow, NewFlow, FlowElement, FlowRelation, ElementLayout } from '../../db/schema'
import { useFlowRepository, useUserRepository } from "../../storage/StorageFactory"
import { normalizeRelations } from "../../utils/relationNormalizer"
import { notifyFlowCreated } from "../../utils/notifications"
import jwt from 'jsonwebtoken'

/**
 * Request body for creating a new flow
 */
interface CreateFlowRequest {
  name: string
  description?: string | null
  templateId?: string | null
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  startedAt?: string | null
  expectedEndDate?: string | null
  completedAt?: string | null
  hidden?: boolean
  layout?: ElementLayout | null
}

/**
 * Response for flow creation
 */
interface CreateFlowResponse {
  success: true
  data: Flow
}

/**
 * POST /api/flows - Create a new flow instance from template
 * @param body - Flow data including name, templateId, and optional elements/relations
 * @returns The created flow instance
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
  const flowRepo = useFlowRepository()

  try {
    // Get current user for authorization
    const currentUser = await getCurrentUser(event)
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    // Create new flow
    const body = await readBody(event) as NewFlow & { elements?: any[], relations?: any[] }
    
    // Basic validation
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Flow name is required'
      })
    }
    
    // Normalize elements according to their type requirements
    let normalizedElements = body.elements || []
    if (normalizedElements.length > 0) {
      normalizedElements = normalizedElements.map((element: any) => {
        const normalizedElement = { ...element }
        
        // Handle state and artefact elements - clear fields that should be null/empty
        if (element.type === 'state' || element.type === 'artefact') {
          normalizedElement.ownerTeamId = null
          normalizedElement.consultedTeamIds = []
          normalizedElement.completedAt = null
          normalizedElement.expectedEndedAt = null
          normalizedElement.status = 'completed' // Status should be completed for state and artefact
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

    const now = new Date().toISOString()
    const flowData = {
      name: body.name.trim(),
      description: body.description || null,
      templateId: body.templateId || null,
      startedAt: body.startedAt || now,
      expectedEndDate: body.expectedEndDate || null,
      completedAt: body.completedAt || null,
      elements: normalizedElements,
      relations: normalizedRelations,
      startingElementId: body.startingElementId || '',
      hidden: body.hidden ?? false,
      layout: body.layout || null
    }

    // Create flow using repository
    const newFlow = await flowRepo.create(flowData)
    
    // Send notification asynchronously (don't await to avoid blocking the response)
    setImmediate(async () => {
      try {
        await notifyFlowCreated(
          newFlow.id,
          newFlow.name,
          newFlow.description,
          currentUser.email
        )
      } catch (notificationError: any) {
        console.error('Error sending flow creation notification:', notificationError.message)
      }
    })
    
    return {
      success: true,
      data: newFlow
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error creating flow:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error creating flow: ${error.message}`
    })
  }
})