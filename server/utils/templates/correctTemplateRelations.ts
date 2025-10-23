import type { FlowTemplate } from '../../../types/FlowTemplate'
import type { Relation } from '../../../types/Relation'

/**
 * Corrects the direction of connections in a template to ensure proper flow
 * from the starting element to end elements. Swaps connection directions
 * if necessary to maintain correct directional flow.
 * 
 * @param template - The flow template to correct
 * @returns The template with corrected connection directions
 */
export function correctTemplateRelations(template: FlowTemplate): FlowTemplate {
  if (!template.elements || !template.relations || !template.startingElementId) {
    return template
  }

  // Create a map to track the correct flow direction from starting element
  const elementDistances = new Map<string, number>()
  const visited = new Set<string>()
  
  // Start BFS from the starting element to determine correct flow direction
  const queue: { elementId: string, distance: number }[] = [
    { elementId: template.startingElementId, distance: 0 }
  ]
  
  elementDistances.set(template.startingElementId, 0)
  
  // Build a graph of current relations (both directions)
  const adjacencyMap = new Map<string, string[]>()
  
  // Initialize adjacency map
  template.elements.forEach(el => {
    adjacencyMap.set(el.id, [])
  })
  
  // Add connections from relations (considering both from->to and to->from)
  template.relations.forEach(relation => {
    relation.connections.forEach(connection => {
      const fromId = connection.fromElementId
      const toId = connection.toElementId
      
      if (!adjacencyMap.get(fromId)?.includes(toId)) {
        adjacencyMap.get(fromId)?.push(toId)
      }
      if (!adjacencyMap.get(toId)?.includes(fromId)) {
        adjacencyMap.get(toId)?.push(fromId)
      }
    })
  })

  // BFS to assign distances from starting element
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

  // Correct the relations based on computed distances
  const correctedRelations: Relation[] = template.relations.map(relation => {
    const correctedRelation: Relation = {
      ...relation,
      connections: []
    }

    // Correct each connection based on distance
    relation.connections.forEach(connection => {
      const fromDistance = elementDistances.get(connection.fromElementId)
      const toDistance = elementDistances.get(connection.toElementId)
      
      // If we have distance information for both elements
      if (fromDistance !== undefined && toDistance !== undefined) {
        if (fromDistance < toDistance) {
          // Correct direction: keep as is
          correctedRelation.connections.push(connection)
        } else if (fromDistance > toDistance) {
          // Incorrect direction: swap the connection
          correctedRelation.connections.push({
            fromElementId: connection.toElementId,
            toElementId: connection.fromElementId,
            sourceHandle: connection.targetHandle,
            targetHandle: connection.sourceHandle
          })
        } else {
          // Same distance - keep original direction (might be parallel elements)
          correctedRelation.connections.push(connection)
        }
      } else {
        // No distance information - keep original
        correctedRelation.connections.push(connection)
      }
    })

    return correctedRelation
  }).filter(relation => 
    // Only keep relations that have valid connections
    relation.connections.length > 0
  )

  const correctedCount = template.relations.reduce((count, relation, index) => {
    const originalConnections = relation.connections
    const correctedConnections = correctedRelations[index]?.connections || []
    
    // Count connections that were swapped
    let swappedConnections = 0
    originalConnections.forEach((original, connIndex) => {
      const corrected = correctedConnections[connIndex]
      if (corrected && original.fromElementId === corrected.toElementId && original.toElementId === corrected.fromElementId) {
        swappedConnections++
      }
    })
    
    return count + swappedConnections
  }, 0)

  if (correctedCount > 0) {
    console.log(`Template "${template.name}": Corrected ${correctedCount} connections with wrong direction`)
  }

  return {
    ...template,
    relations: correctedRelations
  }
}