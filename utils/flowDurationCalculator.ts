import type { FlowTemplate } from '../types/FlowTemplate'
import type { ElementTemplate } from '../types/ElementTemplate'
import type { Relation } from '../types/Relation'

export interface DurationRange {
  min: number
  max: number
}

/**
 * Calculate simple sum of all element durations
 * Excludes 'state' and 'artefact' element types
 */
export function calculateTotalDuration(template: FlowTemplate): number {
  return template.elements.reduce((total: number, element: ElementTemplate) => {
    // Only consider 'action' elements for duration calculation
    if (element.type === 'state' || element.type === 'artefact') {
      return total
    }
    return total + (element.durationDays || 0)
  }, 0)
}

/**
 * Calculate actual flow duration considering relation types
 * Returns a range with min/max durations based on OR relations
 * Excludes 'in'/'out' relation types and 'state'/'artefact' element types
 */
export function calculateFlowDuration(template: FlowTemplate): DurationRange {
  if (!template.elements.length) return { min: 0, max: 0 }
  
  const totalDuration = calculateTotalDuration(template)
  if (!template.relations.length) return { min: totalDuration, max: totalDuration }

  const elementMap = new Map(template.elements.map((el: ElementTemplate) => [el.id, el]))

  // Filter out 'in' and 'out' relations for duration calculation
  const relevantRelations = template.relations.filter((rel: Relation) => 
    rel.type !== 'in' && rel.type !== 'out'
  )

  // Build adjacency graph for topological processing
  const outgoing = new Map<string, Relation[]>()
  const incoming = new Map<string, string[]>()
  
  // Initialize maps
  template.elements.forEach(el => {
    outgoing.set(el.id, [])
    incoming.set(el.id, [])
  })
  
  // Build the graph
  relevantRelations.forEach(relation => {
    relation.fromElementIds.forEach(fromId => {
      if (!outgoing.has(fromId)) outgoing.set(fromId, [])
      outgoing.get(fromId)!.push(relation)
    })
    
    relation.toElementIds.forEach(toId => {
      if (!incoming.has(toId)) incoming.set(toId, [])
      relation.fromElementIds.forEach(fromId => {
        incoming.get(toId)!.push(fromId)
      })
    })
  })

  // Find starting elements - use startingElementIds if available, otherwise analyze flow structure
  let startElements: ElementTemplate[]
  
  if (template.startingElementIds && template.startingElementIds.length > 0) {
    // Use explicitly defined starting elements, but validate they make sense
    const candidateStartElements = template.startingElementIds
      .map(id => elementMap.get(id))
      .filter((el): el is ElementTemplate => el !== undefined)
    
    // Check if these starting elements actually have outgoing relations
    const hasValidOutgoing = candidateStartElements.some(el => {
      const outgoingRels = outgoing.get(el.id) || []
      return outgoingRels.length > 0
    })
    
    if (hasValidOutgoing) {
      startElements = candidateStartElements
    } else {
      // Fallback to flow structure analysis if starting elements have no outgoing relations
      startElements = []
    }
  } else {
    startElements = []
  }
  
  if (startElements.length === 0) {
    // Fallback: find elements with no incoming relations from relevant relations
    const elementsWithNoIncoming = template.elements.filter(el => {
      const incomingList = incoming.get(el.id) || []
      return incomingList.length === 0
    })
    
    // If there's only one element with no incoming relations, check if we can find a better flow structure
    if (elementsWithNoIncoming.length === 1) {
      const singleStart = elementsWithNoIncoming[0]
      if (singleStart) {
        // Check if this single start element flows to multiple alternatives (indicating alternative paths)
        const outgoingFromStart = outgoing.get(singleStart.id) || []
        const hasFlowToMultipleTargets = outgoingFromStart.some(rel => 
          rel.type === 'flow' && rel.toElementIds.length > 1
        )
        
        if (hasFlowToMultipleTargets) {
          // This looks like a flow with alternative paths, use the targets as start elements for calculation
          const flowRelation = outgoingFromStart.find(rel => rel.type === 'flow' && rel.toElementIds.length > 1)
          if (flowRelation) {
            startElements = flowRelation.toElementIds
              .map(id => elementMap.get(id))
              .filter((el): el is ElementTemplate => el !== undefined)
          } else {
            startElements = elementsWithNoIncoming
          }
        } else {
          startElements = elementsWithNoIncoming
        }
      } else {
        startElements = elementsWithNoIncoming
      }
    } else {
      startElements = elementsWithNoIncoming
    }
  }
  
  // If we still don't have start elements, use action elements (final fallback)
  if (startElements.length === 0) {
    startElements = template.elements.filter(el => el.type !== 'state' && el.type !== 'artefact')
  }

  if (startElements.length === 0) return { min: totalDuration, max: totalDuration }

  // Calculate duration by exploring all possible paths
  const calculateDuration = (isMax: boolean): number => {
    const memoization = new Map<string, number>()
    
    const calculatePathDuration = (elementId: string, visited: Set<string>): number => {
      if (visited.has(elementId)) return 0 // Avoid cycles
      
      const memoKey = elementId + (isMax ? '-max' : '-min')
      if (memoization.has(memoKey)) return memoization.get(memoKey)!
      
      const element = elementMap.get(elementId)
      if (!element) return 0
      
      const elementDuration = (element.type === 'state' || element.type === 'artefact') ? 0 : (element.durationDays || 0)
      const newVisited = new Set(visited)
      newVisited.add(elementId)
      
      const outgoingRelations = outgoing.get(elementId) || []
      
      if (outgoingRelations.length === 0) {
        memoization.set(memoKey, elementDuration)
        return elementDuration
      }
      
      let bestFollowingDuration = isMax ? 0 : Infinity
      
      outgoingRelations.forEach(relation => {
        let relationDuration = 0
        
        if (relation.type === 'and') {
          // Parallel execution - take maximum duration (wait for all to complete)
          relationDuration = Math.max(
            ...relation.toElementIds.map(toId => calculatePathDuration(toId, newVisited)),
            0
          )
        } else if (relation.type === 'or') {
          // Alternative paths - for min take shortest, for max take longest
          const pathDurations = relation.toElementIds.map(toId => calculatePathDuration(toId, newVisited))
          relationDuration = isMax 
            ? Math.max(...pathDurations, 0)
            : Math.min(...pathDurations, Infinity)
          if (relationDuration === Infinity) relationDuration = 0
        } else if (relation.type === 'flow') {
          // Sequential execution - if multiple targets, check if they lead to OR relations (alternative paths)
          const pathDurations = relation.toElementIds.map(toId => calculatePathDuration(toId, newVisited))
          
          // Check if this flow creates alternative paths by looking for OR relations from the targets
          const hasOrFromTargets = relation.toElementIds.some(targetId => {
            const targetOutgoing = outgoing.get(targetId) || []
            return targetOutgoing.some(rel => rel.type === 'or')
          })
          
          if (hasOrFromTargets && relation.toElementIds.length > 1) {
            // This is a flow that creates alternative paths - treat as alternatives for min/max calculation
            relationDuration = isMax 
              ? Math.max(...pathDurations, 0)
              : Math.min(...pathDurations, Infinity)
            if (relationDuration === Infinity) relationDuration = 0
          } else {
            // Regular sequential flow - parallel execution (wait for all)
            relationDuration = Math.max(...pathDurations, 0)
          }
        }
        
        // Update best duration based on whether we want min or max
        if (isMax) {
          bestFollowingDuration = Math.max(bestFollowingDuration, relationDuration)
        } else {
          bestFollowingDuration = Math.min(bestFollowingDuration, relationDuration)
        }
      })
      
      const result = elementDuration + (bestFollowingDuration === Infinity ? 0 : bestFollowingDuration)
      memoization.set(memoKey, result)
      return result
    }
    
    // Calculate from all starting elements and take the appropriate min/max
    const startDurations = startElements.map(el => calculatePathDuration(el.id, new Set()))
    
    return isMax 
      ? Math.max(...startDurations, 0)
      : Math.min(...startDurations, Infinity) === Infinity ? 0 : Math.min(...startDurations, Infinity)
  }

  const minDuration = calculateDuration(false)
  const maxDuration = calculateDuration(true)

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