import { describe, it, expect } from 'vitest'
import { normalizeRelations } from '../../server/utils/relationNormalizer'

describe('Relation Normalizer - Grouping Tests', () => {
  it('should group OR relations with same target', () => {
    const elements = [
      { id: "start", name: "Start", type: "state" },
      { id: "a1", name: "Action 1", type: "action" },
      { id: "a2", name: "Action 2", type: "action" },
      { id: "merge", name: "Merge", type: "action" }
    ]

    // Two separate OR relations that should be grouped
    const relations = [
      {
        id: "r1",
        type: "or" as const,
        connections: [{ fromElementId: "a1", toElementId: "merge" }]
      },
      {
        id: "r2",
        type: "or" as const,
        connections: [{ fromElementId: "a2", toElementId: "merge" }]
      }
    ]

    const normalized = normalizeRelations(relations, "start", elements)

    // Should be grouped into one OR relation
    expect(normalized.length).toBe(1)
    expect(normalized[0].type).toBe('or')
    expect(normalized[0].connections.length).toBe(2)
    
    // Both connections should be present
    const hasA1 = normalized[0].connections.some(c => c.fromElementId === "a1")
    const hasA2 = normalized[0].connections.some(c => c.fromElementId === "a2")
    expect(hasA1).toBe(true)
    expect(hasA2).toBe(true)
  })

  it('should group AND relations with same source', () => {
    const elements = [
      { id: "start", name: "Start", type: "state" },
      { id: "split", name: "Split", type: "action" },
      { id: "a1", name: "Action 1", type: "action" },
      { id: "a2", name: "Action 2", type: "action" }
    ]

    // Two separate AND relations that should be grouped
    const relations = [
      {
        id: "r1",
        type: "and" as const,
        connections: [{ fromElementId: "split", toElementId: "a1" }]
      },
      {
        id: "r2",
        type: "and" as const,
        connections: [{ fromElementId: "split", toElementId: "a2" }]
      }
    ]

    const normalized = normalizeRelations(relations, "start", elements)

    // Should be grouped into one AND relation
    expect(normalized.length).toBe(1)
    expect(normalized[0].type).toBe('and')
    expect(normalized[0].connections.length).toBe(2)
    
    // Both connections should be present
    const hasA1 = normalized[0].connections.some(c => c.toElementId === "a1")
    const hasA2 = normalized[0].connections.some(c => c.toElementId === "a2")
    expect(hasA1).toBe(true)
    expect(hasA2).toBe(true)
  })

  it('should not group relations of different types', () => {
    const elements = [
      { id: "start", name: "Start", type: "state" },
      { id: "a1", name: "Action 1", type: "action" },
      { id: "a2", name: "Action 2", type: "action" },
      { id: "merge", name: "Merge", type: "action" }
    ]

    const relations = [
      {
        id: "r1",
        type: "or" as const,
        connections: [{ fromElementId: "a1", toElementId: "merge" }]
      },
      {
        id: "r2",
        type: "and" as const,
        connections: [{ fromElementId: "a2", toElementId: "merge" }]
      }
    ]

    const normalized = normalizeRelations(relations, "start", elements)

    // Should remain as two separate relations
    expect(normalized.length).toBe(2)
  })

  it('should keep flow relations individual', () => {
    const elements = [
      { id: "start", name: "Start", type: "state" },
      { id: "a1", name: "Action 1", type: "action" },
      { id: "a2", name: "Action 2", type: "action" }
    ]

    const relations = [
      {
        id: "r1",
        type: "flow" as const,
        connections: [{ fromElementId: "start", toElementId: "a1" }]
      },
      {
        id: "r2",
        type: "flow" as const,
        connections: [{ fromElementId: "a1", toElementId: "a2" }]
      }
    ]

    const normalized = normalizeRelations(relations, "start", elements)

    // Should remain as two separate flow relations
    expect(normalized.length).toBe(2)
    expect(normalized[0].type).toBe('flow')
    expect(normalized[1].type).toBe('flow')
  })

  it('should handle empty relations array', () => {
    const elements = [{ id: "start", name: "Start", type: "state" }]
    const normalized = normalizeRelations([], "start", elements)
    expect(normalized).toEqual([])
  })

  it('should group multiple OR relations into one', () => {
    const elements = [
      { id: "a1", name: "Action 1", type: "action" },
      { id: "a2", name: "Action 2", type: "action" },
      { id: "a3", name: "Action 3", type: "action" },
      { id: "merge", name: "Merge", type: "action" }
    ]

    const relations = [
      {
        id: "r1",
        type: "or" as const,
        connections: [{ fromElementId: "a1", toElementId: "merge" }]
      },
      {
        id: "r2",
        type: "or" as const,
        connections: [{ fromElementId: "a2", toElementId: "merge" }]
      },
      {
        id: "r3",
        type: "or" as const,
        connections: [{ fromElementId: "a3", toElementId: "merge" }]
      }
    ]

    const normalized = normalizeRelations(relations, null, elements)

    // All three should be grouped into one
    expect(normalized.length).toBe(1)
    expect(normalized[0].connections.length).toBe(3)
  })
})
