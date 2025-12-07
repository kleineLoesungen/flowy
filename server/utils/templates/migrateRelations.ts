import type { Relation } from '../../../types_old/Relation'

// Legacy relation format (for migration purposes)
interface LegacyRelation {
  id: string
  fromElementIds: string[]
  toElementIds: string[]
  type: 'flow' | 'or' | 'and' | 'in' | 'out'
  connections?: Array<{
    fromElementId: string
    toElementId: string
    sourceHandle?: string
    targetHandle?: string
  }>
}

/**
 * Migrates legacy relations (with fromElementIds/toElementIds) to new format (connections only)
 * @param relations - Array of relations to migrate
 * @returns Array of migrated relations using only connections
 */
export function migrateLegacyRelations(relations: (LegacyRelation | Relation)[]): Relation[] {
  return relations.map(relation => {
    // If it's already in new format (has connections), return clean version
    if ('connections' in relation && relation.connections) {
      return {
        id: relation.id,
        type: relation.type,
        connections: relation.connections
      }
    }

    // If it's legacy format, convert it
    const legacyRelation = relation as LegacyRelation
    
    // If connections already exist, use them
    if (legacyRelation.connections && legacyRelation.connections.length > 0) {
      return {
        id: legacyRelation.id,
        type: legacyRelation.type,
        connections: legacyRelation.connections
      }
    }
    
    // Otherwise, create connections from fromElementIds and toElementIds
    const connections: Relation['connections'] = []
    
    if (legacyRelation.fromElementIds && legacyRelation.toElementIds) {
      legacyRelation.fromElementIds.forEach(fromId => {
        legacyRelation.toElementIds.forEach(toId => {
          connections.push({
            fromElementId: fromId,
            toElementId: toId,
            sourceHandle: 'bottom-source', // Default handle
            targetHandle: 'top-target'     // Default handle
          })
        })
      })
    }

    return {
      id: legacyRelation.id,
      type: legacyRelation.type,
      connections
    }
  })
}

/**
 * Converts new relations back to legacy format (for backward compatibility)
 * This is useful if frontend components still expect the old format
 * @param relations - Array of new format relations
 * @returns Array of relations in legacy format
 */
export function toLegacyRelations(relations: Relation[]): LegacyRelation[] {
  return relations.map(relation => {
    const fromElementIds: string[] = []
    const toElementIds: string[] = []

    // Extract unique fromElementIds and toElementIds from connections
    relation.connections.forEach(conn => {
      if (!fromElementIds.includes(conn.fromElementId)) {
        fromElementIds.push(conn.fromElementId)
      }
      if (!toElementIds.includes(conn.toElementId)) {
        toElementIds.push(conn.toElementId)
      }
    })

    return {
      id: relation.id,
      type: relation.type,
      fromElementIds,
      toElementIds,
      connections: relation.connections
    }
  })
}