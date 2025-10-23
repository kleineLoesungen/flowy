import type { Flow } from '../../../types/Flow'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  const flowId = getRouterParam(event, 'id')

  if (!flowId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Flow ID is required'
    })
  }

  // Delete flow
  try {
    // Try organized structure first
    const existingFlow = await storage.getItem(`flows:${flowId}`) as Flow
    if (existingFlow) {
      // Check if flow is completed - prevent deletion of completed flows
      if (existingFlow.completedAt) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Cannot delete completed flows. Use reopen endpoint to make flow active again before deletion.'
        })
      }

      await storage.removeItem(`flows:${flowId}`)
      return { success: true, flow: existingFlow }
    }
  } catch (error) {
    // If it's our custom error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error && (error as any).statusCode === 403) {
      throw error
    }
    // Fall back to legacy format for other errors
  }

  // Fallback to legacy array format
  const flows = (await storage.getItem('flows') as Flow[]) || []
  const flowIndex = flows.findIndex(flow => flow.id === flowId)

  if (flowIndex === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Flow not found'
    })
  }

  // Check if flow is completed - prevent deletion of completed flows
  if (flows[flowIndex].completedAt) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot delete completed flows. Use reopen endpoint to make flow active again before deletion.'
    })
  }

  const deletedFlow = flows[flowIndex]
  flows.splice(flowIndex, 1)
  await storage.setItem('flows', flows)

  return { success: true, flow: deletedFlow }

})