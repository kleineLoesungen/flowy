import type { FlowTemplate } from '../types/FlowTemplate'
import type { ElementTemplate } from '../types/ElementTemplate'
import type { Relation } from '../types_old/Relation'

export interface DurationRange {
  min: number
  max: number
}

/**
 * Calculate simple sum of all element durations
 * Excludes 'state' and 'artefact' element types
 */
export function calculateTotalDuration(template: FlowTemplate): number {
  if (!template.elements || !template.elements.length) return 0
  
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
 * 
 * Algorithm: Build adjacency graph and calculate critical path with proper handling of AND/OR relations
 */
export function calculateFlowDuration(template: FlowTemplate): DurationRange {
  if (!template.elements || !template.elements.length) return { min: 0, max: 0 }

  // Get all action elements with durations
  const allActionElements = template.elements.filter(el => el.type === 'action' && el.durationDays)
  
  if (allActionElements.length === 0) {
    return { min: 0, max: 0 }
  }

  // Only consider flow, and, or relations (exclude in/out)
  const validRelations = (template.relations || []).filter((rel: Relation) => 
    rel.type === 'flow' || rel.type === 'and' || rel.type === 'or'
  )

  // Build element duration map
  const durationMap = new Map<string, number>()
  template.elements.forEach((el: ElementTemplate) => {
    if (el.type === 'action' && el.durationDays) {
      durationMap.set(el.id, el.durationDays)
    } else {
      durationMap.set(el.id, 0) // state and artefact have 0 duration
    }
  })

  // Build adjacency maps for graph traversal
  const outgoing = new Map<string, Array<{ toId: string, relationType: string }>>()
  const incoming = new Map<string, Array<{ fromId: string, relationType: string }>>()
  
  template.elements.forEach((el: ElementTemplate) => {
    outgoing.set(el.id, [])
    incoming.set(el.id, [])
  })

  // Populate adjacency maps
  validRelations.forEach((rel: Relation) => {
    rel.connections.forEach((conn: any) => {
      const fromId = conn.fromElementId
      const toId = conn.toElementId
      
      outgoing.get(fromId)?.push({ toId, relationType: rel.type })
      incoming.get(toId)?.push({ fromId, relationType: rel.type })
    })
  })

  // Find starting element (or elements with no incoming edges)
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

  if (startElements.length === 0) {
    // No clear starting point, use simple sum
    const totalActionDuration = allActionElements.reduce((sum: number, el: ElementTemplate) => sum + (el.durationDays || 0), 0)
    return { min: totalActionDuration, max: totalActionDuration }
  }

  // Calculate min and max durations to each node using dynamic programming
  const minDuration = new Map<string, number>()
  const maxDuration = new Map<string, number>()
  const visited = new Set<string>()

  // Initialize all nodes
  template.elements.forEach((el: ElementTemplate) => {
    minDuration.set(el.id, 0)
    maxDuration.set(el.id, 0)
  })

  // Topological sort with BFS to handle parallel paths
  const calculateDurations = (elementId: string, visitStack: Set<string> = new Set()): void => {
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
      // Starting node
      minDuration.set(elementId, currentDuration)
      maxDuration.set(elementId, currentDuration)
    } else {
      // Calculate based on incoming edges
      const incomingDurations: { min: number, max: number, type: string }[] = []
      
      for (const edge of incomingEdges) {
        calculateDurations(edge.fromId, new Set(visitStack))
        const fromMin = minDuration.get(edge.fromId) || 0
        const fromMax = maxDuration.get(edge.fromId) || 0
        incomingDurations.push({ min: fromMin, max: fromMax, type: edge.relationType })
      }
      
      // Group by relation type
      const flowEdges = incomingDurations.filter(d => d.type === 'flow')
      const andEdges = incomingDurations.filter(d => d.type === 'and')
      const orEdges = incomingDurations.filter(d => d.type === 'or')
      
      let minToHere = 0
      let maxToHere = 0
      
      if (andEdges.length > 0) {
        // AND: wait for all parallel paths (max of all)
        minToHere = Math.max(...andEdges.map(d => d.min))
        maxToHere = Math.max(...andEdges.map(d => d.max))
      } else if (orEdges.length > 0) {
        // OR: choice between paths (min to max range)
        minToHere = Math.min(...orEdges.map(d => d.min))
        maxToHere = Math.max(...orEdges.map(d => d.max))
      } else if (flowEdges.length > 0) {
        // FLOW: sequential (should be single predecessor typically)
        minToHere = Math.max(...flowEdges.map(d => d.min))
        maxToHere = Math.max(...flowEdges.map(d => d.max))
      } else if (incomingDurations.length > 0) {
        // Mixed or default: use max (conservative)
        minToHere = Math.max(...incomingDurations.map(d => d.min))
        maxToHere = Math.max(...incomingDurations.map(d => d.max))
      }
      
      minDuration.set(elementId, minToHere + currentDuration)
      maxDuration.set(elementId, maxToHere + currentDuration)
    }
    
    visited.add(elementId)
    visitStack.delete(elementId)
    
    // Process outgoing edges
    const outgoingEdges = outgoing.get(elementId) || []
    outgoingEdges.forEach(edge => {
      calculateDurations(edge.toId, new Set(visitStack))
    })
  }

  // Start calculation from all starting elements
  startElements.forEach(startId => {
    calculateDurations(startId)
  })

  // Find the maximum duration among all end nodes (nodes with no outgoing edges)
  let finalMin = 0
  let finalMax = 0
  
  template.elements.forEach((el: ElementTemplate) => {
    const outgoingEdges = outgoing.get(el.id) || []
    if (outgoingEdges.length === 0) {
      // This is an end node
      const nodeMin = minDuration.get(el.id) || 0
      const nodeMax = maxDuration.get(el.id) || 0
      finalMin = Math.max(finalMin, nodeMin)
      finalMax = Math.max(finalMax, nodeMax)
    }
  })

  // If no end nodes found, use max of all nodes
  if (finalMin === 0 && finalMax === 0) {
    template.elements.forEach((el: ElementTemplate) => {
      const nodeMin = minDuration.get(el.id) || 0
      const nodeMax = maxDuration.get(el.id) || 0
      finalMin = Math.max(finalMin, nodeMin)
      finalMax = Math.max(finalMax, nodeMax)
    })
  }

  return { min: finalMin, max: finalMax }
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