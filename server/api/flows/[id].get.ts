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

  // Get individual flow
  try {
    // Try organized structure first
    const flow = await storage.getItem(`flows:${flowId}`) as Flow
    if (flow) {
      return { data: flow }
    }
  } catch (error) {
    // Fall back to legacy format
  }

  // Fallback to legacy array format
  const flows = (await storage.getItem('flows') as Flow[]) || []
  const flow = flows.find(f => f.id === flowId)

  if (!flow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Flow not found'
    })
  }

  return { data: flow }
})