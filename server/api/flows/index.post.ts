import type { Flow } from '../../../types/Flow'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()

  // Create new flow
  const body = await readBody(event)

  const newFlow: Flow = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    name: body.name,
    description: body.description || null,
    templateId: body.templateId,
    startedAt: body.startedAt || new Date().toISOString(),
    expectedEndDate: body.expectedEndDate || null,
    completedAt: body.completedAt || null,
    elements: body.elements || [],
    relations: body.relations || [],
    startingElementId: body.startingElementId || '',
    layout: body.layout || undefined
  }

  // Save to organized structure (individual files)
  await storage.setItem(`flows:${newFlow.id}`, newFlow)

  return newFlow

})