import type { Relation } from '../../types/Relation'

/**
 * Composable for working with relations in the new connections-only format
 * Provides helper functions to extract element IDs and work with connections
 */
export const useRelations = () => {
  
  /**
   * Extract unique fromElementIds from a relation's connections
   * @param relation - The relation to extract from
   * @returns Array of unique from element IDs
   */
  const getFromElementIds = (relation: Relation): string[] => {
    const fromIds = new Set<string>()
    relation.connections.forEach((conn) => {
      fromIds.add(conn.fromElementId)
    })
    return Array.from(fromIds)
  }

  /**
   * Extract unique toElementIds from a relation's connections
   * @param relation - The relation to extract from
   * @returns Array of unique to element IDs
   */
  const getToElementIds = (relation: Relation): string[] => {
    const toIds = new Set<string>()
    relation.connections.forEach(conn => {
      toIds.add(conn.toElementId)
    })
    return Array.from(toIds)
  }

  /**
   * Get all unique element IDs involved in a relation
   * @param relation - The relation to extract from
   * @returns Array of all unique element IDs
   */
  const getAllElementIds = (relation: Relation): string[] => {
    const allIds = new Set<string>()
    relation.connections.forEach(conn => {
      allIds.add(conn.fromElementId)
      allIds.add(conn.toElementId)
    })
    return Array.from(allIds)
  }

  /**
   * Check if an element is a source (from) element in any connection
   * @param relation - The relation to check
   * @param elementId - The element ID to check for
   * @returns True if element is a source in any connection
   */
  const isFromElement = (relation: Relation, elementId: string): boolean => {
    return relation.connections.some(conn => conn.fromElementId === elementId)
  }

  /**
   * Check if an element is a target (to) element in any connection
   * @param relation - The relation to check
   * @param elementId - The element ID to check for
   * @returns True if element is a target in any connection
   */
  const isToElement = (relation: Relation, elementId: string): boolean => {
    return relation.connections.some(conn => conn.toElementId === elementId)
  }

  /**
   * Get all target elements for a given source element
   * @param relation - The relation to search
   * @param fromElementId - The source element ID
   * @returns Array of target element IDs
   */
  const getTargetsForElement = (relation: Relation, fromElementId: string): string[] => {
    return relation.connections
      .filter(conn => conn.fromElementId === fromElementId)
      .map(conn => conn.toElementId)
  }

  /**
   * Get all source elements for a given target element
   * @param relation - The relation to search
   * @param toElementId - The target element ID
   * @returns Array of source element IDs
   */
  const getSourcesForElement = (relation: Relation, toElementId: string): string[] => {
    return relation.connections
      .filter(conn => conn.toElementId === toElementId)
      .map(conn => conn.fromElementId)
  }

  /**
   * Create a relation group key for grouping relations
   * Useful for maintaining compatibility with existing grouping logic
   * @param relation - The relation to create a key for
   * @returns A string key for grouping
   */
  const getRelationGroupKey = (relation: Relation): string => {
    const fromIds = getFromElementIds(relation).sort().join('-')
    const toIds = getToElementIds(relation).sort().join('-')
    return `${relation.type}-${fromIds}-${toIds}`
  }

  /**
   * Iterate over all connection pairs in a relation
   * Useful for replacing nested fromElementIds/toElementIds loops
   * @param relation - The relation to iterate
   * @param callback - Function called for each connection pair
   */
  const forEachConnection = (
    relation: Relation, 
    callback: (fromId: string, toId: string, connection: Relation['connections'][0]) => void
  ): void => {
    relation.connections.forEach(conn => {
      callback(conn.fromElementId, conn.toElementId, conn)
    })
  }

  return {
    getFromElementIds,
    getToElementIds,
    getAllElementIds,
    isFromElement,
    isToElement,
    getTargetsForElement,
    getSourcesForElement,
    getRelationGroupKey,
    forEachConnection
  }
}