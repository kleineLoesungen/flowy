import type { Flow } from '../../db/schema'
import { useFlowRepository } from "../../storage/StorageFactory"

/**
 * Response for flow deletion
 */
interface DeleteFlowResponse {
  success: true
  message: string
}

/**
 * DELETE /api/flows/[id] - Delete a flow by ID
 * @param id - Flow ID to delete
 * @returns Confirmation of deletion
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
    // Get the flow to check if it exists and is not completed
    const existingFlow = await flowRepo.findById(flowId)
    
    if (!existingFlow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Flow not found'
      })
    }

    // Check if flow is completed - prevent deletion of completed flows
    if (existingFlow.completedAt) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot delete completed flows. Use reopen endpoint to make flow active again before deletion.'
      })
    }

    // Delete the flow
    await flowRepo.delete(flowId)
    
    return { 
      success: true, 
      flow: existingFlow 
    }
  } catch (error: any) {
    // Re-throw HTTP errors
    if (error.statusCode) {
      throw error
    }
    
    // Log and wrap other errors
    console.error('Error deleting flow:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete flow'
    })
  }
})