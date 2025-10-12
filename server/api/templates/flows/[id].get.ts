import type { FlowTemplate } from '../../../../types/FlowTemplate'
import useFileStorage from '../../../utils/useFileStorage'

export default defineEventHandler(async (event) => {
  const storage = useFileStorage()
  
  try {
    const templateId = getRouterParam(event, 'id')
    
    if (!templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    }
    
    // Get the specific template from storage
    const template = await storage.getItem(`templates:flows:${templateId}`)
    
    if (!template) {
      throw createError({
        statusCode: 404,
        statusMessage: `Flow template with ID "${templateId}" not found`
      })
    }
    
    return {
      data: template as FlowTemplate
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