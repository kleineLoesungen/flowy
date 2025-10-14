// Test page for flow duration calculator
<template>
  <div class="test-page">
    <h1>Flow Duration Calculator Test</h1>
    
    <div class="test-results">
      <div v-for="test in testResults" :key="test.id" class="test-case">
        <h3>{{ test.name }}</h3>
        <p><strong>Expected:</strong> {{ test.expected }}</p>
        <p><strong>Actual:</strong> {{ test.actual }}</p>
        <p><strong>Status:</strong> 
          <span :class="test.match ? 'success' : 'error'">
            {{ test.match ? '✓ PASS' : '✗ FAIL' }}
          </span>
        </p>
        <details>
          <summary>Flow Details</summary>
          <pre>{{ JSON.stringify(test.flow, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calculateFlowDuration, formatDurationRange } from '../../utils/flowDurationCalculator'
import type { FlowTemplate } from '../../types/FlowTemplate'

// Test data
// Corrected Flow 1: Based on expected 6 days = 1+3+1+1 
const flow1: FlowTemplate = {
  "id": "mgikppiubnfwokzep7e",
  "name": "Abkündigung Server Komponente",
  "description": "Test flow 1", 
  "elements": [
    {"id": "mgikprvx3rvjjtt2rhl", "name": "Entscheidung getroffen", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgikps2giemjxsayvn", "name": "Bestand analysieren", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mglf1uvlm4plq6lgwt", "name": "Mailing klären", "description": "", "ownerId": null, "durationDays": 3, "type": "action", "consultedUserIds": []},
    {"id": "mglf7cpa19d3bqiiogp", "name": "Mails versenden", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mglff831pp20l1jp0u8", "name": "Intern informieren", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgms5wnpuxyf2qben5q", "name": "Mail", "description": "", "ownerId": null, "durationDays": null, "type": "artefact", "consultedUserIds": []},
    {"id": "mgms7jpplzxmv2cw2oq", "name": "Mail gesendet", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "1", "fromElementIds": ["mgikprvx3rvjjtt2rhl"], "toElementIds": ["mgikps2giemjxsayvn"], "type": "flow"},
    {"id": "2", "fromElementIds": ["mgikps2giemjxsayvn"], "toElementIds": ["mglf1uvlm4plq6lgwt"], "type": "flow"},
    {"id": "3", "fromElementIds": ["mglf1uvlm4plq6lgwt"], "toElementIds": ["mgms7jpplzxmv2cw2oq"], "type": "flow"},
    {"id": "4", "fromElementIds": ["mgms7jpplzxmv2cw2oq"], "toElementIds": ["mglff831pp20l1jp0u8"], "type": "flow"},
    {"id": "5", "fromElementIds": ["mglff831pp20l1jp0u8"], "toElementIds": ["mglf7cpa19d3bqiiogp"], "type": "flow"}
  ],
  "startingElementId": "mgikprvx3rvjjtt2rhl"
}

// Corrected Flow 2: Start → pick one action (OR), expected result: 5 days (longest path)
const flow2: FlowTemplate = {
  "id": "mglfjrzw8xvw5868o5j",
  "name": "Test Flow 2", 
  "description": "Test flow 2",
  "elements": [
    {"id": "mgmumj8m6zw4yc8kmw8", "name": "Start", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgmumtglmqhgtz8qoqe", "name": "Long Action", "description": "", "ownerId": null, "durationDays": 5, "type": "action", "consultedUserIds": []},
    {"id": "mgmun7osw1amalhryvh", "name": "Medium Action", "description": "", "ownerId": null, "durationDays": 3, "type": "action", "consultedUserIds": []},
    {"id": "mgmunifzci580donjk4", "name": "Short Action", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgmuns02ul9w1hxwye", "name": "End", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "1", "fromElementIds": ["mgmumj8m6zw4yc8kmw8"], "toElementIds": ["mgmumtglmqhgtz8qoqe", "mgmun7osw1amalhryvh", "mgmunifzci580donjk4"], "type": "or"},
    {"id": "2", "fromElementIds": ["mgmumtglmqhgtz8qoqe"], "toElementIds": ["mgmuns02ul9w1hxwye"], "type": "flow"},
    {"id": "3", "fromElementIds": ["mgmun7osw1amalhryvh"], "toElementIds": ["mgmuns02ul9w1hxwye"], "type": "flow"},
    {"id": "4", "fromElementIds": ["mgmunifzci580donjk4"], "toElementIds": ["mgmuns02ul9w1hxwye"], "type": "flow"}
  ],
  "startingElementId": "mgmumj8m6zw4yc8kmw8"
}

// Corrected Flow 3: Start → (Action A AND Action B), then Action C, expected result: 6 days (max of parallel 3,5) + 1 = 6 days
const flow3: FlowTemplate = {
  "id": "mglfkrb6l4aodo4y17s",
  "name": "Test Flow 3", 
  "description": "Test flow 3 with AND relation",
  "elements": [
    {"id": "mgm3ng8bztqe2umy7gv", "name": "Start", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgm3nji9nizqa3aiazr", "name": "Action A", "description": "", "ownerId": null, "durationDays": 3, "type": "action", "consultedUserIds": []},
    {"id": "mgm3nk7lf7qzgjxho1o", "name": "Action B", "description": "", "ownerId": null, "durationDays": 5, "type": "action", "consultedUserIds": []},
    {"id": "mgm3nksrn8n7zmrh5g8", "name": "Action C", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgm3nl7pn3smqhr1odz", "name": "End", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "1", "fromElementIds": ["mgm3ng8bztqe2umy7gv"], "toElementIds": ["mgm3nji9nizqa3aiazr", "mgm3nk7lf7qzgjxho1o"], "type": "and"},
    {"id": "2", "fromElementIds": ["mgm3nji9nizqa3aiazr", "mgm3nk7lf7qzgjxho1o"], "toElementIds": ["mgm3nksrn8n7zmrh5g8"], "type": "flow"},
    {"id": "3", "fromElementIds": ["mgm3nksrn8n7zmrh5g8"], "toElementIds": ["mgm3nl7pn3smqhr1odz"], "type": "flow"}
  ],
  "startingElementId": "mgm3ng8bztqe2umy7gv"
}

// Simple test case first
const simpleFlow: FlowTemplate = {
  "id": "simple",
  "name": "Simple Flow", 
  "description": "Simple sequential flow",
  "elements": [
    {"id": "start", "name": "Start", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "action1", "name": "Action 1", "description": "", "ownerId": null, "durationDays": 2, "type": "action", "consultedUserIds": []},
    {"id": "action2", "name": "Action 2", "description": "", "ownerId": null, "durationDays": 3, "type": "action", "consultedUserIds": []},
    {"id": "end", "name": "End", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "1", "fromElementIds": ["start"], "toElementIds": ["action1"], "type": "flow"},
    {"id": "2", "fromElementIds": ["action1"], "toElementIds": ["action2"], "type": "flow"},
    {"id": "3", "fromElementIds": ["action2"], "toElementIds": ["end"], "type": "flow"}
  ],
  "startingElementId": "start"
}

// OR test case
const orFlow: FlowTemplate = {
  "id": "or-test",
  "name": "OR Flow",
  "description": "Flow with OR relation",
  "elements": [
    {"id": "start", "name": "Start", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "action1", "name": "Fast", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "action2", "name": "Slow", "description": "", "ownerId": null, "durationDays": 5, "type": "action", "consultedUserIds": []},
    {"id": "end", "name": "End", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "1", "fromElementIds": ["start"], "toElementIds": ["action1", "action2"], "type": "or"},
    {"id": "2", "fromElementIds": ["action1"], "toElementIds": ["end"], "type": "flow"},
    {"id": "3", "fromElementIds": ["action2"], "toElementIds": ["end"], "type": "flow"}
  ],
  "startingElementId": "start"
}

// Calculate results
const testResults = computed(() => {
  const simpleResult = calculateFlowDuration(simpleFlow)
  const orResult = calculateFlowDuration(orFlow)
  const result1 = calculateFlowDuration(flow1)
  const result2 = calculateFlowDuration(flow2)  
  const result3 = calculateFlowDuration(flow3)

  return [
    {
      id: 0,
      name: "Simple Sequential Flow",
      expected: "5 days",
      actual: `${formatDurationRange(simpleResult)} days`,
      match: simpleResult.min === 5 && simpleResult.max === 5,
      flow: simpleFlow
    },
    {
      id: 0.5,
      name: "Simple OR Flow",
      expected: "1 - 5 days", 
      actual: `${formatDurationRange(orResult)} days`,
      match: orResult.min === 1 && orResult.max === 5,
      flow: orFlow
    },
    {
      id: 1,
      name: "Flow 1 - Complex Flow",
      expected: "6 days",
      actual: `${formatDurationRange(result1)} days`,
      match: result1.min === 6 && result1.max === 6,
      flow: flow1
    },
    {
      id: 2,
      name: "Flow 2 - OR Relations",
      expected: "1 - 5 days",
      actual: `${formatDurationRange(result2)} days`, 
      match: result2.min === 1 && result2.max === 5,
      flow: flow2
    },
    {
      id: 3,
      name: "Flow 3 - Complex AND/OR",
      expected: "6 - 8 days",
      actual: `${formatDurationRange(result3)} days`,
      match: result3.min === 6 && result3.max === 8,
      flow: flow3
    }
  ]
})
</script>

<style scoped>
.test-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.test-case {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.success {
  color: #28a745;
  font-weight: bold;
}

.error {
  color: #dc3545;
  font-weight: bold;
}

details {
  margin-top: 1rem;
}

pre {
  background: #f1f3f4;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
}
</style>