import type { Flow } from '../../../../types/Flow'
import { useDatabaseStorage } from '../../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()

  // Try to get flows from organized structure first
  try {
    const flowsKeys = await storage.getKeys('flows:')
    const flows: Flow[] = []

    for (const key of flowsKeys) {
      const flow = await storage.getItem(key) as Flow
      if (flow && flow.completedAt) { // Only include completed flows
        flows.push(flow)
      }
    }

    if (flows.length > 0) {
      // Sort by completion date (most recent first)
      flows.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      return { data: flows }
    }
  } catch (error) {
    // Fall back to legacy format if organized structure doesn't exist
    console.log('Error accessing organized flows structure:', error)
  }

  // Fallback to legacy array format
  const flows = (await storage.getItem('flows') as Flow[]) || []
  // Ensure flows is an array
  const flowsArray = Array.isArray(flows) ? flows : []
  // Filter to only completed flows
  const completedFlows = flowsArray.filter(flow => flow.completedAt)
  // Sort by completion date (most recent first)
  completedFlows.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
  return { data: completedFlows }
})