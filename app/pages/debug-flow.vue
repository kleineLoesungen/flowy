<template>
  <div class="debug-page">
    <h1>Flow Analysis Debug</h1>
    
    <div class="flow-analysis">
      <h2>Flow 1 Analysis</h2>
      <div class="debug-section">
        <h3>Elements</h3>
        <div v-for="element in flow1.elements" :key="element.id" class="element-item">
          <strong>{{ element.name }}</strong> ({{ element.type }})
          <span v-if="element.durationDays"> - {{ element.durationDays }} days</span>
          <span class="element-id">{{ element.id }}</span>
        </div>
      </div>
      
      <div class="debug-section">
        <h3>Relations</h3>
        <div v-for="relation in flow1.relations" :key="relation.id" class="relation-item">
          <strong>{{ relation.type.toUpperCase() }}</strong>: 
          {{ getElementName(relation.fromElementIds[0] || '') }} → 
          {{ relation.toElementIds.map((id: string) => getElementName(id)).join(', ') }}
          <div class="relation-ids">
            {{ relation.fromElementIds.join(', ') }} → {{ relation.toElementIds.join(', ') }}
          </div>
        </div>
      </div>
      
      <div class="debug-section">
        <h3>Path from Start</h3>
        <div class="path-info">
          <p><strong>Starting Element:</strong> {{ getElementName(flow1.startingElementId) }} ({{ flow1.startingElementId }})</p>
          <div class="adjacency-list">
            <h4>Adjacency List:</h4>
            <div v-for="[elementId, connections] in adjacencyList" :key="elementId" class="adjacency-item">
              <strong>{{ getElementName(elementId) }}:</strong>
              <ul v-if="connections.length > 0">
                <li v-for="connection in connections" :key="connection.targetIds.join('-')">
                  {{ connection.type }} → {{ connection.targetIds.map((id: string) => getElementName(id)).join(', ') }}
                </li>
              </ul>
              <span v-else class="no-connections">(no outgoing connections)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="debug-section">
        <h3>Duration Calculation Result</h3>
        <div class="result">
          <p><strong>Calculated:</strong> {{ formatDurationRange(result) }} days</p>
          <p><strong>Expected:</strong> 6 days</p>
          <p><strong>Total Action Elements:</strong> {{ totalActionDays }} days</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateFlowDuration, formatDurationRange } from '../../utils/flowDurationCalculator'
import type { FlowTemplate } from '../../types/FlowTemplate'

const flow1: FlowTemplate = {
  "id": "mgikppiubnfwokzep7e", 
  "name": "Abkündigung Server Komponente",
  "description": "Eine Komponente wird abgekündigt",
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
    {"id": "mgqmzpurm6d5taibfg", "fromElementIds": ["mgikprvx3rvjjtt2rhl"], "toElementIds": ["mgikps2giemjxsayvn"], "type": "flow"},
    {"id": "mgqmzpurku9iafib81o", "fromElementIds": ["mglff831pp20l1jp0u8"], "toElementIds": ["mglf7cpa19d3bqiiogp"], "type": "flow"},
    {"id": "mgqmzpur9eamcr5sj37", "fromElementIds": ["mgms7jpplzxmv2cw2oq"], "toElementIds": ["mglff831pp20l1jp0u8"], "type": "flow"},
    {"id": "mgqmzpur1fpiyggsyfv", "fromElementIds": ["mglf1uvlm4plq6lgwt"], "toElementIds": ["mgms7jpplzxmv2cw2oq", "mgikps2giemjxsayvn"], "type": "flow"},
    {"id": "test-connection", "fromElementIds": ["mgikps2giemjxsayvn"], "toElementIds": ["mglf1uvlm4plq6lgwt"], "type": "flow"}
  ],
  "startingElementId": "mgikprvx3rvjjtt2rhl"
}

const getElementName = (elementId: string) => {
  const element = flow1.elements.find(el => el.id === elementId)
  return element ? element.name : elementId
}

// Build adjacency list to understand the flow
const adjacencyList = computed(() => {
  const adj = new Map()
  
  // Initialize all elements
  flow1.elements.forEach(el => {
    adj.set(el.id, [])
  })
  
  // Add relations (excluding in/out)
  flow1.relations
    .filter(rel => rel.type !== 'in' && rel.type !== 'out')
    .forEach(relation => {
      relation.fromElementIds.forEach(fromId => {
        if (adj.has(fromId)) {
          adj.get(fromId).push({
            targetIds: relation.toElementIds,
            type: relation.type
          })
        }
      })
    })
  
  return adj
})

const result = computed(() => calculateFlowDuration(flow1))

const totalActionDays = computed(() => {
  return flow1.elements
    .filter(el => el.type === 'action' && el.durationDays)
    .reduce((sum, el) => sum + (el.durationDays || 0), 0)
})
</script>

<style scoped>
.debug-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

.debug-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.element-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.element-id {
  font-family: 'Monaco', monospace;
  font-size: 0.75rem;
  color: #6c757d;
  display: block;
  margin-top: 0.25rem;
}

.relation-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.relation-ids {
  font-family: 'Monaco', monospace;
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.adjacency-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.no-connections {
  color: #6c757d;
  font-style: italic;
}

.result {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}

ul {
  margin: 0.5rem 0 0 1rem;
  padding: 0;
}

li {
  margin-bottom: 0.25rem;
}
</style>