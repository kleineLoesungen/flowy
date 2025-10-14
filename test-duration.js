// Test script for flow duration calculator
import { calculateFlowDuration, formatDurationRange } from './utils/flowDurationCalculator.js'

// Test data from the provided flow templates
const flow1 = {
  "id": "mgikppiubnfwokzep7e",
  "name": "Abkündigung Server Komponente", 
  "elements": [
    {"id": "mgikprvx3rvjjtt2rhl", "name": "Entscheidung getroffen", "durationDays": null, "type": "state"},
    {"id": "mgikps2giemjxsayvn", "name": "Bestand analysieren", "durationDays": 1, "type": "action"},
    {"id": "mglf1uvlm4plq6lgwt", "name": "Mailing klären", "durationDays": 3, "type": "action"},
    {"id": "mglf7cpa19d3bqiiogp", "name": "Mails versenden", "durationDays": 1, "type": "action"},
    {"id": "mglff831pp20l1jp0u8", "name": "Intern informieren", "durationDays": 1, "type": "action"},
    {"id": "mgms5wnpuxyf2qben5q", "name": "Mail", "durationDays": null, "type": "artefact"},
    {"id": "mgms7jpplzxmv2cw2oq", "name": "Mail gesendet", "durationDays": null, "type": "state"}
  ],
  "relations": [
    {"fromElementIds": ["mgikprvx3rvjjtt2rhl"], "toElementIds": ["mgikps2giemjxsayvn"], "type": "flow"},
    {"fromElementIds": ["mglff831pp20l1jp0u8"], "toElementIds": ["mglf7cpa19d3bqiiogp"], "type": "flow"},
    {"fromElementIds": ["mgms7jpplzxmv2cw2oq"], "toElementIds": ["mglff831pp20l1jp0u8"], "type": "flow"},
    {"fromElementIds": ["mglf1uvlm4plq6lgwt"], "toElementIds": ["mgms7jpplzxmv2cw2oq", "mgikps2giemjxsayvn"], "type": "flow"},
    {"fromElementIds": ["mgms5wnpuxyf2qben5q"], "toElementIds": ["mglff831pp20l1jp0u8"], "type": "in"},
    {"fromElementIds": ["mgms5wnpuxyf2qben5q"], "toElementIds": ["mglf1uvlm4plq6lgwt"], "type": "out"}
  ],
  "startingElementId": "mgikprvx3rvjjtt2rhl"
}

const flow2 = {
  "id": "mglfjrzw8xvw5868o5j",
  "elements": [
    {"id": "mgmumj8m6zw4yc8kmw8", "name": "Start", "durationDays": null, "type": "state"},
    {"id": "mgmumtglmqhgtz8qoqe", "name": "Long Action", "durationDays": 5, "type": "action"},
    {"id": "mgmun7osw1amalhryvh", "name": "Medium Action", "durationDays": 3, "type": "action"},
    {"id": "mgmunifzci580donjk4", "name": "Short Action", "durationDays": 1, "type": "action"},
    {"id": "mgmuns02ul9w1hxwye", "name": "End", "durationDays": null, "type": "state"}
  ],
  "relations": [
    {"fromElementIds": ["mgmumtglmqhgtz8qoqe"], "toElementIds": ["mgmumj8m6zw4yc8kmw8"], "type": "or"},
    {"fromElementIds": ["mgmun7osw1amalhryvh"], "toElementIds": ["mgmumj8m6zw4yc8kmw8"], "type": "or"},
    {"fromElementIds": ["mgmunifzci580donjk4"], "toElementIds": ["mgmumj8m6zw4yc8kmw8"], "type": "or"},
    {"fromElementIds": ["mgmuns02ul9w1hxwye"], "toElementIds": ["mgmumtglmqhgtz8qoqe", "mgmun7osw1amalhryvh", "mgmunifzci580donjk4"], "type": "flow"}
  ],
  "startingElementId": "mgmumj8m6zw4yc8kmw8"
}

// Test the calculations
console.log("Testing Flow Duration Calculator")
console.log("================================")

console.log("\nFlow 1 (Expected: 6 days):")
const result1 = calculateFlowDuration(flow1)
console.log(`Result: ${formatDurationRange(result1)} days`)
console.log(`Expected: 6 days`)
console.log(`Match: ${result1.min === 6 && result1.max === 6 ? '✓' : '✗'}`)

console.log("\nFlow 2 (Expected: 5 days):")
const result2 = calculateFlowDuration(flow2)
console.log(`Result: ${formatDurationRange(result2)} days`)
console.log(`Expected: 5 days`)
console.log(`Match: ${result2.min === 5 && result2.max === 5 ? '✓' : '✗'}`)