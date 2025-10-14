const { calculateFlowDuration, formatDurationRange } = require('./utils/flowDurationCalculator')

// Test with Flow 1 - Expected: 6 days
const flow1 = {
  "id": "mgikppiubnfwokzep7e",
  "name": "Abkündigung Server Komponente",
  "description": "Eine Komponente wird abgekündigt",
  "elements": [
    {"id": "mgikprvx3rvjjtt2rhl", "name": "Entscheidung getroffen", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgikps2giemjxsayvn", "name": "Bestand analysieren", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mglf1uvlm4plq6lgwt", "name": "Mailing klären", "description": "", "ownerId": "mgil7cfajan6glamkil", "durationDays": 3, "type": "action", "consultedUserIds": []},
    {"id": "mglf7cpa19d3bqiiogp", "name": "Mails versenden", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mglff831pp20l1jp0u8", "name": "Intern informieren", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgms5wnpuxyf2qben5q", "name": "Mail", "description": "", "ownerId": null, "durationDays": null, "type": "artefact", "consultedUserIds": []},
    {"id": "mgms7jpplzxmv2cw2oq", "name": "Mail gesendet", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "mgqmzpurm6d5taibfg", "fromElementIds": ["mgikprvx3rvjjtt2rhl"], "toElementIds": ["mgikps2giemjxsayvn"], "type": "flow"},
    {"id": "mgqmzpurku9iafib81o", "fromElementIds": ["mglff831pp20l1jp0u8"], "toElementIds": ["mglf7cpa19d3bqiiogp"], "type": "flow"},
    {"id": "mgqmzpur9eamcr5sj37", "fromElementIds": ["mgms7jpplzxmv2cw2oq"], "toElementIds": ["mglff831pp20l1jp0u8"], "type": "flow"},
    {"id": "mgqmzpur1fpiyggsyfv", "fromElementIds": ["mglf1uvlm4plq6lgwt"], "toElementIds": ["mgms7jpplzxmv2cw2oq", "mgikps2giemjxsayvn"], "type": "flow"}
  ],
  "startingElementId": "mgikprvx3rvjjtt2rhl"
}

console.log('=== FLOW 1 DEBUG ===')
console.log('Elements:')
flow1.elements.forEach(el => {
  console.log(`  ${el.id}: ${el.name} (${el.type}) - ${el.durationDays || 'no duration'} days`)
})

console.log('\nRelations:')
flow1.relations.forEach(rel => {
  console.log(`  ${rel.id}: ${rel.fromElementIds.join(', ')} → ${rel.toElementIds.join(', ')} (${rel.type})`)
})

console.log(`\nStarting element: ${flow1.startingElementId}`)

// Calculate result
const result = calculateFlowDuration(flow1)
console.log(`\nResult: ${formatDurationRange(result)} days`)
console.log(`Expected: 6 days`)

// Action elements only
const actionElements = flow1.elements.filter(el => el.type === 'action')
console.log('\nAction elements:')
actionElements.forEach(el => {
  console.log(`  ${el.name}: ${el.durationDays} days`)
})
console.log(`Total action duration: ${actionElements.reduce((sum, el) => sum + (el.durationDays || 0), 0)} days`)