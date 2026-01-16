/**
 * Normalize relations by grouping connections
 * Direction correction is now handled manually by users in the UI
 * 
 * Grouping Logic:
 * - Relations with same toElementId, targetHandle, and type should be grouped
 * - Relations with same fromElementId, sourceHandle, and type should be grouped
 */

interface Connection {
  fromElementId: string
  toElementId: string
  sourceHandle?: string
  targetHandle?: string
}

interface Relation {
  id: string
  type: 'flow' | 'or' | 'and' | 'in' | 'out'
  connections: Connection[]
}

/**
 * Main function to normalize relations - only groups, no direction correction
 */
export function normalizeRelations(
  relations: Relation[], 
  startingElementId: string | null,
  elements: Array<{ id: string, type: string, name?: string }>
): Relation[] {
  if (!relations || relations.length === 0) return []

  // Only group relations, no direction correction
  return groupRelations(relations)
}

/**
 * Group relations that share same source or target
 */
function groupRelations(relations: Relation[]): Relation[] {
  const groupedRelations: Relation[] = []
  const processedRelations = new Set<string>()

  relations.forEach(relation => {
    if (processedRelations.has(relation.id)) return

    // For OR/AND relations, look for groupable relations
    if (relation.type === 'or' || relation.type === 'and') {
      const relatedRelations = findGroupableRelations(relation, relations, processedRelations)
      
      if (relatedRelations.length > 0) {
        // Combine all connections into one relation
        const allConnections: Connection[] = [
          ...relation.connections,
          ...relatedRelations.flatMap(r => r.connections)
        ]

        groupedRelations.push({
          id: relation.id, // Keep the first relation's ID
          type: relation.type,
          connections: allConnections
        })

        // Mark all related relations as processed
        processedRelations.add(relation.id)
        relatedRelations.forEach(r => processedRelations.add(r.id))
      } else {
        // No grouping possible, keep as-is
        groupedRelations.push(relation)
        processedRelations.add(relation.id)
      }
    } else {
      // Flow, in, out relations - keep individual
      groupedRelations.push(relation)
      processedRelations.add(relation.id)
    }
  })

  return groupedRelations
}

/**
 * Find relations that can be grouped with the given relation
 */
function findGroupableRelations(
  targetRelation: Relation,
  allRelations: Relation[],
  processedRelations: Set<string>
): Relation[] {
  const groupable: Relation[] = []

  // Get the first connection as reference for grouping criteria
  const refConnection = targetRelation.connections[0]
  if (!refConnection) return groupable

  allRelations.forEach(relation => {
    if (relation.id === targetRelation.id || processedRelations.has(relation.id)) return
    if (relation.type !== targetRelation.type) return

    // Check if this relation can be grouped
    const canGroup = relation.connections.some((conn: Connection) => {
      // Group by same target (convergent pattern): multiple sources → same target
      const sameTarget = conn.toElementId === refConnection.toElementId &&
                        conn.targetHandle === refConnection.targetHandle

      // Group by same source (divergent pattern): same source → multiple targets  
      const sameSource = conn.fromElementId === refConnection.fromElementId &&
                        conn.sourceHandle === refConnection.sourceHandle

      return sameTarget || sameSource
    })

    if (canGroup) {
      groupable.push(relation)
    }
  })

  return groupable
}
