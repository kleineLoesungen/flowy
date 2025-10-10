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

  // Update flow
  const body = await readBody(event)

  try {
    // Try to get from organized structure first
    const existingFlow = await storage.getItem(`flows:${flowId}`) as Flow
    if (existingFlow) {
      const updatedFlow: Flow = {
        ...existingFlow,
        ...body,
        id: flowId // Ensure ID doesn't change
      }

      await storage.setItem(`flows:${flowId}`, updatedFlow)
      return updatedFlow
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

  const updatedFlow: Flow = {
    ...flows[flowIndex],
    ...body,
    id: flowId // Ensure ID doesn't change
  }

  flows[flowIndex] = updatedFlow
  await storage.setItem('flows', flows)

  return updatedFlow
})