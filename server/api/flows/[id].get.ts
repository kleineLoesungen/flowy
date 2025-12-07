import type { Flow } from '../../db/schema'
import { useFlowRepository } from "../../storage/StorageFactory"

/**
 * Response for getting a single flow
 */
interface FlowResponse {
  success: true
  data: Flow
}

/**
 * GET /api/flows/[id] - Get a single flow by ID
 * @param id - Flow ID to retrieve
 * @returns The flow details
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

  // Get flow by ID using repository
  const flow = await flowRepo.findById(flowId)

  if (!flow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Flow not found'
    })
  }

  return { data: flow }
})