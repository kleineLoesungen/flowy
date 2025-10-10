import type { FlowTemplate } from '../../../../types/FlowTemplate'
import useFileStorage from '../../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const templateId = getRouterParam(event, 'id')
    const body = await readBody(event) as FlowTemplate
    
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
    
    // Clean up orphaned relations
    if (body.elements && body.relations) {
      const existingElementIds = new Set(body.elements.map(el => el.id))
      const originalRelationsCount = body.relations.length
      
      // Filter and clean relations
      body.relations = body.relations
        .map(relation => {
          // Filter out non-existent fromElementIds
          const validFromIds = relation.fromElementIds.filter((id: string) => existingElementIds.has(id))
          
          // Filter out non-existent toElementIds
          const validToIds = relation.toElementIds.filter((id: string) => existingElementIds.has(id))
          
          // Return updated relation if it still has valid connections
          if (validFromIds.length > 0 && validToIds.length > 0) {
            return {
              ...relation,
              fromElementIds: validFromIds,
              toElementIds: validToIds
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
    const key = `templates:flows:${templateId}`
    const existingTemplate = await storage.getItem(key) as FlowTemplate
    
    if (!existingTemplate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    }
    
    // Update the template
    body.id = templateId
    await storage.setItem(key, body)
    
    return {
      success: true,
      data: body
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