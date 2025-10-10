import type { Flow } from '../../../types/Flow'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()

  // Try to get flows from organized structure first
  try {
    const flowsKeys = await storage.getKeys('flows:')
    const flows: Flow[] = []

    for (const key of flowsKeys) {
      const flow = await storage.getItem(key) as Flow
      if (flow) flows.push(flow)
    }

    if (flows.length > 0) {
      return flows
    }
  } catch (error) {
    // Fall back to legacy format if organized structure doesn't exist
    console.log('Error accessing organized flows structure:', error)
  }

  // Fallback to legacy array format
  const flows = (await storage.getItem('flows') as Flow[]) || []
  return flows

})