import type { FlowTemplate, NewFlowTemplate } from '../../db/schema'
import { BaseRepository } from './BaseRepository'
import type { IStorage } from '../interfaces/IStorage'

export class TemplateRepository extends BaseRepository<FlowTemplate> {
  constructor(storage: IStorage) {
    super(storage, 'templates')
  }

  /**
   * Find template by name
   */
  async findByName(name: string): Promise<FlowTemplate | null> {
    return this.findOneWhere({ name })
  }

  /**
   * Search templates by name
   */
  async searchByName(nameQuery: string): Promise<FlowTemplate[]> {
    const allTemplates = await this.findAll()
    return allTemplates.filter(template => 
      template.name.toLowerCase().includes(nameQuery.toLowerCase())
    )
  }

  /**
   * Get templates with basic overview data (without full elements for performance)
   */
  async findAllOverview(): Promise<Array<{
    id: string
    name: string
    description: string
    elementCount: number
    createdAt: string | Date
    updatedAt: string | Date
  }>> {
    const templates = await this.findAll()
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      elementCount: template.elements.length,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }))
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total: number
    withElements: number
    withoutElements: number
    avgElementCount: number
    maxElementCount: number
  }> {
    const templates = await this.findAll()
    const elementCounts = templates.map(t => t.elements.length)
    
    return {
      total: templates.length,
      withElements: templates.filter(t => t.elements.length > 0).length,
      withoutElements: templates.filter(t => t.elements.length === 0).length,
      avgElementCount: elementCounts.length > 0 
        ? Math.round(elementCounts.reduce((a, b) => a + b, 0) / elementCounts.length * 10) / 10
        : 0,
      maxElementCount: elementCounts.length > 0 ? Math.max(...elementCounts) : 0
    }
  }

  /**
   * Find templates by element count range
   */
  async findByElementCount(min: number, max?: number): Promise<FlowTemplate[]> {
    const templates = await this.findAll()
    return templates.filter(template => {
      const count = template.elements.length
      return count >= min && (max === undefined || count <= max)
    })
  }

  /**
   * Clone template with new name
   */
  async cloneTemplate(templateId: string, newName: string): Promise<FlowTemplate> {
    const originalTemplate = await this.findById(templateId)
    if (!originalTemplate) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    // Check if new name already exists
    const existingTemplate = await this.findByName(newName)
    if (existingTemplate) {
      throw new Error(`Template with name "${newName}" already exists`)
    }

    // Create clone with new IDs for elements and relations
    const clonedData = {
      name: newName,
      description: `Copy of ${originalTemplate.description}`,
      elements: originalTemplate.elements.map(element => ({
        ...element,
        id: this.generateElementId()
      })),
      relations: originalTemplate.relations.map(relation => ({
        ...relation,
        id: this.generateRelationId()
      })),
      startingElementId: originalTemplate.startingElementId,
      layout: originalTemplate.layout
    }

    return this.create(clonedData)
  }

  /**
   * Add element to template
   */
  async addElement(
    templateId: string, 
    element: Omit<FlowTemplate['elements'][0], 'id'>
  ): Promise<FlowTemplate> {
    const template = await this.findById(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    const newElement = {
      ...element,
      id: this.generateElementId()
    }

    const updatedElements = [...template.elements, newElement]
    return this.update(templateId, { elements: updatedElements })
  }

  /**
   * Update element in template
   */
  async updateElement(
    templateId: string, 
    elementId: string, 
    elementData: Partial<FlowTemplate['elements'][0]>
  ): Promise<FlowTemplate> {
    const template = await this.findById(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    const elementIndex = template.elements.findIndex(el => el.id === elementId)
    if (elementIndex === -1) {
      throw new Error(`Element with id ${elementId} not found in template`)
    }

    const updatedElements = [...template.elements]
    updatedElements[elementIndex] = {
      ...updatedElements[elementIndex],
      ...elementData,
      id: elementId // Preserve original ID
    }

    return this.update(templateId, { elements: updatedElements })
  }

  /**
   * Remove element from template
   */
  async removeElement(templateId: string, elementId: string): Promise<FlowTemplate> {
    const template = await this.findById(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    const updatedElements = template.elements.filter(el => el.id !== elementId)
    
    // Remove relations that reference this element
    const updatedRelations = template.relations.filter(relation =>
      !relation.connections.some(conn => 
        conn.fromElementId === elementId || conn.toElementId === elementId
      )
    )

    return this.update(templateId, { 
      elements: updatedElements,
      relations: updatedRelations,
      startingElementId: template.startingElementId === elementId 
        ? (updatedElements[0]?.id || '') 
        : template.startingElementId
    })
  }

  /**
   * Add relation to template
   */
  async addRelation(
    templateId: string,
    relation: Omit<FlowTemplate['relations'][0], 'id'>
  ): Promise<FlowTemplate> {
    const template = await this.findById(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    // Validate that referenced elements exist
    const elementIds = template.elements.map(el => el.id)
    for (const conn of relation.connections) {
      if (!elementIds.includes(conn.fromElementId) || !elementIds.includes(conn.toElementId)) {
        throw new Error('Relation references non-existent elements')
      }
    }

    const newRelation = {
      ...relation,
      id: this.generateRelationId()
    }

    const updatedRelations = [...template.relations, newRelation]
    return this.update(templateId, { relations: updatedRelations })
  }

  /**
   * Remove relation from template
   */
  async removeRelation(templateId: string, relationId: string): Promise<FlowTemplate> {
    const template = await this.findById(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    const updatedRelations = template.relations.filter(rel => rel.id !== relationId)
    return this.update(templateId, { relations: updatedRelations })
  }

  /**
   * Set template starting element
   */
  async setStartingElement(templateId: string, elementId: string): Promise<FlowTemplate> {
    const template = await this.findById(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    const elementExists = template.elements.some(el => el.id === elementId)
    if (!elementExists) {
      throw new Error(`Element with id ${elementId} not found in template`)
    }

    return this.update(templateId, { startingElementId: elementId })
  }

  /**
   * Validate template structure
   */
  async validateTemplate(templateId: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const template = await this.findById(templateId)
    if (!template) {
      return { isValid: false, errors: ['Template not found'], warnings: [] }
    }

    const errors: string[] = []
    const warnings: string[] = []

    // Check if template has elements
    if (template.elements.length === 0) {
      errors.push('Template has no elements')
    }

    // Check for duplicate element IDs
    const elementIds = template.elements.map(el => el.id)
    const duplicateIds = elementIds.filter((id, index) => elementIds.indexOf(id) !== index)
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate element IDs: ${duplicateIds.join(', ')}`)
    }

    // Check starting element
    if (template.startingElementId && !elementIds.includes(template.startingElementId)) {
      errors.push('Starting element ID does not exist in template')
    }

    // Check relation references
    for (const relation of template.relations) {
      for (const conn of relation.connections) {
        if (!elementIds.includes(conn.fromElementId)) {
          errors.push(`Relation references non-existent fromElement: ${conn.fromElementId}`)
        }
        if (!elementIds.includes(conn.toElementId)) {
          errors.push(`Relation references non-existent toElement: ${conn.toElementId}`)
        }
      }
    }

    // Warnings for best practices
    if (!template.startingElementId && template.elements.length > 0) {
      warnings.push('No starting element defined')
    }

    if (template.elements.some(el => !el.name || el.name.trim() === '')) {
      warnings.push('Some elements have empty names')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Create template with validation
   */
  async create(data: Omit<FlowTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<FlowTemplate> {
    await this.validateData(data)
    return super.create(data)
  }

  /**
   * Update template with validation
   */
  async update(id: string, data: Partial<FlowTemplate>): Promise<FlowTemplate> {
    await this.validateData(data)
    return super.update(id, data)
  }

  /**
   * Validate template data
   */
  protected async validateData(data: Partial<FlowTemplate>): Promise<void> {
    if (data.name) {
      if (data.name.trim().length < 2) {
        throw new Error('Template name must be at least 2 characters long')
      }

      // Check for duplicate name
      const existingTemplate = await this.findByName(data.name.trim())
      if (existingTemplate && (!('id' in data) || existingTemplate.id !== (data as any).id)) {
        throw new Error('Template name already exists')
      }
    }

    if (data.elements) {
      // Validate element structure
      for (const element of data.elements) {
        if (!element.id || !element.name || !element.type) {
          throw new Error('Invalid element: id, name, and type are required')
        }
        
        if (!['action', 'state', 'artefact'].includes(element.type)) {
          throw new Error('Invalid element type')
        }
      }

      // Check for duplicate element IDs
      const elementIds = data.elements.map(el => el.id)
      const duplicates = elementIds.filter((id, index) => elementIds.indexOf(id) !== index)
      if (duplicates.length > 0) {
        throw new Error(`Duplicate element IDs: ${duplicates.join(', ')}`)
      }
    }
  }

  /**
   * Generate unique element ID
   */
  private generateElementId(): string {
    return 'element_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Generate unique relation ID  
   */
  private generateRelationId(): string {
    return 'relation_' + Math.random().toString(36).substr(2, 9)
  }
}