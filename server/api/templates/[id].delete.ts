import type { FlowTemplate } from '../../../types/FlowTemplate'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
  try {
    const templateId = getRouterParam(event, 'id')
    
    if (!templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
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
    
    // Delete the template
    await storage.removeItem(key)
    
    return {
      success: true,
      message: 'Template deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete flow template',
      data: error
    })
  }
})