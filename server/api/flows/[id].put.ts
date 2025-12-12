import type { Flow, FlowElement, FlowRelation, ElementLayout } from '../../db/schema'
import { useFlowRepository, useUserRepository } from "../../storage/StorageFactory"
import { normalizeRelations } from "../../utils/relationNormalizer"
import { notifyStatusChange, notifyCommentAdded } from "../../utils/notifications"
import { addLog } from '../../utils/auditLog'
import jwt from 'jsonwebtoken'

/**
 * Request body for updating a flow
 */
interface UpdateFlowRequest {
  name?: string
  description?: string | null
  elements?: FlowElement[]
  relations?: FlowRelation[]
  startingElementId?: string
  startedAt?: string | null
  expectedEndDate?: string | null
  completedAt?: string | null
  hidden?: boolean
  layout?: ElementLayout | null
}

/**
 * Response for flow update
 */
interface UpdateFlowResponse {
  success: true
  data: Flow
}

/**
 * PUT /api/flows/[id] - Update a flow by ID
 * @param id - Flow ID to update
 * @param body - Flow update data
 * @returns The updated flow
 */
export default defineEventHandler(async (event) => {
  const flowRepo = useFlowRepository()
  const flowId = getRouterParam(event, 'id')

  if (!flowId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Flow ID is required'
    })
  }

  try {
    // Get current user's email for notification exclusion
    let currentUserEmail: string | undefined
    try {
      const token = getCookie(event, 'auth-token')
      if (token) {
        const runtimeConfig = useRuntimeConfig()
        const secretKey = runtimeConfig.jwtSecret || 'default-secret-key'
        const decoded = jwt.verify(token, secretKey) as { userId: string; email: string }
        currentUserEmail = decoded.email
      }
    } catch {
      // If we can't get the user, just don't exclude anyone
    }

    // Get existing flow
    const existingFlow = await flowRepo.findById(flowId)
    
    if (!existingFlow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Flow not found'
      })
    }

    // Check if flow is completed - prevent any updates to completed flows
    if (existingFlow.completedAt) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cannot modify completed flows. Use reopen endpoint to make flow active again.'
      })
    }

    // Update flow
    const body = await readBody(event)
    
    // Track changes for notifications
    const statusChanges: Array<{ element: FlowElement; oldStatus: string; newStatus: string }> = []
    const newComments: Array<{ element: FlowElement; comment: any }> = []
    const deletedComments: Array<{ element: FlowElement; comment: any }> = []
    
    // Normalize elements according to their type requirements
    let normalizedElements = body.elements || existingFlow.elements
    if (body.elements) {
      normalizedElements = body.elements.map((element: any) => {
        const normalizedElement = { ...element }
        
        // Find existing element for comparison
        const existingElement = existingFlow.elements.find((e: FlowElement) => e.id === element.id)
        
        // Detect status changes
        if (existingElement && existingElement.status !== element.status) {
          statusChanges.push({
            element: normalizedElement,
            oldStatus: existingElement.status,
            newStatus: element.status
          })
        }
        
        // Detect new comments
        if (existingElement && element.comments && element.comments.length > existingElement.comments.length) {
          const newCommentsForElement = element.comments.slice(existingElement.comments.length)
          newCommentsForElement.forEach((comment: any) => {
            newComments.push({ element: normalizedElement, comment })
          })
        }

        // Detect deleted comments (existing had more comments than incoming)
        if (existingElement && element.comments && element.comments.length < existingElement.comments.length) {
          // Find comments present in existingElement but missing in incoming element (match by id or timestamp)
          const removed = existingElement.comments.filter((ec: any) => {
            return !element.comments.some((nc: any) => (nc.id && ec.id && nc.id === ec.id) || (nc.timestamp && nc.timestamp === ec.timestamp))
          })
          removed.forEach((comment: any) => {
            deletedComments.push({ element: normalizedElement, comment })
          })
        }
        
        // Ensure ownerTeamId is never undefined
        if (normalizedElement.ownerTeamId === undefined) {
          normalizedElement.ownerTeamId = null
        }
        
        // Handle state and artefact elements - clear fields that should be null/empty
        if (element.type === 'state' || element.type === 'artefact') {
          normalizedElement.ownerTeamId = null
          normalizedElement.consultedTeamIds = []
          normalizedElement.completedAt = null
          normalizedElement.expectedEndedAt = null
          normalizedElement.status = 'completed' // Status should be completed for state and artefact
        }
        
        return normalizedElement
      })
    }

    // Detect element-level create/delete/update (excluding comment-only changes)
    const existingElements = existingFlow.elements || []
    const newElements = normalizedElements || []
    const existingMap = new Map(existingElements.map(e => [e.id, e]))
    const newMap = new Map(newElements.map((e: any) => [e.id, e]))

    const createdElements: any[] = []
    const deletedElements: any[] = []
    const updatedElements: any[] = []

    // created
    for (const ne of newElements) {
      if (!existingMap.has(ne.id)) createdElements.push(ne)
    }
    // deleted
    for (const ee of existingElements) {
      if (!newMap.has(ee.id)) deletedElements.push(ee)
    }
    // potential updates (exclude comments when comparing)
    for (const ne of newElements) {
      const ee = existingMap.get(ne.id)
      if (!ee) continue
      const copyNew = { ...ne, comments: undefined }
      const copyOld = { ...ee, comments: undefined }
      if (JSON.stringify(copyNew) !== JSON.stringify(copyOld)) {
        updatedElements.push({ old: ee, new: ne })
      }
    }
    // Exclude elements that are already tracked as status changes to avoid duplicate element_updated logs
    const statusChangedIds = new Set(statusChanges.map(s => s.element?.id).filter(Boolean))
    const filteredUpdatedElements = updatedElements.filter(pair => !statusChangedIds.has(pair.new?.id))
    // replace updatedElements with filtered list
    updatedElements.length = 0
    updatedElements.push(...filteredUpdatedElements)
    
    // Normalize relations if provided - group and correct direction
    let normalizedRelations = body.relations !== undefined ? body.relations : existingFlow.relations
    if (body.relations && body.relations.length > 0) {
      normalizedRelations = normalizeRelations(
        body.relations as any[], 
        body.startingElementId || existingFlow.startingElementId || '',
        normalizedElements.map((el: any) => ({ id: el.id, type: el.type, name: el.name }))
      ) as FlowRelation[]
    }

    // Prepare update data
    const updateData: Partial<Flow> = {
      ...body,
      elements: normalizedElements,
      relations: normalizedRelations,
      hidden: body.hidden ?? existingFlow.hidden
    }

    // Update flow using repository
    const updatedFlow = await flowRepo.update(flowId, updateData)
    
    // Send notifications asynchronously (don't await to avoid blocking the response)
    if (statusChanges.length > 0 || newComments.length > 0 || deletedComments.length > 0 || createdElements.length > 0 || deletedElements.length > 0 || updatedElements.length > 0) {
      setImmediate(async () => {
        try {
          // Notify status changes
          for (const { element, oldStatus, newStatus } of statusChanges) {
            await notifyStatusChange(flowId, updatedFlow.name, element, oldStatus, newStatus, currentUserEmail)
            // Log as element update (status change)
            try { await addLog({ type: 'element_updated', flowId, elementId: element.id, changedBy: currentUserEmail ?? null, message: `${element.name}: ${oldStatus} → ${newStatus}`, details: { change: 'status', oldStatus, newStatus } }) } catch (e) {}
          }
          
          // Notify new comments
          for (const { element, comment } of newComments) {
            await notifyCommentAdded(flowId, updatedFlow.name, element, comment, currentUserEmail)
            // Log comment (include element metadata in details)
            try {
              await addLog({
                type: 'comment_added',
                flowId,
                elementId: element?.id ?? null,
                commentId: comment?.id ?? null,
                changedBy: comment.userEmail || currentUserEmail || null,
                message: comment.comment,
                details: { comment, element: { id: element?.id || null, name: element?.name || null, type: element?.type || null } }
              })
            } catch (e) {}
          }
          // Log deleted comments
          for (const { element, comment } of deletedComments) {
            try {
              await addLog({
                type: 'comment_deleted',
                flowId,
                elementId: element?.id ?? null,
                commentId: comment?.id ?? null,
                changedBy: currentUserEmail ?? null,
                message: `${element?.name || 'element'}: ${comment.comment || 'deleted comment'}`,
                details: { comment, element: { id: element?.id || null, name: element?.name || null, type: element?.type || null } }
              })
            } catch (e) {}
          }
          // Log element creations
          for (const ce of createdElements) {
            try { await addLog({ type: 'element_created', flowId, elementId: ce.id ?? null, changedBy: currentUserEmail ?? null, message: `Element created: ${ce.name || ce.id}`, details: { element: ce } }) } catch (e) {}
          }
          // Log element deletions
          for (const de of deletedElements) {
            try { await addLog({ type: 'element_deleted', flowId, elementId: de.id ?? null, changedBy: currentUserEmail ?? null, message: `Element deleted: ${de.name || de.id}`, details: { element: de } }) } catch (e) {}
          }
          // Log element updates (non-comment changes)
          for (const pair of updatedElements) {
            try { await addLog({ type: 'element_updated', flowId, elementId: pair.new.id ?? null, changedBy: currentUserEmail ?? null, message: `Element updated: ${pair.new.name || pair.new.id}`, details: { old: pair.old, new: pair.new } }) } catch (e) {}
          }
        } catch (notificationError: any) {
          console.error('Error sending notifications:', notificationError.message)
        }
      })
    }
    // Log flow update only if metadata fields changed (not element-only changes)
    const metaKeys = ['name', 'description', 'startingElementId', 'startedAt', 'expectedEndDate', 'completedAt', 'hidden', 'layout']
    let metaChanged = false
    for (const k of metaKeys) {
      if ((body as any)[k] !== undefined) {
        // compare with existingFlow
        if (JSON.stringify((body as any)[k]) !== JSON.stringify((existingFlow as any)[k])) {
          metaChanged = true
          break
        }
      }
    }
    if (metaChanged) {
      try { await addLog({ type: 'flow_updated', flowId, changedBy: currentUserEmail ?? null, message: `Flow updated: ${flowId}` }) } catch (e) {}
    }
    // If flow was completed now, log flow_completed
    try {
      if (!existingFlow.completedAt && (body as any).completedAt) {
        try { await addLog({ type: 'flow_completed', flowId, changedBy: currentUserEmail ?? null, message: `Flow completed: ${flowId}` }) } catch (e) {}
      }
    } catch (e) {}
    
    return { 
      success: true,
      data: updatedFlow 
    }
  } catch (error: any) {
    // Re-throw HTTP errors
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error updating flow:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating flow: ${error.message}`
    })
  }
})