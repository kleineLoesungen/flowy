import { describe, it, expect } from 'vitest'
import { calculateFlowDuration, calculateTotalDuration } from '../../utils/flowDurationCalculator'

describe('Flow Duration Calculator - Safety Tests', () => {
  it('should handle templates without elements gracefully', () => {
    const incompleteTemplate = {
      id: 'test-template',
      name: 'Test Template',
      // Missing elements array
    } as any

    const result = calculateFlowDuration(incompleteTemplate)
    expect(result).toEqual({ min: 0, max: 0 })

    const totalResult = calculateTotalDuration(incompleteTemplate)
    expect(totalResult).toBe(0)
  })

  it('should handle templates with null elements', () => {
    const templateWithNullElements = {
      id: 'test-template',
      name: 'Test Template',
      elements: null
    } as any

    const result = calculateFlowDuration(templateWithNullElements)
    expect(result).toEqual({ min: 0, max: 0 })

    const totalResult = calculateTotalDuration(templateWithNullElements)
    expect(totalResult).toBe(0)
  })

  it('should handle templates with empty elements array', () => {
    const templateWithEmptyElements = {
      id: 'test-template',
      name: 'Test Template',
      elements: [],
      relations: []
    }

    const result = calculateFlowDuration(templateWithEmptyElements)
    expect(result).toEqual({ min: 0, max: 0 })

    const totalResult = calculateTotalDuration(templateWithEmptyElements)
    expect(totalResult).toBe(0)
  })

  it('should handle templates without relations gracefully', () => {
    const templateWithoutRelations = {
      id: 'test-template',
      name: 'Test Template',
      elements: [
        {
          id: 'element1',
          type: 'action',
          durationDays: 3
        }
      ]
      // Missing relations array
    } as any

    const result = calculateFlowDuration(templateWithoutRelations)
    expect(result).toEqual({ min: 3, max: 3 })

    const totalResult = calculateTotalDuration(templateWithoutRelations)
    expect(totalResult).toBe(3)
  })

  it('should handle valid template with elements and relations', () => {
    const validTemplate = {
      id: 'test-template',
      name: 'Test Template',
      elements: [
        {
          id: 'element1',
          type: 'action',
          durationDays: 2
        },
        {
          id: 'element2',
          type: 'action',
          durationDays: 3
        }
      ],
      relations: [
        {
          id: 'rel1',
          type: 'flow',
          connections: [
            {
              fromElementId: 'element1',
              toElementId: 'element2'
            }
          ]
        }
      ]
    }

    const result = calculateFlowDuration(validTemplate)
    expect(result.min).toBeGreaterThan(0)
    expect(result.max).toBeGreaterThan(0)

    const totalResult = calculateTotalDuration(validTemplate)
    expect(totalResult).toBe(5) // 2 + 3
  })
})