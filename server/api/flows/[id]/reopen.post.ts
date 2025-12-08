import type { Flow } from '../../../db/schema'
import { useFlowRepository } from "../../../storage/StorageFactory"

/**
 * Response for flow reopen operation
 */
interface ReopenFlowResponse {
  success: true
  data: Flow
}

/**
 * POST /api/flows/[id]/reopen - Reopen a completed flow
 * @param id - Flow ID to reopen
 * @returns The reopened flow with cleared completion date
 */
export default defineEventHandler(async (event) => {
  const flowId = getRouterParam(event, 'id')
  
  if (!flowId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Flow ID is required'
    })
  }

  const flowRepo = useFlowRepository()

  try {
    // Get the flow from repository
    const flow = await flowRepo.findById(flowId)

    if (!flow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Flow not found'
      })
    }

    // Check if flow is actually completed
    if (!flow.completedAt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Flow is not completed'
      })
    }

    // Update the flow to remove completion date
    const updatedFlow = await flowRepo.update(flowId, {
      completedAt: null
    })

    return {
      success: true,
      data: updatedFlow
    }
  } catch (error: any) {
    // Re-throw HTTP errors
    if (error.statusCode) {
      throw error
    }
    
    // Log and wrap other errors
    console.error('Error reopening flow:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to reopen flow'
    })
  }
})