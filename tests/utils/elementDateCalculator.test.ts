import { describe, it, expect } from 'vitest'
import { calculateElementDates } from '../../utils/elementDateCalculator'
import type { FlowTemplate } from '../../types/FlowTemplate'

describe('Element Date Calculator', () => {
  it('should correctly calculate element dates for template jwi9akdg9mkefbg87', () => {
    // This is the template structure from jwi9akdg9mkefbg87
    // Flow fchh8b9bumkejpac7 is known to have correct calculations
    const template: FlowTemplate = {
      id: 'jwi9akdg9mkefbg87',
      name: 'Test Template',
      description: null,
      startingElementId: 'mkefbiwz8z6zpfa7otl',
      elements: [
        {
          id: 'mkefbiwz8z6zpfa7otl',
          name: 'Action .1',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 3
        },
        {
          id: 'mkefbqcnbwrtxqc8bxp',
          name: 'Action .2',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 1
        },
        {
          id: 'mkefc7vkvqz1co8iok8',
          name: 'State .1',
          description: '',
          type: 'state',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: null
        },
        {
          id: 'mkefmzehgt1c7u2ekxq',
          name: 'Action .2.1',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 1
        },
        {
          id: 'mkefn5wgkd4flcu2gha',
          name: 'Action .2.2',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 2
        },
        {
          id: 'mkefq2w7iujb538kw4',
          name: 'Action .3',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 1
        },
        {
          id: 'mkefohvzrd1wvejxo4',
          name: 'Action .2.1',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 1
        },
        {
          id: 'mkefomy2anitkj3nbu5',
          name: 'Action .2.2',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 3
        },
        {
          id: 'mkefcizzco1k258v8vo',
          name: 'Action .4',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 1
        }
      ],
      relations: [
        {
          id: 'mkefquqt26nkhiilwpi',
          type: 'flow',
          connections: [
            {
              toElementId: 'mkefbqcnbwrtxqc8bxp',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-source',
              fromElementId: 'mkefbiwz8z6zpfa7otl'
            }
          ]
        },
        {
          id: 'mkefquqtdteus68wkj8',
          type: 'flow',
          connections: [
            {
              toElementId: 'mkefc7vkvqz1co8iok8',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-target',
              fromElementId: 'mkefbqcnbwrtxqc8bxp'
            }
          ]
        },
        {
          id: 'mkefquqtfltd830bbi7',
          type: 'and',
          connections: [
            {
              toElementId: 'mkefmzehgt1c7u2ekxq',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-source',
              fromElementId: 'mkefc7vkvqz1co8iok8'
            },
            {
              toElementId: 'mkefn5wgkd4flcu2gha',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-source',
              fromElementId: 'mkefc7vkvqz1co8iok8'
            }
          ]
        },
        {
          id: 'mkefquqtyma5a81neo',
          type: 'flow',
          connections: [
            {
              toElementId: 'mkefq2w7iujb538kw4',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-source',
              fromElementId: 'mkefmzehgt1c7u2ekxq'
            }
          ]
        },
        {
          id: 'mkefquqtxz6znj9lm2n',
          type: 'or',
          connections: [
            {
              toElementId: 'mkefohvzrd1wvejxo4',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-source',
              fromElementId: 'mkefn5wgkd4flcu2gha'
            },
            {
              toElementId: 'mkefomy2anitkj3nbu5',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-target',
              fromElementId: 'mkefn5wgkd4flcu2gha'
            }
          ]
        },
        {
          id: 'mkefquqt9rb2jjrmuwk',
          type: 'flow',
          connections: [
            {
              toElementId: 'mkefcizzco1k258v8vo',
              sourceHandle: 'bottom-target',
              targetHandle: 'top-source',
              fromElementId: 'mkefq2w7iujb538kw4'
            }
          ]
        },
        {
          id: 'mkefquqtndlyx331jg',
          type: 'flow',
          connections: [
            {
              toElementId: 'mkefomy2anitkj3nbu5',
              sourceHandle: 'top-source',
              targetHandle: 'bottom-target',
              fromElementId: 'mkefq2w7iujb538kw4'
            }
          ]
        },
        {
          id: 'mkefquqtr6883lju7q',
          type: 'flow',
          connections: [
            {
              toElementId: 'mkefohvzrd1wvejxo4',
              sourceHandle: 'top-source',
              targetHandle: 'bottom-target',
              fromElementId: 'mkefq2w7iujb538kw4'
            }
          ]
        }
      ],
      layout: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Start date from flow fchh8b9bumkejpac7
    const startDate = new Date('2026-01-27')
    
    // Calculate element dates
    const elementDates = calculateElementDates(template, startDate)
    
    // Expected dates based on correct flow fchh8b9bumkejpac7
    // Start date: 2026-01-27 (Tuesday)
    // Action .1 (mkefbiwz8z6zpfa7otl): starts 2026-01-27, duration 3 days -> ends 2026-01-30
    const action1Date = elementDates.get('mkefbiwz8z6zpfa7otl')
    expect(action1Date).toBeDefined()
    expect(action1Date?.toISOString().split('T')[0]).toBe('2026-01-30')
    
    // Action .2 (mkefbqcnbwrtxqc8bxp): starts after Action .1 (2026-01-30), duration 1 day -> ends 2026-02-02
    const action2Date = elementDates.get('mkefbqcnbwrtxqc8bxp')
    expect(action2Date).toBeDefined()
    expect(action2Date?.toISOString().split('T')[0]).toBe('2026-02-02')
    
    // State .1 (mkefc7vkvqz1co8iok8): starts after Action .2, duration 0 -> ends 2026-02-02
    const state1Date = elementDates.get('mkefc7vkvqz1co8iok8')
    expect(state1Date).toBeDefined()
    expect(state1Date?.toISOString().split('T')[0]).toBe('2026-02-02')
    
    // Action .2.1 (mkefmzehgt1c7u2ekxq): starts after State .1 (2026-02-02), duration 1 day -> ends 2026-02-03
    const action21Date = elementDates.get('mkefmzehgt1c7u2ekxq')
    expect(action21Date).toBeDefined()
    expect(action21Date?.toISOString().split('T')[0]).toBe('2026-02-03')
    
    // Action .2.2 (mkefn5wgkd4flcu2gha): starts after State .1 (2026-02-02), duration 2 days -> ends 2026-02-04
    const action22Date = elementDates.get('mkefn5wgkd4flcu2gha')
    expect(action22Date).toBeDefined()
    expect(action22Date?.toISOString().split('T')[0]).toBe('2026-02-04')
    
    // Action .2.1 (mkefohvzrd1wvejxo4): starts after Action .2.2 (2026-02-04), duration 1 day -> ends 2026-02-05
    const action21bDate = elementDates.get('mkefohvzrd1wvejxo4')
    expect(action21bDate).toBeDefined()
    expect(action21bDate?.toISOString().split('T')[0]).toBe('2026-02-05')
    
    // Action .2.2 (mkefomy2anitkj3nbu5): starts after Action .2.2 (2026-02-04), duration 3 days -> ends 2026-02-09
    const action22bDate = elementDates.get('mkefomy2anitkj3nbu5')
    expect(action22bDate).toBeDefined()
    expect(action22bDate?.toISOString().split('T')[0]).toBe('2026-02-09')
    
    // Action .3 (mkefq2w7iujb538kw4): has 3 predecessors
    // - mkefmzehgt1c7u2ekxq: 2026-02-03
    // - mkefomy2anitkj3nbu5: 2026-02-09
    // - mkefohvzrd1wvejxo4: 2026-02-05
    // Should wait for latest (2026-02-09), duration 1 day -> ends 2026-02-10
    const action3Date = elementDates.get('mkefq2w7iujb538kw4')
    expect(action3Date).toBeDefined()
    expect(action3Date?.toISOString().split('T')[0]).toBe('2026-02-10')
    
    // Action .4 (mkefcizzco1k258v8vo): starts after Action .3 (2026-02-10), duration 1 day -> ends 2026-02-11
    const action4Date = elementDates.get('mkefcizzco1k258v8vo')
    expect(action4Date).toBeDefined()
    expect(action4Date?.toISOString().split('T')[0]).toBe('2026-02-11')
  })

  it('should handle upward arrows correctly', () => {
    const template: FlowTemplate = {
      id: 'test-upward',
      name: 'Test Upward Arrows',
      description: null,
      startingElementId: 'elem1',
      elements: [
        {
          id: 'elem1',
          name: 'Element 1',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 2
        },
        {
          id: 'elem2',
          name: 'Element 2',
          description: '',
          type: 'action',
          ownerTeamId: null,
          consultedTeamIds: [],
          durationDays: 3
        }
      ],
      relations: [
        {
          id: 'rel1',
          type: 'flow',
          connections: [
            {
              // This is an upward arrow - visual goes from elem1 (bottom) to elem2 (top)
              // But logically, elem2 must complete before elem1 can start
              toElementId: 'elem2',
              sourceHandle: 'top-source',
              targetHandle: 'bottom-target',
              fromElementId: 'elem1'
            }
          ]
        }
      ],
      layout: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const startDate = new Date('2026-01-27')
    const elementDates = calculateElementDates(template, startDate)
    
    // With the upward arrow, elem2 becomes the predecessor of elem1
    // elem1 is the starting element, but the upward arrow makes elem2 a predecessor
    // So elem2 starts first: Jan 27 (Tue) + 3 workdays = Fri Jan 30
    const elem2Date = elementDates.get('elem2')
    expect(elem2Date).toBeDefined()
    expect(elem2Date?.toISOString().split('T')[0]).toBe('2026-01-30')
    
    // elem1 waits for elem2 (Jan 30), then adds its own duration 2
    // Jan 30 (Fri) + 2 workdays = Tue Feb 3
    const elem1Date = elementDates.get('elem1')
    expect(elem1Date).toBeDefined()
    expect(elem1Date?.toISOString().split('T')[0]).toBe('2026-02-03')
  })
})
