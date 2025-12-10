import type { Flow, FlowElement, FlowRelation, ElementLayout } from '../../db/schema'
import { useFlowRepository, useUserRepository } from "../../storage/StorageFactory"
import { normalizeRelations } from "../../utils/relationNormalizer"
import { notifyStatusChange, notifyCommentAdded } from "../../utils/notifications"
import jwt from 'jsonwebtoken'

/**
 * Request body for updating a flow
 */
interface UpdateFlowRequest {
  name?: string
  description?: string | null
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
 * Response for flow update
 */
interface UpdateFlowResponse {
  success: true
  data: Flow
}

/**
 * PUT /api/flows/[id] - Update a flow by ID
 * @param id - Flow ID to update
 * @param body - Flow update data
 * @returns The updated flow
 */
export default defineEventHandler(async (event) => {
  const flowRepo = useFlowRepository()
  const flowId = getRouterParam(event, 'id')

  if (!flowId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Flow ID is required'
    })
  }

  try {
    // Get current user's email for notification exclusion
    let currentUserEmail: string | undefined
    try {
      const token = getCookie(event, 'auth-token')
      if (token) {
        const runtimeConfig = useRuntimeConfig()
        const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
        const decoded = jwt.verify(token, secretKey) as { userId: string; email: string }
        currentUserEmail = decoded.email
      }
    } catch {
      // If we can't get the user, just don't exclude anyone
    }

    // Get existing flow
    const existingFlow = await flowRepo.findById(flowId)
    
    if (!existingFlow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Flow not found'
      })
    }

    // Check if flow is completed - prevent any updates to completed flows
    if (existingFlow.completedAt) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot modify completed flows. Use reopen endpoint to make flow active again.'
      })
    }

    // Update flow
    const body = await readBody(event)
    
    // Track changes for notifications
    const statusChanges: Array<{ element: FlowElement; oldStatus: string; newStatus: string }> = []
    const newComments: Array<{ element: FlowElement; comment: any }> = []
    
    // Normalize elements according to their type requirements
    let normalizedElements = body.elements || existingFlow.elements
    if (body.elements) {
      normalizedElements = body.elements.map((element: any) => {
        const normalizedElement = { ...element }
        
        // Find existing element for comparison
        const existingElement = existingFlow.elements.find((e: FlowElement) => e.id === element.id)
        
        // Detect status changes
        if (existingElement && existingElement.status !== element.status) {
          statusChanges.push({
            element: normalizedElement,
            oldStatus: existingElement.status,
            newStatus: element.status
          })
        }
        
        // Detect new comments
        if (existingElement && element.comments && element.comments.length > existingElement.comments.length) {
          const newCommentsForElement = element.comments.slice(existingElement.comments.length)
          newCommentsForElement.forEach((comment: any) => {
            newComments.push({ element: normalizedElement, comment })
          })
        }
        
        // Ensure ownerTeamId is never undefined
        if (normalizedElement.ownerTeamId === undefined) {
          normalizedElement.ownerTeamId = null
        }
        
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
    
    // Normalize relations if provided - group and correct direction
    let normalizedRelations = body.relations !== undefined ? body.relations : existingFlow.relations
    if (body.relations && body.relations.length > 0) {
      normalizedRelations = normalizeRelations(
        body.relations as any[], 
        body.startingElementId || existingFlow.startingElementId || '',
        normalizedElements.map((el: any) => ({ id: el.id, type: el.type, name: el.name }))
      ) as FlowRelation[]
    }

    // Prepare update data
    const updateData: Partial<Flow> = {
      ...body,
      elements: normalizedElements,
      relations: normalizedRelations,
      hidden: body.hidden ?? existingFlow.hidden
    }

    // Update flow using repository
    const updatedFlow = await flowRepo.update(flowId, updateData)
    
    // Send notifications asynchronously (don't await to avoid blocking the response)
    if (statusChanges.length > 0 || newComments.length > 0) {
      setImmediate(async () => {
        try {
          // Notify status changes
          for (const { element, oldStatus, newStatus } of statusChanges) {
            await notifyStatusChange(flowId, updatedFlow.name, element, oldStatus, newStatus, currentUserEmail)
          }
          
          // Notify new comments
          for (const { element, comment } of newComments) {
            await notifyCommentAdded(flowId, updatedFlow.name, element, comment, currentUserEmail)
          }
        } catch (notificationError: any) {
          console.error('Error sending notifications:', notificationError.message)
        }
      })
    }
    
    return { 
      success: true,
      data: updatedFlow 
    }
  } catch (error: any) {
    // Re-throw HTTP errors
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error updating flow:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating flow: ${error.message}`
    })
  }
})