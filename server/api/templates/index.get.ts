import type { FlowTemplate } from '../../db/schema'
import { useTemplateRepository, useFlowRepository } from "../../storage/StorageFactory"
import { calculateFlowDuration, formatDurationRange, getDurationLabel, type DurationRange } from '../../../utils/flowDurationCalculator'

/**
 * Optimized interface for template overview (list view)
 */
interface TemplateOverview {
  id: string
  name: string
  description?: string
  elementCount: number
  flowCount: number
  duration: {
    range: DurationRange
    display: string
    label: string
  }
}

/**
 * Response for templates list
 */
interface TemplatesListResponse {
  success: true
  data: TemplateOverview[]
}

/**
 * GET /api/templates
 * 
 * Get list of all flow templates with overview data
 */
export default defineEventHandler(async (event) => {
  const templateRepo = useTemplateRepository()
  const flowRepo = useFlowRepository()
  
  try {
    // Get all templates
    const templates = await templateRepo.findAll()
    
    const templateOverviews: TemplateOverview[] = []
    
    // Get flow counts efficiently
    const flowCounts = await flowRepo.countByTemplate()
    
    for (const template of templates) {
      // Calculate duration from full template (needs relations for proper calculation)
      const durationRange = calculateFlowDuration(template)
      
      const overview: TemplateOverview = {
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        elementCount: template.elements.length,
        flowCount: flowCounts.get(template.id) || 0,
        duration: {
          range: durationRange,
          display: formatDurationRange(durationRange),
          label: getDurationLabel(durationRange)
        }
      }
      
      templateOverviews.push(overview)
    }
    
    // Sort templates by name
    templateOverviews.sort((a, b) => a.name.localeCompare(b.name))
    
    return {
      success: true,
      data: templateOverviews
    }
  } catch (error: any) {
    console.error('Templates API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch templates',
      data: { message: error.message, stack: error.stack }
    })
  }
})