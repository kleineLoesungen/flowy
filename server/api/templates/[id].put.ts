import type { FlowTemplate } from '../../../types/FlowTemplate'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'
import { correctTemplateRelations } from '../../utils/templates/correctTemplateRelations'
import { migrateLegacyRelations } from '../../utils/templates/migrateRelations'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
  try {
    const templateId = getRouterParam(event, 'id')
    const bodyData = await readBody(event) as FlowTemplate
    
    // Create a mutable copy to allow modifications
    const body = { ...bodyData }
    
    if (!templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    }
    
    // Validate required fields
    if (!body.name || !body.description) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and description are required'
      })
    }
    
    // Normalize element templates according to their type requirements
    if (body.elements) {
      body.elements = body.elements.map((element: any) => {
        const normalizedElement = { ...element }
        
        // Handle state and artefact elements - clear fields that should be null/empty
        if (element.type === 'state' || element.type === 'artefact') {
          normalizedElement.ownerTeamId = null
          normalizedElement.durationDays = null
          normalizedElement.consultedTeamIds = []
        }
        
        return normalizedElement
      })
    }
    
    // Validate and auto-set starting element
    if (body.elements && body.elements.length > 0) {
      // If no starting element is defined but we have elements, set the first element as starting
      if (!body.startingElementId) {
        body.startingElementId = body.elements[0].id
        console.log(`Auto-setting starting element to first element: ${body.startingElementId}`)
      }
      
      // Check if starting element exists
      const startingElementExists = body.elements.some(el => el.id === body.startingElementId)
      if (!startingElementExists) {
        // If the current startingElementId doesn't exist, set it to the first element
        body.startingElementId = body.elements[0].id
        console.log(`Starting element not found, auto-setting to first element: ${body.startingElementId}`)
      }
    } else {
      // If no elements, clear the starting element ID
      body.startingElementId = null
    }
    
    // Migrate legacy relations to new format
    if (body.relations) {
      body.relations = migrateLegacyRelations(body.relations as any)
    }

    // Clean up orphaned relations
    if (body.elements && body.relations) {
      const existingElementIds = new Set(body.elements.map(el => el.id))
      const originalRelationsCount = body.relations.length
      
      // Filter and clean relations
      body.relations = body.relations
        .map(relation => {
          // Filter out connections with non-existent element IDs
          const validConnections = relation.connections.filter(connection => 
            existingElementIds.has(connection.fromElementId) && 
            existingElementIds.has(connection.toElementId)
          )
          
          // Return updated relation if it still has valid connections
          if (validConnections.length > 0) {
            return {
              ...relation,
              connections: validConnections
            }
          }
          
          // Return null for relations with no valid connections (will be filtered out)
          return null
        })
        .filter(relation => relation !== null) // Remove null relations
      
      const cleanedRelationsCount = body.relations.length
      const removedRelationsCount = originalRelationsCount - cleanedRelationsCount
    }
    
    // Check if template exists
    const key = `templates:${templateId}`
    const existingTemplate = await storage.getItem(key) as FlowTemplate
    
    if (!existingTemplate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    }
    
    // Correct relation directions from starting element
    body.id = templateId
    const correctedTemplate = correctTemplateRelations(body)
    
    // Update the template
    await storage.setItem(key, correctedTemplate)
    
    return {
      success: true,
      data: correctedTemplate
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update flow template',
      data: error
    })
  }
})