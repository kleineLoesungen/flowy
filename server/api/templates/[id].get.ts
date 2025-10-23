import type { FlowTemplate } from '../../../types/FlowTemplate'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'
import { migrateLegacyRelations } from '../../utils/templates/migrateRelations'

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
    
    // Get the specific template from storage
    let template = await storage.getItem(`templates:${templateId}`) as FlowTemplate
    
    if (!template) {
      throw createError({
        statusCode: 404,
        statusMessage: `Flow template with ID "${templateId}" not found`
      })
    }
    
    // Migrate legacy relations if needed
    if (template.relations) {
      template.relations = migrateLegacyRelations(template.relations as any)
    }
    
    return {
      data: template
    }
  } catch (error) {
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // Otherwise, wrap in a generic 500 error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch flow template',
      data: error
    })
  }
})