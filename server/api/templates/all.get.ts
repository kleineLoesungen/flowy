import type { FlowTemplate } from '../../db/schema'
import { useTemplateRepository } from "../../storage/StorageFactory"

/**
 * Response for all templates with full data
 */
interface TemplatesFullResponse {
  success: true
  data: FlowTemplate[]
}

/**
 * GET /api/templates/all
 * 
 * Get all flow templates with full data (including elements)
 * Used for advanced filtering in template overview
 */
export default defineEventHandler(async (event) => {
  const templateRepo = useTemplateRepository()
  
  try {
    // Get all templates with full data
    const templates = await templateRepo.findAll()
    
    const response: TemplatesFullResponse = {
      success: true,
      data: templates
    }
    
    return response
    
  } catch (error) {
    console.error('Error fetching all templates:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch templates'
    })
  }
})