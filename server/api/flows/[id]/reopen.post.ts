import type { Flow } from '../../../../types/Flow'
import { useDatabaseStorage } from '../../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const flowId = getRouterParam(event, 'id')
  
  if (!flowId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Flow ID is required'
    })
  }

  const storage = useDatabaseStorage()

  try {
    // Try to get flow from organized structure first
    let flow: Flow | null = null
    
    try {
      flow = await storage.getItem(`flows:${flowId}`) as Flow
    } catch (error) {
      // Fall back to legacy format if organized structure doesn't exist
      console.log('Error accessing organized flow structure, trying legacy format:', error)
    }

    // Fallback to legacy array format
    if (!flow) {
      const flows = (await storage.getItem('flows') as Flow[]) || []
      flow = flows.find(f => f.id === flowId) || null
    }

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

    // Remove the completion date to reopen the flow
    flow.completedAt = null

    // Save the updated flow back to storage
    try {
      // Try organized structure first
      await storage.setItem(`flows:${flowId}`, flow)
    } catch (error) {
      // Fall back to legacy format
      const flows = (await storage.getItem('flows') as Flow[]) || []
      const flowIndex = flows.findIndex(f => f.id === flowId)
      
      if (flowIndex !== -1) {
        flows[flowIndex] = flow
        await storage.setItem('flows', flows)
      }
    }

    return {
      success: true,
      message: 'Flow reopened successfully',
      data: flow
    }

  } catch (error) {
    console.error('Error reopening flow:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to reopen flow'
    })
  }
})