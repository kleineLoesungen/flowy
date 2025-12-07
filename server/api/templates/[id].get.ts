import type { FlowTemplate } from '../../db/schema'
import { useTemplateRepository } from "../../storage/StorageFactory"

/**
 * Response for template details
 */
interface TemplateDetailsResponse {
  success: true
  data: FlowTemplate
}

/**
 * GET /api/templates/[id]
 * 
 * Get a specific template by ID
 */
export default defineEventHandler(async (event) => {
  const templateRepo = useTemplateRepository()
  
  try {
    const templateId = getRouterParam(event, 'id')
    
    if (!templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    }
    
    // Get the specific template from repository
    const template = await templateRepo.findById(templateId)
    
    if (!template) {
      throw createError({
        statusCode: 404,
        statusMessage: `Flow template with ID "${templateId}" not found`
      })
    }
    
    return {
      success: true,
      data: template
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Template API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch template',
      data: { message: error.message, stack: error.stack }
    })
  }
})