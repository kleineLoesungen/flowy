import type { FlowTemplate } from '../types/FlowTemplate'
import type { ElementTemplate } from '../types/ElementTemplate'
import type { Relation } from '../types/Relation'

export interface DurationRange {
  min: number
  max: number
}

/**
 * Calculate simple sum of all element durations
 */
export function calculateTotalDuration(template: FlowTemplate): number {
  return template.elements.reduce((total: number, element: ElementTemplate) => {
    return total + (element.durationDays || 0)
  }, 0)
}

/**
 * Calculate actual flow duration considering relation types
 * Returns a range with min/max durations based on OR relations
 */
export function calculateFlowDuration(template: FlowTemplate): DurationRange {
  if (!template.elements.length) return { min: 0, max: 0 }
  
  const totalDuration = calculateTotalDuration(template)
  if (!template.relations.length) return { min: totalDuration, max: totalDuration }

  const elementMap = new Map(template.elements.map((el: ElementTemplate) => [el.id, el]))
  const visitedMin = new Set<string>()
  const visitedMax = new Set<string>()

  // Find root elements (no incoming relations)
  const hasIncoming = new Set<string>()
  template.relations.forEach((rel: Relation) => {
    rel.toElementIds.forEach((toId: string) => hasIncoming.add(toId))
  })

  const rootElements = template.elements.filter((el: ElementTemplate) => !hasIncoming.has(el.id))
  
  // If no clear roots, return simple sum
  if (rootElements.length === 0) return { min: totalDuration, max: totalDuration }

  // Calculate minimum path duration
  const calculateMinPathDuration = (elementId: string): number => {
    if (visitedMin.has(elementId)) return elementMap.get(elementId)?.durationDays || 0
    visitedMin.add(elementId)

    const element = elementMap.get(elementId)
    if (!element) return 0

    const elementDuration = element.durationDays || 0
    
    const outgoingRelations = template.relations.filter((rel: Relation) => 
      rel.fromElementIds.includes(elementId)
    )

    if (outgoingRelations.length === 0) return elementDuration

    let minFollowingDuration = Infinity

    outgoingRelations.forEach((relation: Relation) => {
      let relationDuration = 0

      if (relation.type === 'flow') {
        // Sequential: add all target durations
        relationDuration = relation.toElementIds.reduce((sum: number, toId: string) => {
          return sum + calculateMinPathDuration(toId)
        }, 0)
      } else if (relation.type === 'or') {
        // Alternative: take minimum (best case)
        relationDuration = Math.min(
          ...relation.toElementIds.map((toId: string) => calculateMinPathDuration(toId)),
          Infinity
        )
        if (relationDuration === Infinity) relationDuration = 0
      } else if (relation.type === 'and') {
        // Parallel: take maximum (wait for longest)
        relationDuration = Math.max(
          ...relation.toElementIds.map((toId: string) => calculateMinPathDuration(toId)),
          0
        )
      }

      if (relationDuration < minFollowingDuration) {
        minFollowingDuration = relationDuration
      }
    })

    return elementDuration + (minFollowingDuration === Infinity ? 0 : minFollowingDuration)
  }

  // Calculate maximum path duration
  const calculateMaxPathDuration = (elementId: string): number => {
    if (visitedMax.has(elementId)) return elementMap.get(elementId)?.durationDays || 0
    visitedMax.add(elementId)

    const element = elementMap.get(elementId)
    if (!element) return 0

    const elementDuration = element.durationDays || 0
    
    const outgoingRelations = template.relations.filter((rel: Relation) => 
      rel.fromElementIds.includes(elementId)
    )

    if (outgoingRelations.length === 0) return elementDuration

    let maxFollowingDuration = 0

    outgoingRelations.forEach((relation: Relation) => {
      let relationDuration = 0

      if (relation.type === 'flow') {
        // Sequential: add all target durations
        relationDuration = relation.toElementIds.reduce((sum: number, toId: string) => {
          return sum + calculateMaxPathDuration(toId)
        }, 0)
      } else if (relation.type === 'or') {
        // Alternative: take maximum (worst case)
        relationDuration = Math.max(
          ...relation.toElementIds.map((toId: string) => calculateMaxPathDuration(toId)),
          0
        )
      } else if (relation.type === 'and') {
        // Parallel: take maximum (wait for longest)
        relationDuration = Math.max(
          ...relation.toElementIds.map((toId: string) => calculateMaxPathDuration(toId)),
          0
        )
      }

      maxFollowingDuration = Math.max(maxFollowingDuration, relationDuration)
    })

    return elementDuration + maxFollowingDuration
  }

  // Calculate min and max from all root elements
  const minDuration = Math.min(...rootElements.map((root: ElementTemplate) => calculateMinPathDuration(root.id)))
  const maxDuration = Math.max(...rootElements.map((root: ElementTemplate) => calculateMaxPathDuration(root.id)))

  return { min: minDuration, max: maxDuration }
}

/**
 * Format duration range for display
 */
export function formatDurationRange(range: DurationRange): string {
  return range.min === range.max 
    ? range.min.toString() 
    : `${range.min} - ${range.max}`
}

/**
 * Get appropriate label for duration range
 */
export function getDurationLabel(range: DurationRange): string {
  return (range.min === 1 && range.max === 1) ? 'day' : 'days'
}