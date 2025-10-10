import type { Flow } from '../../../types/Flow'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
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
      await storage.removeItem(`flows:${flowId}`)
      return { success: true, flow: existingFlow }
    }
  } catch (error) {
    // Fall back to legacy format
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

  const deletedFlow = flows[flowIndex]
  flows.splice(flowIndex, 1)
  await storage.setItem('flows', flows)

  return { success: true, flow: deletedFlow }

})