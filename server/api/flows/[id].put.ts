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

  // Update flow
  const body = await readBody(event)
  
  // Normalize elements according to their type requirements
  if (body.elements) {
    body.elements = body.elements.map((element: any) => {
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

  try {
    // Try to get from organized structure first
    const existingFlow = await storage.getItem(`flows:${flowId}`) as Flow
    if (existingFlow) {
      // Check if flow is completed - prevent any updates to completed flows
      if (existingFlow.completedAt) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Cannot modify completed flows. Use reopen endpoint to make flow active again.'
        })
      }

      const updatedFlow: Flow = {
        ...existingFlow,
        ...body,
        id: flowId // Ensure ID doesn't change
      }

      await storage.setItem(`flows:${flowId}`, updatedFlow)
      return { data: updatedFlow }
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

  // Check if flow is completed - prevent any updates to completed flows
  if (flows[flowIndex].completedAt) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot modify completed flows. Use reopen endpoint to make flow active again.'
    })
  }

  const updatedFlow: Flow = {
    ...flows[flowIndex],
    ...body,
    id: flowId // Ensure ID doesn't change
  }

  flows[flowIndex] = updatedFlow
  await storage.setItem('flows', flows)

  return { data: updatedFlow }
})