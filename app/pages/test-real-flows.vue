<template>
  <div class="test-page">
    <h1>Real Flow Duration Test</h1>
    <p>Testing the three flows provided by the user with their actual data structures</p>

    <div v-for="testCase in realFlowResults" :key="testCase.id" class="test-case">
      <h2>{{ testCase.name }} ({{ testCase.flow.id }})</h2>
      <p><strong>Expected:</strong> {{ testCase.expected }}</p>
      <p><strong>Actual:</strong> {{ testCase.actual }}</p>
      <p :class="testCase.match ? 'success' : 'error'">
        {{ testCase.match ? '✓ PASS' : '✗ FAIL' }}
      </p>
      
      <details>
        <summary>Flow Details</summary>
        <div>
          <h4>Elements ({{ testCase.flow.elements.length }}):</h4>
          <ul>
            <li v-for="element in testCase.flow.elements" :key="element.id">
              <strong>{{ element.name }}</strong> ({{ element.type }}) - {{ element.durationDays || 'No duration' }} days
            </li>
          </ul>
          
          <h4>Relations ({{ testCase.flow.relations.length }}):</h4>
          <ul>
            <li v-for="relation in testCase.flow.relations" :key="relation.id">
              {{ relation.fromElementIds.join(', ') }} → {{ relation.toElementIds.join(', ') }} ({{ relation.type }})
            </li>
          </ul>
          
          <h4>Starting Element:</h4>
          <p>{{ testCase.flow.startingElementId }}</p>
          
          <pre>{{ JSON.stringify(testCase.flow, null, 2) }}</pre>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateFlowDuration, formatDurationRange } from '../../utils/flowDurationCalculator'
import type { FlowTemplate } from '../../types/FlowTemplate'

// Real flow data from the database
const realFlow1: FlowTemplate = {
  "id": "mgikppiubnfwokzep7e",
  "name": "Abkündigung Server Komponente",
  "description": "Eine Komponente wird abgekündigt",
  "elements": [
    {"id": "mgikprvx3rvjjtt2rhl", "name": "Entscheidung getroffen", "description": "Komponente ist nur eingeschränkt oder gar nicht mehr vorhanden", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgikps2giemjxsayvn", "name": "Bestand analysieren", "description": "Bestand bei Lager und Kunden", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mglf1uvlm4plq6lgwt", "name": "Mailing klären", "description": "Text mit Marketing", "ownerId": "mgil7cfajan6glamkil", "durationDays": 3, "type": "action", "consultedUserIds": ["mgp9sluod7w39l8zu8e", "mgp9sue4tbvdme1b20q", "mgp9semvkhj21o4gqy", "mgp9ufvctbqb2unk2xd"]},
    {"id": "mglf7cpa19d3bqiiogp", "name": "Mails versenden", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mglff831pp20l1jp0u8", "name": "Intern informieren", "description": "Mailing-Listen: ...", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgms5wnpuxyf2qben5q", "name": "Mail", "description": "", "ownerId": null, "durationDays": null, "type": "artefact", "consultedUserIds": []},
    {"id": "mgms7jpplzxmv2cw2oq", "name": "Mail gesendet", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "mgqmzpurm6d5taibfg", "fromElementIds": ["mgikprvx3rvjjtt2rhl"], "toElementIds": ["mgikps2giemjxsayvn"], "type": "flow"},
    {"id": "mgqmzpurku9iafib81o", "fromElementIds": ["mglff831pp20l1jp0u8"], "toElementIds": ["mglf7cpa19d3bqiiogp"], "type": "flow"},
    {"id": "mgqmzpur9eamcr5sj37", "fromElementIds": ["mgms7jpplzxmv2cw2oq"], "toElementIds": ["mglff831pp20l1jp0u8"], "type": "flow"},
    {"id": "mgqmzpur1fpiyggsyfv", "fromElementIds": ["mglf1uvlm4plq6lgwt"], "toElementIds": ["mgms7jpplzxmv2cw2oq", "mgikps2giemjxsayvn"], "type": "flow"},
    {"id": "mgqmzpur1abmk9lu7h5", "fromElementIds": ["mgms5wnpuxyf2qben5q"], "toElementIds": ["mglff831pp20l1jp0u8"], "type": "in"},
    {"id": "mgqmzpuru2cg9hky9q9", "fromElementIds": ["mgms5wnpuxyf2qben5q"], "toElementIds": ["mglf1uvlm4plq6lgwt"], "type": "out"}
  ],
  "startingElementId": "mgikprvx3rvjjtt2rhl"
}

const realFlow2: FlowTemplate = {
  "id": "mglfjrzw8xvw5868o5j",
  "name": "Abkündigung Server aus Katalog",
  "description": "Server wird nicht mehr im Katalog angeboten und geht in Vorgänger oder Serverbörse über",
  "elements": [
    {"id": "mgmumj8m6zw4yc8kmw8", "name": "Start", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgmumtglmqhgtz8qoqe", "name": "Long Action", "description": "", "ownerId": null, "durationDays": 5, "type": "action", "consultedUserIds": []},
    {"id": "mgmun7osw1amalhryvh", "name": "Medium Action", "description": "", "ownerId": null, "durationDays": 3, "type": "action", "consultedUserIds": []},
    {"id": "mgmunifzci580donjk4", "name": "Short Action", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgmuns02ul9w1hxwye", "name": "End", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "mgqn1ihjtmka7rjxvj", "fromElementIds": ["mgmumtglmqhgtz8qoqe"], "toElementIds": ["mgmumj8m6zw4yc8kmw8"], "type": "or"},
    {"id": "mgqn1ihj3omtbjl5dn3", "fromElementIds": ["mgmun7osw1amalhryvh"], "toElementIds": ["mgmumj8m6zw4yc8kmw8"], "type": "or"},
    {"id": "mgqn1ihj3h9kgtg3ofj", "fromElementIds": ["mgmunifzci580donjk4"], "toElementIds": ["mgmumj8m6zw4yc8kmw8"], "type": "or"},
    {"id": "mgqn1ihjn4culysw72c", "fromElementIds": ["mgmuns02ul9w1hxwye"], "toElementIds": ["mgmumtglmqhgtz8qoqe", "mgmun7osw1amalhryvh", "mgmunifzci580donjk4"], "type": "flow"}
  ],
  "startingElementId": "mgmumj8m6zw4yc8kmw8"
}

const realFlow3: FlowTemplate = {
  "id": "mglfkrb6l4aodo4y17s",
  "name": "Release Server",
  "description": "Server wird in den Katalog aufgenommen",
  "elements": [
    {"id": "mgpaf4xmrujkbohsa2", "name": "Start", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgpafeuka0nkwrlhbl", "name": "AND 1", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgpafppjrp9zjr5u9ma", "name": "AND 2", "description": "", "ownerId": "mgil7cfajan6glamkil", "durationDays": 4, "type": "action", "consultedUserIds": []},
    {"id": "mgpag18npa9x6mo0woq", "name": "AND 3", "description": "", "ownerId": null, "durationDays": 2, "type": "action", "consultedUserIds": []},
    {"id": "mgpagdytvoe1viw4ng", "name": "Check", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []},
    {"id": "mgpapx61863js1lc91o", "name": "Option 1", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgpaq7d3md9n3pn7pmg", "name": "Option 2", "description": "", "ownerId": null, "durationDays": null, "type": "state", "consultedUserIds": []},
    {"id": "mgpaqit8jws1ryxwbvl", "name": "Action", "description": "", "ownerId": "mgil7j17gz6sby3n987", "durationDays": 2, "type": "action", "consultedUserIds": []},
    {"id": "mgparcg4xozlwy7ph7h", "name": "Ende", "description": "", "ownerId": null, "durationDays": 1, "type": "action", "consultedUserIds": []}
  ],
  "relations": [
    {"id": "mgqn2yua8xeddnm5qi", "fromElementIds": ["mgpafeuka0nkwrlhbl"], "toElementIds": ["mgpaf4xmrujkbohsa2"], "type": "and"},
    {"id": "mgqn2yuanpbe1coyu9", "fromElementIds": ["mgpafppjrp9zjr5u9ma"], "toElementIds": ["mgpaf4xmrujkbohsa2"], "type": "and"},
    {"id": "mgqn2yuaxt8y61bwyje", "fromElementIds": ["mgpag18npa9x6mo0woq"], "toElementIds": ["mgpaf4xmrujkbohsa2"], "type": "and"},
    {"id": "mgqn2yuah7seznxsxq", "fromElementIds": ["mgpagdytvoe1viw4ng"], "toElementIds": ["mgpafeuka0nkwrlhbl", "mgpafppjrp9zjr5u9ma", "mgpag18npa9x6mo0woq"], "type": "flow"},
    {"id": "mgqn2yua6yhqp5qvugt", "fromElementIds": ["mgpapx61863js1lc91o"], "toElementIds": ["mgpagdytvoe1viw4ng"], "type": "or"},
    {"id": "mgqn2yua9jsjqls9mpi", "fromElementIds": ["mgpaq7d3md9n3pn7pmg"], "toElementIds": ["mgpagdytvoe1viw4ng"], "type": "or"},
    {"id": "mgqn2yuatmv4lal4kb", "fromElementIds": ["mgpaqit8jws1ryxwbvl"], "toElementIds": ["mgpapx61863js1lc91o"], "type": "flow"},
    {"id": "mgqn2yuau22qr6xpos", "fromElementIds": ["mgparcg4xozlwy7ph7h"], "toElementIds": ["mgpaqit8jws1ryxwbvl", "mgpaq7d3md9n3pn7pmg"], "type": "flow"}
  ],
  "startingElementId": "mgpaf4xmrujkbohsa2"
}

// Calculate results with real flow data
const realFlowResults = computed(() => {
  const result1 = calculateFlowDuration(realFlow1)
  const result2 = calculateFlowDuration(realFlow2)
  const result3 = calculateFlowDuration(realFlow3)

  return [
    {
      id: 1,
      name: "Real Flow 1 - Abkündigung Server Komponente",
      expected: "6 days",
      actual: `${formatDurationRange(result1)} days`,
      match: result1.min === 6 && result1.max === 6,
      flow: realFlow1
    },
    {
      id: 2,
      name: "Real Flow 2 - Abkündigung Server aus Katalog",
      expected: "5 days",
      actual: `${formatDurationRange(result2)} days`,
      match: result2.min === 5 && result2.max === 5,
      flow: realFlow2
    },
    {
      id: 3,
      name: "Real Flow 3 - Release Server",
      expected: "6-8 days",
      actual: `${formatDurationRange(result3)} days`,
      match: result3.min >= 6 && result3.max <= 8,
      flow: realFlow3
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
  max-height: 300px;
  overflow-y: auto;
}

ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.25rem;
}

h4 {
  margin: 1rem 0 0.5rem 0;
}
</style>