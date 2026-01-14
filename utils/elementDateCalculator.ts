import type { FlowTemplate } from '../types/FlowTemplate'
import type { ElementTemplate } from '../types/ElementTemplate'
import type { Relation } from '../types_old/Relation'
import { addWorkdays } from './workdayCalculator'

/**
 * Calculate expected end dates for each element based on flow start date and predecessors
 * Returns a map of element ID to expected end date
 */
export function calculateElementDates(
  template: FlowTemplate,
  flowStartDate: Date
): Map<string, Date> {
  const elementDates = new Map<string, Date>()
  
  if (!template.elements || template.elements.length === 0) {
    return elementDates
  }

  // Build element duration map
  const durationMap = new Map<string, number>()
  template.elements.forEach((el: ElementTemplate) => {
    if (el.type === 'action' && el.durationDays) {
      durationMap.set(el.id, el.durationDays)
    } else {
      durationMap.set(el.id, 0) // state and artefact have 0 duration
    }
  })

  // Only consider flow, and, or relations (exclude in/out)
  const validRelations = (template.relations || []).filter((rel: Relation) => 
    rel.type === 'flow' || rel.type === 'and' || rel.type === 'or'
  )

  // Build incoming edges map (predecessors)
  const incoming = new Map<string, Array<{ fromId: string, relationType: string }>>()
  
  template.elements.forEach((el: ElementTemplate) => {
    incoming.set(el.id, [])
  })

  validRelations.forEach((rel: Relation) => {
    rel.connections.forEach((conn: any) => {
      let fromId = conn.fromElementId
      let toId = conn.toElementId
      
      // When the visual arrow points upward (top-source to bottom-target),
      // the FLOW direction is opposite: the element at the top must complete
      // before the element at the bottom can start
      const isUpwardArrow = conn.sourceHandle?.includes('top') && conn.targetHandle?.includes('bottom')
      
      if (isUpwardArrow) {
        // Reverse the flow direction for upward arrows
        fromId = conn.toElementId
        toId = conn.fromElementId
      }
      
      if (fromId && toId) {
        incoming.get(toId)?.push({ fromId, relationType: rel.type })
      }
    })
  })

  // Find starting elements
  let startElements: string[] = []
  if (template.startingElementId) {
    startElements = [template.startingElementId]
  } else {
    // Find elements with no incoming edges
    template.elements.forEach((el: ElementTemplate) => {
      if ((incoming.get(el.id)?.length || 0) === 0) {
        startElements.push(el.id)
      }
    })
  }

  const visited = new Set<string>()

  // Calculate dates using topological sort
  const calculateDate = (elementId: string, visitStack: Set<string> = new Set()): void => {
    if (visited.has(elementId)) return
    
    // Cycle detection
    if (visitStack.has(elementId)) {
      visited.add(elementId)
      return
    }
    
    visitStack.add(elementId)
    
    const incomingEdges = incoming.get(elementId) || []
    const currentDuration = durationMap.get(elementId) || 0
    
    if (incomingEdges.length === 0) {
      // Starting element - starts on flow start date
      const endDate = addWorkdays(new Date(flowStartDate), currentDuration)
      elementDates.set(elementId, endDate)
    } else {
      // First, ensure ALL predecessors are calculated
      for (const edge of incomingEdges) {
        if (!visited.has(edge.fromId)) {
          calculateDate(edge.fromId, visitStack)
        }
      }
      
      // Now collect all predecessor end dates
      const predecessorEndDates: Date[] = []
      
      for (const edge of incomingEdges) {
        const fromEndDate = elementDates.get(edge.fromId)
        if (fromEndDate) {
          predecessorEndDates.push(fromEndDate)
        }
      }
      
      if (predecessorEndDates.length > 0) {
        // When an element has multiple predecessors, wait for ALL of them to complete
        // Take the LATEST (maximum) end date among all predecessors
        const latestPredecessorDate = new Date(Math.max(...predecessorEndDates.map(d => d.getTime())))
        
        // This element starts after the latest predecessor ends
        // We add the element's duration to calculate when THIS element will end
        const endDate = addWorkdays(latestPredecessorDate, currentDuration)
        elementDates.set(elementId, endDate)
      } else {
        // Fallback if no predecessor dates calculated
        const endDate = addWorkdays(new Date(flowStartDate), currentDuration)
        elementDates.set(elementId, endDate)
      }
    }
    
    visited.add(elementId)
    visitStack.delete(elementId)
  }

  // Calculate dates for all elements starting from start elements
  // This will recursively calculate all reachable elements
  startElements.forEach(startId => {
    calculateDate(startId)
  })

  // Calculate dates for any remaining unvisited elements (disconnected components)
  template.elements.forEach((el: ElementTemplate) => {
    if (!visited.has(el.id)) {
      calculateDate(el.id)
    }
  })

  return elementDates
}
