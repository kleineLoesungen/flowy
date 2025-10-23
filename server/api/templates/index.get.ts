import type { FlowTemplate } from '../../../types/FlowTemplate'
import { useDatabaseStorage } from '../../utils/useDatabaseStorage'
import { migrateLegacyRelations } from '../../utils/templates/migrateRelations'

export default defineEventHandler(async (event) => {
  const storage = useDatabaseStorage()
  
  try {
    // Get all flow templates from storage
    const templates = await storage.getKeys('templates:')
    
    const flowTemplates: FlowTemplate[] = []
    
    for (const key of templates) {
      let template = await storage.getItem(key) as FlowTemplate
      if (template) {
        // Migrate legacy relations if needed
        if (template.relations) {
          template.relations = migrateLegacyRelations(template.relations as any)
        }
        flowTemplates.push(template)
      }
    }
    
    return {
      data: flowTemplates,
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch flow templates',
      data: error
    })
  }
})