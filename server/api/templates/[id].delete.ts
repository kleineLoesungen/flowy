import { useTemplateRepository, useUserRepository, useFlowRepository } from "../../storage/StorageFactory"
import jwt from 'jsonwebtoken'

/**
 * Response for template deletion
 */
interface DeleteTemplateResponse {
  success: true
  message: string
}

/**
 * DELETE /api/templates/[id] - Delete a template by ID
 * @param id - Template ID to delete
 * @returns Confirmation of deletion
 */
async function getCurrentUser(event: any) {
  try {
    const token = getCookie(event, 'auth-token')
    if (!token) return null

    const runtimeConfig = useRuntimeConfig()
    const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
    const decoded: any = jwt.verify(token, secretKey)

    const userRepo = useUserRepository()
    const user = await userRepo.findById(decoded.userId)
    return user
  } catch (error) {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const templateRepo = useTemplateRepository()
  const flowRepo = useFlowRepository()
  
  try {
    const templateId = getRouterParam(event, 'id')
    
    if (!templateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template ID is required'
      })
    }

    // Get current user for authorization
    const currentUser = await getCurrentUser(event)
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }
    
    // Check if template exists
    const existingTemplate = await templateRepo.findById(templateId)
    if (!existingTemplate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    }
    
    // Check if template is being used by any flows
    const relatedFlows = await flowRepo.findByTemplateId(templateId)
    if (relatedFlows.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot delete template. It is being used by ${relatedFlows.length} flow(s). Please delete or update those flows first.`
      })
    }
    
    // Delete template using repository
    await templateRepo.delete(templateId)
    
    return {
      success: true,
      message: 'Template deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error deleting template:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error deleting template: ${error.message}`
    })
  }
})