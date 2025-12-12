import type { FlowTemplate } from '../../../types/FlowTemplate'
import type { Relation } from '../../../types_old/Relation'

/**
 * Fixes corrupted relations that contain connections from multiple different source elements.
 * Splits such relations into separate relations with single source elements each.
 * 
 * @param template - The flow template to fix
 * @returns The template with fixed relations
 */
export function fixCorruptedRelations(template: FlowTemplate): FlowTemplate {
  if (!template.relations) {
    return template
  }

  const fixedRelations: Relation[] = []

  template.relations.forEach(relation => {
    if (!relation.connections || relation.connections.length === 0) {
      // Skip empty relations
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

    // If all connections have the same source, keep the relation as is
    if (connectionsBySource.size === 1) {
      fixedRelations.push(relation)
      return
    }

    // If connections have different sources, split into separate relations
    
    connectionsBySource.forEach((connections, sourceId) => {
      const newRelation: Relation = {
        id: generateId(),
        type: relation.type,
        connections: connections
      }
      fixedRelations.push(newRelation)
    })
  })

  const originalCount = template.relations.length
  const fixedCount = fixedRelations.length
  
  if (fixedCount !== originalCount) {
    // relations were changed
  }

  return {
    ...template,
    relations: fixedRelations
  }
}

/**
 * Generate a unique ID for new relations
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}