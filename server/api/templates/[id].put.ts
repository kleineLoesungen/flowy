import type { FlowTemplate, FlowElement, FlowRelation, ElementLayout } from '../../db/schema'
import { useTemplateRepository, useUserRepository } from "../../storage/StorageFactory"
import { normalizeRelations } from "../../utils/relationNormalizer"
import jwt from 'jsonwebtoken'
import { addLog } from '../../utils/auditLog'

/**
 * Request body for updating a template
 */
interface UpdateTemplateRequest {
  name?: string
  description?: string
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  layout?: ElementLayout
}

/**
 * Response for template update
 */
interface UpdateTemplateResponse {
  success: true
  data: FlowTemplate
}

/**
 * GET current authenticated user
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
  
  try {
    const templateId = getRouterParam(event, 'id')
    const body = await readBody(event) as Partial<FlowTemplate>
    
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
    
    // Basic validation for updated fields
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Template name must be a non-empty string'
        })
      }
      body.name = body.name.trim()
    }
    
    if (body.description !== undefined) {
      if (typeof body.description !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Template description must be a string'
        })
      }
      body.description = body.description.trim()
    }
    
    // Normalize element templates if provided
    if (body.elements && body.elements.length > 0) {
      body.elements = body.elements.map((element: any) => {
        const normalizedElement = { ...element }
        
        // Handle state and artefact elements - clear fields that should be null/empty
        if (element.type === 'state' || element.type === 'artefact') {
          normalizedElement.ownerTeamId = null
          normalizedElement.consultedTeamIds = []
          normalizedElement.expectedDuration = null
        }
        
        return normalizedElement
      })
    }
    
    // Normalize relations if provided - group and correct direction
    if (body.relations && body.relations.length > 0) {
      const elements = body.elements || existingTemplate.elements || []
      body.relations = normalizeRelations(
        body.relations as any[], 
        body.startingElementId || existingTemplate.startingElementId,
        elements.map((el: any) => ({ id: el.id, type: el.type, name: el.name }))
      ) as FlowRelation[]
    }
    
    // Update template using repository
    const updatedTemplate = await templateRepo.update(templateId, body)
    // Determine if metadata (non-element) changed and detect element diffs
    const bodyAny = body as any
    const metaKeys = ['name', 'description', 'startingElementId', 'layout']
    let metaChanged = false
    for (const k of metaKeys) {
      if (bodyAny[k] !== undefined && JSON.stringify(bodyAny[k]) !== JSON.stringify((existingTemplate as any)[k])) {
        metaChanged = true
        break
      }
    }

    // Element diffs
    const existingElements = existingTemplate.elements || []
    const newElements = (body.elements && body.elements.length > 0) ? body.elements : existingElements
    const existingMap = new Map(existingElements.map((e: any) => [e.id, e]))
    const newMap = new Map((newElements || []).map((e: any) => [e.id, e]))
    const createdElements: any[] = []
    const deletedElements: any[] = []
    const updatedElements: any[] = []
    for (const ne of (newElements || [])) {
      if (!existingMap.has(ne.id)) createdElements.push(ne)
    }
    for (const ee of existingElements) {
      if (!newMap.has(ee.id)) deletedElements.push(ee)
    }
    for (const ne of (newElements || [])) {
      const ee = existingMap.get(ne.id)
      if (!ee) continue
      const copyNew = { ...ne, comments: undefined }
      const copyOld = { ...ee, comments: undefined }
      if (JSON.stringify(copyNew) !== JSON.stringify(copyOld)) updatedElements.push({ old: ee, new: ne })
    }

    try {
      const userEmail = currentUser?.email
      if (metaChanged) {
        await addLog({ type: 'template_updated', templateId, changedBy: userEmail ?? null, message: `Template ${templateId} updated by ${userEmail || 'unknown'}` })
      }
      for (const ce of createdElements) {
        try { await addLog({ type: 'element_created', templateId, elementId: ce.id ?? null, changedBy: userEmail ?? null, message: `Template element created: ${ce.name || ce.id}`, details: { element: ce } }) } catch (e) {}
      }
      for (const de of deletedElements) {
        try { await addLog({ type: 'element_deleted', templateId, elementId: de.id ?? null, changedBy: userEmail ?? null, message: `Template element deleted: ${de.name || de.id}`, details: { element: de } }) } catch (e) {}
      }
      for (const pair of updatedElements) {
        try { await addLog({ type: 'element_updated', templateId, elementId: pair.new.id ?? null, changedBy: userEmail ?? null, message: `Template element updated: ${pair.new.name || pair.new.id}`, details: { old: pair.old, new: pair.new } }) } catch (e) {}
      }
    } catch (e) {
      // ignore logging errors
    }

    return {
      success: true,
      data: updatedTemplate
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error updating template:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating template: ${error.message}`
    })
  }
})