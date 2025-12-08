import type { Flow } from '../../../db/schema'
import { useFlowRepository } from "../../../storage/StorageFactory"

/**
 * Response for all completed flows
 */
interface AllCompletedFlowsResponse {
  success: true
  data: Flow[]
}

/**
 * GET /api/flows/completed/all - Get all completed flows across all users
 * @returns List of all completed flows in the system
 */
export default defineEventHandler(async (event) => {
  const flowRepo = useFlowRepository()

  try {
    // Get all flows from repository
    const allFlows = await flowRepo.findAll()
    
    // Filter to only completed flows
    const completedFlows = allFlows.filter(flow => flow.completedAt)
    
    // Sort by completion date (most recent first)
    completedFlows.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    
    return { data: completedFlows }
  } catch (error) {
    console.error('Error fetching completed flows:', error)
    return { data: [] }
  }
})