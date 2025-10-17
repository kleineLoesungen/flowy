import type { FlowTemplate } from '../../../types/FlowTemplate'
import useFileStorage from '../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    // Get all flow templates from storage
    const templates = await storage.getKeys('templates:')
    
    const flowTemplates: FlowTemplate[] = []
    
    for (const key of templates) {
      const template = await storage.getItem(key)
      if (template) {
        flowTemplates.push(template as FlowTemplate)
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