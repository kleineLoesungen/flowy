import type { Flow, NewFlow } from '../../db/schema'
import { BaseRepository } from './BaseRepository'
import { TemplateRepository } from './TemplateRepository'
import type { IStorage } from '../interfaces/IStorage'

export class FlowRepository extends BaseRepository<Flow> {
  constructor(storage: IStorage) {
    super(storage, 'flows')
  }

  /**
   * Find flows by template ID
   */
  async findByTemplateId(templateId: string): Promise<Flow[]> {
    return this.findWhere({ templateId })
  }

  /**
   * Find active flows (not completed)
   */
  async findActive(): Promise<Flow[]> {
    const flows = await this.findAll()
    return flows.filter(flow => !flow.completedAt && !flow.hidden)
  }

  /**
   * Find completed flows
   */
  async findCompleted(): Promise<Flow[]> {
    const flows = await this.findAll()
    return flows.filter(flow => !!flow.completedAt)
  }

  /**
   * Find flows by status (based on elements)
   */
  async findByStatus(status: 'pending' | 'in-progress' | 'completed' | 'aborted'): Promise<Flow[]> {
    const flows = await this.findAll()
    return flows.filter(flow => {
      if (status === 'completed') return !!flow.completedAt
      if (status === 'aborted') return flow.hidden
      
      // For pending/in-progress, check elements
      const hasElementsWithStatus = flow.elements.some(element => element.status === status)
      return hasElementsWithStatus
    })
  }

  /**
   * Find flows with overdue elements
   */
  async findOverdue(): Promise<Flow[]> {
    const flows = await this.findActive()
    const now = new Date()
    
    return flows.filter(flow => {
      return flow.elements.some(element => {
        if (!element.expectedEndedAt || element.status === 'completed') return false
        const expectedEnd = new Date(element.expectedEndedAt)
        return expectedEnd < now
      })
    })
  }

  /**
   * Find flows starting soon (within days)
   */
  async findStartingSoon(days: number = 7): Promise<Flow[]> {
    const flows = await this.findActive()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    
    return flows.filter(flow => {
      if (!flow.startedAt) return false
      const startDate = new Date(flow.startedAt)
      return startDate <= futureDate
    })
  }

  /**
   * Find flows by team involvement (owner or consulted)
   */
  async findByTeamInvolvement(teamId: string): Promise<Flow[]> {
    const flows = await this.findAll()
    return flows.filter(flow => {
      return flow.elements.some(element => 
        element.ownerTeamId === teamId || 
        element.consultedTeamIds.includes(teamId)
      )
    })
  }

  /**
   * Count flows by template
   */
  async countByTemplate(): Promise<Map<string, number>> {
    const flows = await this.findAll()
    const counts = new Map<string, number>()
    
    flows.forEach(flow => {
      if (flow.templateId) {
        counts.set(flow.templateId, (counts.get(flow.templateId) || 0) + 1)
      }
    })
    
    return counts
  }

  /**
   * Complete a flow
   */
  async completeFlow(flowId: string): Promise<Flow> {
    const flow = await this.findById(flowId)
    if (!flow) {
      throw new Error(`Flow with id ${flowId} not found`)
    }

    // Mark all elements as completed
    const completedElements = flow.elements.map(element => ({
      ...element,
      status: 'completed' as const,
      completedAt: element.completedAt || new Date().toISOString()
    }))

    return this.update(flowId, {
      elements: completedElements,
      completedAt: new Date().toISOString()
    })
  }

  /**
   * Reopen a completed flow
   */
  async reopenFlow(flowId: string): Promise<Flow> {
    const flow = await this.findById(flowId)
    if (!flow) {
      throw new Error(`Flow with id ${flowId} not found`)
    }

    return this.update(flowId, {
      completedAt: null,
      hidden: false
    })
  }

  /**
   * Hide/Archive a flow
   */
  async hideFlow(flowId: string): Promise<Flow> {
    return this.update(flowId, { hidden: true })
  }

  /**
   * Show/Unarchive a flow
   */
  async showFlow(flowId: string): Promise<Flow> {
    return this.update(flowId, { hidden: false })
  }

  /**
   * Update element status in a flow
   */
  async updateElementStatus(
    flowId: string, 
    elementId: string, 
    status: 'pending' | 'in-progress' | 'completed' | 'aborted',
    comment?: string
  ): Promise<Flow> {
    const flow = await this.findById(flowId)
    if (!flow) {
      throw new Error(`Flow with id ${flowId} not found`)
    }

    const elementIndex = flow.elements.findIndex(el => el.id === elementId)
    if (elementIndex === -1) {
      throw new Error(`Element with id ${elementId} not found in flow`)
    }

    const updatedElements = [...flow.elements]
    const element = updatedElements[elementIndex]
    
    updatedElements[elementIndex] = {
      ...element,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : element.completedAt,
      comments: comment ? [
        ...element.comments,
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          comment,
          userId: '', // Should be set by the caller
          statusTag: status
        }
      ] : element.comments
    }

    return this.update(flowId, { elements: updatedElements })
  }

  /**
   * Add comment to element
   */
  async addElementComment(
    flowId: string, 
    elementId: string, 
    comment: string, 
    userId: string,
    userName?: string,
    userEmail?: string
  ): Promise<Flow> {
    const flow = await this.findById(flowId)
    if (!flow) {
      throw new Error(`Flow with id ${flowId} not found`)
    }

    const elementIndex = flow.elements.findIndex(el => el.id === elementId)
    if (elementIndex === -1) {
      throw new Error(`Element with id ${elementId} not found in flow`)
    }

    const updatedElements = [...flow.elements]
    const element = updatedElements[elementIndex]
    
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      comment,
      userId,
      userName,
      userEmail
    }

    updatedElements[elementIndex] = {
      ...element,
      comments: [...element.comments, newComment]
    }

    return this.update(flowId, { elements: updatedElements })
  }

  /**
   * Get flow statistics
   */
  async getFlowStats(): Promise<{
    total: number
    active: number
    completed: number
    hidden: number
    overdue: number
  }> {
    const flows = await this.findAll()
    const active = flows.filter(f => !f.completedAt && !f.hidden)
    const completed = flows.filter(f => !!f.completedAt)
    const hidden = flows.filter(f => f.hidden)
    
    const now = new Date()
    const overdue = active.filter(flow => 
      flow.elements.some(element => {
        if (!element.expectedEndedAt || element.status === 'completed') return false
        const expectedEnd = new Date(element.expectedEndedAt)
        return expectedEnd < now
      })
    )

    return {
      total: flows.length,
      active: active.length,
      completed: completed.length,
      hidden: hidden.length,
      overdue: overdue.length
    }
  }

  /**
   * Create flow with validation
   */
  async create(data: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flow> {
    await this.validateData(data)
    return super.create(data)
  }

  /**
   * Update flow with validation
   */
  async update(id: string, data: Partial<Flow>): Promise<Flow> {
    await this.validateData(data)
    return super.update(id, data)
  }

  /**
   * Validate flow data
   */
  protected async validateData(data: Partial<Flow>): Promise<void> {
    if (data.name && data.name.trim().length < 2) {
      throw new Error('Flow name must be at least 2 characters long')
    }

    if (data.templateId) {
      const templateRepo = new TemplateRepository(this.storage)
      const templateExists = await templateRepo.exists(data.templateId)
      if (!templateExists) {
        throw new Error(`Template with id ${data.templateId} does not exist`)
      }
    }

    if (data.elements) {
      // Validate element structure
      for (const element of data.elements) {
        if (!element.id || !element.name || !element.type) {
          throw new Error('Invalid element structure: id, name, and type are required')
        }
        
        if (!['action', 'state', 'artefact'].includes(element.type)) {
          throw new Error('Invalid element type. Must be action, state, or artefact')
        }
        
        if (!['pending', 'in-progress', 'completed', 'aborted'].includes(element.status)) {
          throw new Error('Invalid element status')
        }
      }
    }
  }
}