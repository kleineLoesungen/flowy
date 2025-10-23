import type { Flow } from '../../../types/Flow'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()

  // Create new flow
  const body = await readBody(event)
  
  // console.log('Server received flow body:', JSON.stringify(body, null, 2))
  
  // Normalize elements according to their type requirements
  let normalizedElements = body.elements || []
  if (normalizedElements.length > 0) {
    normalizedElements = normalizedElements.map((element: any) => {
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

  const newFlow: Flow = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    name: body.name,
    description: body.description || null,
    templateId: body.templateId,
    startedAt: body.startedAt || new Date().toISOString(),
    expectedEndDate: body.expectedEndDate || null,
    completedAt: body.completedAt || null,
    elements: normalizedElements,
    relations: body.relations || [],
    startingElementId: body.startingElementId || '',
    hidden: body.hidden || false, // Default to false if not provided
    layout: body.layout || undefined
  }

  // console.log('Server created newFlow:', JSON.stringify(newFlow, null, 2))

  // Save to organized structure (individual files)
  await storage.setItem(`flows:${newFlow.id}`, newFlow)

  return newFlow

})