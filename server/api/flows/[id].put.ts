import type { Flow, FlowElement, FlowRelation, ElementLayout } from '../../db/schema'
import { useFlowRepository } from "../../storage/StorageFactory"
import { normalizeRelations } from "../../utils/relationNormalizer"

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
    
    // Normalize elements according to their type requirements
    let normalizedElements = body.elements || existingFlow.elements
    if (body.elements) {
      normalizedElements = body.elements.map((element: any) => {
        const normalizedElement = { ...element }
        
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