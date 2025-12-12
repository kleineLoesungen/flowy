import type { FlowTemplate } from '../../../types/FlowTemplate'
import type { Relation } from '../../../types_old/Relation'

/**
 * Processes template relations by:
 * 1. Correcting direction based on starting element
 * 2. Properly grouping relations that should be combined
 * 3. Splitting corrupted relations that have mixed sources
 * 
 * @param template - The flow template to process
 * @returns The template with properly processed relations
 */
export function processTemplateRelations(template: FlowTemplate): FlowTemplate {
  if (!template.elements || !template.relations || !template.startingElementId) {
    return template
  }

  
  
  // Step 1: Correct direction based on starting element
  const directionCorrectedTemplate = correctRelationDirections(template)
  
  // Step 2: Detect and report circular dependencies
  const cycles = detectCycles(directionCorrectedTemplate)
  if (cycles.length > 0) {
    console.warn('⚠️  Circular dependencies detected in template:', cycles)
    console.warn('This may cause phantom connections and incorrect duration calculations')
  }
  
  // Step 3: Split corrupted relations (relations with mixed source elements)
  const splitTemplate = splitCorruptedRelations(directionCorrectedTemplate)
  
  // Step 4: Group relations that should be combined
  const groupedTemplate = groupRelations(splitTemplate)
  
  // Step 5: Final convergence node validation and correction
  const finalTemplate = enforceConvergenceNodeRules(groupedTemplate)
  
  
  
  return finalTemplate
}

/**
 * Corrects relation directions based on flow from starting element
 * Special handling for convergence nodes that should always be targets
 */
function correctRelationDirections(template: FlowTemplate): FlowTemplate {
  // Identify convergence nodes (nodes that multiple paths flow INTO)
  const convergenceNodes = identifyConvergenceNodes(template)
  
  // Build element distance map from starting element
  const elementDistances = new Map<string, number>()
  const visited = new Set<string>()
  
  // BFS from starting element
  const queue: { elementId: string, distance: number }[] = [
    { elementId: template.startingElementId!, distance: 0 }
  ]
  
  elementDistances.set(template.startingElementId!, 0)
  
  // Build bidirectional adjacency map from current relations
  const adjacencyMap = new Map<string, string[]>()
  template.elements.forEach(el => {
    adjacencyMap.set(el.id, [])
  })
  
  template.relations.forEach(relation => {
    relation.connections.forEach(connection => {
      const fromId = connection.fromElementId
      const toId = connection.toElementId
      
      adjacencyMap.get(fromId)?.push(toId)
      adjacencyMap.get(toId)?.push(fromId) // Bidirectional for distance calculation
    })
  })
  
  // Calculate distances
  while (queue.length > 0) {
    const { elementId, distance } = queue.shift()!
    
    if (visited.has(elementId)) continue
    visited.add(elementId)
    
    const neighbors = adjacencyMap.get(elementId) || []
    neighbors.forEach(neighborId => {
      const currentDistance = elementDistances.get(neighborId)
      const newDistance = distance + 1
      
      if (currentDistance === undefined || newDistance < currentDistance) {
        elementDistances.set(neighborId, newDistance)
        queue.push({ elementId: neighborId, distance: newDistance })
      }
    })
  }
  
  // Correct relation directions based on distances and convergence rules
  const correctedRelations: Relation[] = template.relations.map(relation => {
    const correctedConnections = relation.connections.map(connection => {
      const fromId = connection.fromElementId
      const toId = connection.toElementId
      
      // Rule 1: Convergence nodes must NEVER be sources
          if (convergenceNodes.has(fromId)) {
        return {
          fromElementId: toId,
          toElementId: fromId,
          sourceHandle: connection.targetHandle,
          targetHandle: connection.sourceHandle
        }
      }
      
      // Rule 2: Use distance-based correction for non-convergence cases
      const fromDistance = elementDistances.get(fromId)
      const toDistance = elementDistances.get(toId)
      
      if (fromDistance !== undefined && toDistance !== undefined) {
        if (fromDistance > toDistance) {
          // Wrong direction - swap
          return {
            fromElementId: toId,
            toElementId: fromId,
            sourceHandle: connection.targetHandle,
            targetHandle: connection.sourceHandle
          }
        }
      }
      
      return connection
    })
    
    return {
      ...relation,
      connections: correctedConnections
    }
  })
  
  return {
    ...template,
    relations: correctedRelations
  }
}

/**
 * Identifies convergence nodes - elements that have multiple incoming paths
 * These should always be target elements, never source elements
 */
function identifyConvergenceNodes(template: FlowTemplate): Set<string> {
  const convergenceNodes = new Set<string>()
  
  // Known convergence patterns - join/merge nodes by name
  template.elements.forEach(element => {
    const name = element.name.toLowerCase()
      if (name.includes('join') || name.includes('merge') || name.includes('converge')) {
      convergenceNodes.add(element.id)
    }
  })
  
  // Also identify by connection patterns
  const incomingCounts = new Map<string, Set<string>>()
  
  // Initialize
  template.elements.forEach(el => {
    incomingCounts.set(el.id, new Set())
  })
  
  // Count unique incoming sources for each element
  template.relations.forEach(relation => {
    relation.connections.forEach(connection => {
      const toId = connection.toElementId
      const fromId = connection.fromElementId
      const incomingSources = incomingCounts.get(toId) || new Set()
      incomingSources.add(fromId)
      incomingCounts.set(toId, incomingSources)
    })
  })
  
  // Identify elements with multiple incoming sources
  incomingCounts.forEach((sources, elementId) => {
      if (sources.size > 1) {
      convergenceNodes.add(elementId)
    }
  })
  
  return convergenceNodes
}

/**
 * Splits relations that have connections from multiple different source elements
 */
function splitCorruptedRelations(template: FlowTemplate): FlowTemplate {
  const splitRelations: Relation[] = []
  
  template.relations.forEach(relation => {
    if (!relation.connections || relation.connections.length === 0) {
      return
    }
    
    // Group connections by source element
    const connectionsBySource = new Map<string, typeof relation.connections>()
    
    relation.connections.forEach(connection => {
      const sourceId = connection.fromElementId
      if (!connectionsBySource.has(sourceId)) {
        connectionsBySource.set(sourceId, [])
      }
      connectionsBySource.get(sourceId)!.push(connection)
    })
    
    // If all connections have the same source, keep as is
    if (connectionsBySource.size === 1) {
      splitRelations.push(relation)
      return
    }
    
    // Split into separate relations by source
    
    connectionsBySource.forEach((connections, sourceId) => {
      splitRelations.push({
        id: generateId(),
        type: relation.type,
        connections: connections
      })
    })
  })
  
  return {
    ...template,
    relations: splitRelations
  }
}

/**
 * Groups relations that should be combined based on proper grouping rules:
 * - Same relation type
 * - All connections share the same source element OR all share the same target element
 */
function groupRelations(template: FlowTemplate): FlowTemplate {
  const groupedRelations: Relation[] = []
  const processedRelations = new Set<string>()
  
  template.relations.forEach(relation => {
    if (processedRelations.has(relation.id)) {
      return
    }
    
    // Find all other relations that can be grouped with this one
    const groupableRelations = template.relations.filter(otherRelation => {
      if (otherRelation.id === relation.id || processedRelations.has(otherRelation.id)) {
        return false
      }
      
      // Must have same type
      if (otherRelation.type !== relation.type) {
        return false
      }
      
      // Check if they can be grouped (same source elements OR same target elements)
      const relation1Sources = new Set(relation.connections.map(c => c.fromElementId))
      const relation1Targets = new Set(relation.connections.map(c => c.toElementId))
      const relation2Sources = new Set(otherRelation.connections.map(c => c.fromElementId))
      const relation2Targets = new Set(otherRelation.connections.map(c => c.toElementId))
      
      // Can group if they share all source elements
      const sameSourceElements = relation1Sources.size === relation2Sources.size && 
                                [...relation1Sources].every(s => relation2Sources.has(s))
      
      // Can group if they share all target elements  
      const sameTargetElements = relation1Targets.size === relation2Targets.size &&
                                [...relation1Targets].every(t => relation2Targets.has(t))
      
      return sameSourceElements || sameTargetElements
    })
    
    if (groupableRelations.length === 0) {
      // No groupable relations, keep as is
      groupedRelations.push(relation)
      processedRelations.add(relation.id)
    } else {
      // Group all compatible relations
      const allConnections = [...relation.connections]
      const relationsToGroup = [relation, ...groupableRelations]
      
      groupableRelations.forEach(groupableRelation => {
        allConnections.push(...groupableRelation.connections)
        processedRelations.add(groupableRelation.id)
      })
      
      // Create grouped relation
      groupedRelations.push({
        id: generateId(),
        type: relation.type,
        connections: allConnections
      })
      
      processedRelations.add(relation.id)
      
    }
  })
  
  return {
    ...template,
    relations: groupedRelations
  }
}

/**
 * Detects circular dependencies in the flow using DFS
 */
function detectCycles(template: FlowTemplate): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const adjacencyMap = new Map<string, string[]>()
  
  // Build adjacency map
  template.elements.forEach(el => {
    adjacencyMap.set(el.id, [])
  })
  
  template.relations.forEach(relation => {
    relation.connections.forEach(connection => {
      const fromId = connection.fromElementId
      const toId = connection.toElementId
      adjacencyMap.get(fromId)?.push(toId)
    })
  })
  
  // DFS to detect cycles
  function dfs(elementId: string, path: string[]): void {
    visited.add(elementId)
    recursionStack.add(elementId)
    path.push(elementId)
    
    const neighbors = adjacencyMap.get(elementId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path])
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor)
        const cycle = path.slice(cycleStart).concat([neighbor])
        cycles.push(cycle)
      }
    }
    
    recursionStack.delete(elementId)
  }
  
  // Check all elements for cycles
  template.elements.forEach(element => {
    if (!visited.has(element.id)) {
      dfs(element.id, [])
    }
  })
  
  return cycles
}

/**
 * Final enforcement of convergence node rules across all relations
 * This ensures convergence nodes are never used as sources, even after grouping/splitting
 */
function enforceConvergenceNodeRules(template: FlowTemplate): FlowTemplate {
  const convergenceNodes = identifyConvergenceNodes(template)
  
  
  const correctedRelations: Relation[] = template.relations.map(relation => {
    const correctedConnections = relation.connections.map(connection => {
      const fromId = connection.fromElementId
      const toId = connection.toElementId
      
      // If a convergence node is being used as source, reverse the connection
      if (convergenceNodes.has(fromId)) {
        
        return {
          fromElementId: toId,
          toElementId: fromId,
          sourceHandle: connection.targetHandle,
          targetHandle: connection.sourceHandle
        }
      }
      
      return connection
    })
    
    return {
      ...relation,
      connections: correctedConnections
    }
  })
  
  return {
    ...template,
    relations: correctedRelations
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}