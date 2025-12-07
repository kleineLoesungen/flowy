/**
 * Normalize relations by grouping connections and correcting flow direction
 * 
 * Grouping Logic:
 * - Relations with same toElementId, targetHandle, and type should be grouped
 * - Relations with same fromElementId, sourceHandle, and type should be grouped
 * 
 * Direction Logic:
 * - Flow should follow from starting element towards end elements
 * - "from" should be closer to start, "to" should be further from start
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
 * Main function to normalize relations
 */
export function normalizeRelations(
  relations: Relation[], 
  startingElementId: string | null,
  elements: Array<{ id: string, type: string, name?: string }>
): Relation[] {
  if (!relations || relations.length === 0) return []

  console.log('🔧 Normalizing relations:', {
    relationCount: relations.length,
    startingElement: startingElementId,
    elementTypes: elements.map(e => ({ id: e.id, type: e.type, name: e.name }))
  })

  console.log('📥 Input relations:', relations.map(r => ({
    id: r.id,
    type: r.type,
    connections: r.connections.map(c => `${c.fromElementId} → ${c.toElementId}`)
  })))

  // Step 1: Group relations first (before direction correction)
  const groupedRelations = groupRelations(relations)
  console.log('📦 After grouping:', groupedRelations.length, 'relations')
  console.log('📦 Grouped relations:', groupedRelations.map(r => ({
    id: r.id,
    type: r.type,
    connections: r.connections.map(c => `${c.fromElementId} → ${c.toElementId}`)
  })))

  // Step 2: Correct flow direction with enhanced context
  const correctedRelations = correctFlowDirection(groupedRelations, startingElementId, elements)
  console.log('🔄 After direction correction')
  console.log('🔄 Corrected relations:', correctedRelations.map(r => ({
    id: r.id,
    type: r.type,
    connections: r.connections.map(c => `${c.fromElementId} → ${c.toElementId}`)
  })))

  // Step 3: Sort relations by flow order
  const sortedRelations = sortRelationsByFlow(correctedRelations, startingElementId)
  console.log('📊 After sorting:', sortedRelations.length, 'relations')

  return sortedRelations
}

/**
 * Correct the direction of relations to follow logical flow
 */
function correctFlowDirection(
  relations: Relation[],
  startingElementId: string | null,
  elements: Array<{ id: string, type: string }>
): Relation[] {
  if (!startingElementId) {
    console.log('⚠️ No starting element provided, skipping direction correction')
    return relations
  }

  // Create element lookup map
  const elementMap = new Map(elements.map(el => [el.id, el]))

  // Build simple distance map from starting element
  const distances = calculateDistancesFromStart(relations, startingElementId)
  console.log('📏 Element distances from start:', Object.fromEntries(distances))

  return relations.map(relation => {
    console.log(`🔍 Processing relation ${relation.id} (${relation.type})`)
    
    return {
      ...relation,
      connections: relation.connections.map((conn: Connection) => {
        const fromDistance = distances.get(conn.fromElementId) ?? Infinity
        const toDistance = distances.get(conn.toElementId) ?? Infinity

        console.log(`  🔗 ${conn.fromElementId}(dist:${fromDistance}) → ${conn.toElementId}(dist:${toDistance})`)

        // If "to" element is closer to start than "from" element, swap direction
        if (toDistance < fromDistance && toDistance !== Infinity && fromDistance !== Infinity) {
          console.log(`  🔄 SWAPPING: ${conn.toElementId} → ${conn.fromElementId}`)
          return {
            fromElementId: conn.toElementId,
            toElementId: conn.fromElementId,
            sourceHandle: conn.targetHandle,
            targetHandle: conn.sourceHandle
          }
        }

        console.log(`  ✅ KEEPING: ${conn.fromElementId} → ${conn.toElementId}`)
        return conn
      })
    }
  })
}

/**
 * Calculate distances from starting element using BFS
 */
function calculateDistancesFromStart(relations: Relation[], startingElementId: string): Map<string, number> {
  const distances = new Map<string, number>()
  const queue: Array<{ elementId: string, distance: number }> = [{ elementId: startingElementId, distance: 0 }]
  const visited = new Set<string>()

  distances.set(startingElementId, 0)
  console.log(`📍 Starting BIDIRECTIONAL distance calculation from: ${startingElementId}`)

  while (queue.length > 0) {
    const { elementId, distance } = queue.shift()!
    
    if (visited.has(elementId)) continue
    visited.add(elementId)

    console.log(`  � Element ${elementId} at distance ${distance}`)

    // Find all relations where this element is connected (BOTH directions)
    relations.forEach(relation => {
      relation.connections.forEach(conn => {
        // Check BOTH directions to build complete connectivity
        let nextElement: string | null = null
        let direction = ''
        
        if (conn.fromElementId === elementId && !distances.has(conn.toElementId)) {
          nextElement = conn.toElementId
          direction = 'forward'
        } else if (conn.toElementId === elementId && !distances.has(conn.fromElementId)) {
          nextElement = conn.fromElementId
          direction = 'backward'
        }
        
        if (nextElement) {
          distances.set(nextElement, distance + 1)
          queue.push({ elementId: nextElement, distance: distance + 1 })
          console.log(`    🔗 Connected to ${nextElement} at distance ${distance + 1} (${direction})`)
        }
      })
    })
  }

  console.log(`📊 Final distances:`, Object.fromEntries(distances))
  return distances
}

/**
 * Build element hierarchy with enhanced logic using element types and names
 */
function buildElementHierarchy(
  relations: Relation[], 
  startingElementId: string, 
  elementMap: Map<string, { id: string, type: string }>
): Map<string, number> {
  const hierarchy = new Map<string, number>()
  
  // Start with the starting element at level 0
  hierarchy.set(startingElementId, 0)
  console.log('🚀 Starting hierarchy build from:', startingElementId)

  // Use multiple passes to build hierarchy correctly
  let changed = true
  let maxIterations = 10
  let iteration = 0

  while (changed && iteration < maxIterations) {
    changed = false
    iteration++
    console.log(`� Hierarchy iteration ${iteration}`)

    relations.forEach(relation => {
      relation.connections.forEach(conn => {
        const fromLevel = hierarchy.get(conn.fromElementId)
        const toLevel = hierarchy.get(conn.toElementId)

        // If fromElement has a level but toElement doesn't, assign toElement level + 1
        if (fromLevel !== undefined && toLevel === undefined) {
          hierarchy.set(conn.toElementId, fromLevel + 1)
          console.log(`➡️ Set ${conn.toElementId} to level ${fromLevel + 1} (from ${conn.fromElementId})`)
          changed = true
        }
        // If toElement has a level but fromElement doesn't, this might indicate reversed flow
        else if (toLevel !== undefined && fromLevel === undefined) {
          // Only assign if this makes semantic sense
          const fromElement = elementMap.get(conn.fromElementId)
          const toElement = elementMap.get(conn.toElementId)
          
          if (!shouldElementComeAfter(fromElement, toElement)) {
            hierarchy.set(conn.fromElementId, toLevel - 1)
            console.log(`⬅️ Set ${conn.fromElementId} to level ${toLevel - 1} (before ${conn.toElementId})`)
            changed = true
          }
        }
        // If both have levels, check if they need adjustment
        else if (fromLevel !== undefined && toLevel !== undefined) {
          if (fromLevel >= toLevel) {
            // This indicates the direction might be wrong, but let's be cautious
            console.log(`⚠️ Potential direction issue: ${conn.fromElementId}(${fromLevel}) → ${conn.toElementId}(${toLevel})`)
          }
        }
      })
    })
  }

  console.log('🏗️ Final element hierarchy:', Object.fromEntries(hierarchy))
  return hierarchy
}

/**
 * Determine if an element should come after another in the flow sequence
 */
function shouldElementComeAfter(
  element1: { id: string, type: string } | undefined,
  element2: { id: string, type: string } | undefined
): boolean {
  if (!element1 || !element2) return false

  // States typically come at the beginning or end of flows
  if (element1.type === 'state' && element2.type === 'action') return false  // state comes before action
  if (element1.type === 'action' && element2.type === 'state') return true   // action comes before state (end state)

  // Artefacts are typically outputs/results - come after actions
  if (element1.type === 'action' && element2.type === 'artefact') return false  // action comes before artefact
  if (element1.type === 'artefact' && element2.type === 'action') return true   // artefact comes before action (rare, but possible as input)

  // For actions, use name-based hierarchy analysis
  if (element1.type === 'action' && element2.type === 'action') {
    return analyzeActionHierarchy(element1, element2)
  }

  return false
}

/**
 * Analyze action hierarchy based on naming patterns and structure
 */
function analyzeActionHierarchy(
  element1: { id: string, type: string },
  element2: { id: string, type: string }
): boolean {
  // Extract element names/IDs for comparison
  const id1 = element1.id
  const id2 = element2.id

  // Simple heuristic: if one element ID contains the other as a prefix, 
  // the longer ID (more specific) typically comes after
  if (id2.startsWith(id1)) return false  // element1 (parent) comes before element2 (child)
  if (id1.startsWith(id2)) return true   // element2 (parent) comes before element1 (child)

  // Look for numerical patterns (Act 1 vs Act 2, Act 1.1 vs Act 1.2, etc.)
  const num1 = extractNumber(id1)
  const num2 = extractNumber(id2)
  
  if (num1 !== null && num2 !== null) {
    return num1 > num2  // higher numbers typically come after lower numbers
  }

  // Default: maintain current order
  return false
}

/**
 * Extract numerical suffix or embedded numbers for comparison
 */
function extractNumber(elementId: string): number | null {
  // Look for patterns like "Act 1", "Act 2.1", etc.
  const matches = elementId.match(/(\d+(?:\.\d+)?)/)
  return matches ? parseFloat(matches[1]) : null
}

/**
 * Group relations that should be combined
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

/**
 * Sort relations to follow flow order from starting element
 */
function sortRelationsByFlow(relations: Relation[], startingElementId: string | null): Relation[] {
  if (!startingElementId) return relations

  const sorted: Relation[] = []
  const processedElements = new Set<string>([startingElementId])
  const remaining = [...relations]

  // Process relations level by level
  while (remaining.length > 0) {
    const currentLevel: Relation[] = []

    // Find relations where source elements are already processed
    for (let i = remaining.length - 1; i >= 0; i--) {
      const relation = remaining[i]
      const hasProcessedSource = relation.connections.some((conn: Connection) =>
        processedElements.has(conn.fromElementId)
      )

      if (hasProcessedSource) {
        currentLevel.push(relation)
        remaining.splice(i, 1)

        // Add target elements to processed set
        relation.connections.forEach((conn: Connection) => {
          processedElements.add(conn.toElementId)
        })
      }
    }

    if (currentLevel.length === 0 && remaining.length > 0) {
      // Handle orphaned relations
      currentLevel.push(remaining.shift()!)
    }

    sorted.push(...currentLevel)
  }

  return sorted
}