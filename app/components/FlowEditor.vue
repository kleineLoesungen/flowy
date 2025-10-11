<template>
  <div class="flow-editor">
    <div class="editor-header">
      <h3>{{ isEditing ? 'Edit Flow' : 'Add Flow' }}</h3>
      <div class="header-controls">
        <button @click="addElement" class="btn btn-primary">
          + Element
        </button>
        <button @click="fitToView" class="btn btn-info">
          Fit View
        </button>
        <button @click="reorganizeLayout" class="btn btn-info">
          Auto Layout
        </button>
        <button 
          v-if="hasChanges" 
          @click="saveTemplate" 
          class="btn btn-success"
        >
          Save
        </button>
        <button 
          v-if="hasChanges" 
          @click="resetChanges" 
          class="btn btn-warning"
        >
          Reset
        </button>
        <button @click="$emit('cancel')" class="btn btn-secondary">
          Close
        </button>
      </div>
    </div>

    <!-- Basic Flow Info -->
    <div class="template-info">
      <div class="info-row">
        <div class="form-group">
          <label for="flow-name">Flow Name</label>
          <input 
            id="flow-name"
            v-model="templateData.name"
            type="text" 
            required
            placeholder="Enter flow name"
            class="form-control"
          />
        </div>
        <div class="form-group">
          <label for="flow-description">Description</label>
          <textarea 
            id="flow-description"
            v-model="templateData.description"
            placeholder="Enter flow description"
            class="form-control textarea-compact"
            rows="2"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Starting Elements</label>
          <div class="starting-elements-control">
            <div v-if="nodes.length === 0" class="no-elements-message">
              Add elements first, then select starting ones.
            </div>
            <div v-else class="multi-select-wrapper">
              <div 
                class="multi-select-dropdown compact" 
                :class="{ 'open': dropdownOpen }"
                @click="toggleDropdown"
              >
                <div class="selected-display">
                  <div v-if="templateData.startingElementIds.length === 0" class="placeholder">
                    Select starting elements...
                  </div>
                  <div v-else class="selected-items">
                    <span 
                      v-for="elementId in templateData.startingElementIds" 
                      :key="elementId"
                      class="selected-tag"
                    >
                      {{ getElementName(elementId) }}
                      <button 
                        @click.stop="removeStartingElement(elementId)"
                        class="remove-tag-btn"
                      >×</button>
                    </span>
                  </div>
                  <svg class="dropdown-arrow" :class="{ 'rotated': dropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <div v-show="dropdownOpen" class="dropdown-menu">
                  <div 
                    v-for="node in nodes" 
                    :key="node.id"
                    class="dropdown-item"
                    :class="{ 'selected': templateData.startingElementIds.includes(node.id) }"
                    @click.stop="toggleStartingElement(node.id)"
                  >
                    <div class="element-icon-small" :class="`element-${node.data.type || 'action'}`">
                      <svg v-if="node.data.type === 'action'" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10h5l-6 6-6-6h5V3h2v7z"/>
                      </svg>
                      <svg v-else-if="node.data.type === 'state'" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      </svg>
                      <svg v-else width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                      </svg>
                    </div>
                    <div class="element-info-dropdown">
                      <span class="element-name">{{ node.data.name || 'Unnamed Element' }}</span>
                      <span v-if="node.data.description" class="element-description">{{ node.data.description }}</span>
                    </div>
                    <div class="checkbox-indicator">
                      <svg v-if="templateData.startingElementIds.includes(node.id)" class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vue Flow Editor -->
    <div class="flow-canvas">
      <VueFlow
        :nodes="reactiveNodes"
        :edges="edges"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        @connect="onConnect"
        @node-double-click="onNodeDoubleClick"
        @edge-double-click="onEdgeDoubleClick"
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.2"
        :max-zoom="4"
        class="vue-flow-container"
      >
        <Background pattern-color="#aaa" :gap="16" />
        <Controls />
        
        <!-- Empty State Message -->
        <div v-if="nodes.length === 0" class="empty-flow-message">
          <div class="empty-icon">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3>Ready to build your flow!</h3>
          <p>Click the "+ Add Element" button above to start building your flow.</p>
          <p>You can add elements, connect them, and create your workflow visually.</p>
        </div>
        
        <!-- Custom Element Node -->
        <template #node-element="{ data, id }">
          <div class="element-node" :class="{ 'editing': editingNodeId === id, [`element-${data.type || 'action'}`]: true }" :key="`node-${id}-${data.name}-${data.description}-${data.durationDays}`" @click="handleNodeClick(id)">
            <div class="node-header">
              <div class="element-icon">
                <svg v-if="data.type === 'action'" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10h5l-6 6-6-6h5V3h2v7z"/>
                </svg>
                <svg v-else-if="data.type === 'state'" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <svg v-else width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <div class="element-info" v-if="editingNodeId !== id">
                <h4>{{ data.name || 'Unnamed Element' }}</h4>
                <p v-if="data.description && data.description.trim()" class="description">{{ data.description }}</p>
                <div class="element-meta">
                  <span v-if="data.type" class="type-tag" :class="'type-' + data.type">
                    <svg v-if="data.type === 'action'" width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10h5l-6 6-6-6h5V3h2v7z"/></svg>
                    <svg v-else-if="data.type === 'state'" width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                    <svg v-else width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/></svg>
                    {{ data.type }}
                  </span>
                  <span v-if="data.ownerId" class="owner-tag">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    {{ getUserName(data.ownerId) }}
                  </span>
                  <span v-if="data.teamId" class="team-tag">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h6v-4h3v4h4v-6H0v6h4zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-6c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM6 8c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2z"/></svg>
                    {{ getTeamName(data.teamId) }}
                  </span>
                  <span v-if="data.durationDays" class="duration">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    {{ data.durationDays }} day{{ data.durationDays === 1 ? '' : 's' }}
                  </span>
                </div>
              </div>
              <!-- Inline editing form -->
              <div class="element-edit" v-else @click.stop>
                <input 
                  v-model="editingNodeData.name"
                  placeholder="Element name"
                  class="edit-input"
                  @keyup.enter="saveNodeEdit"
                  @keyup.escape="cancelNodeEdit"
                  ref="nodeEditInput"
                />
                <input 
                  v-model="editingNodeData.description"
                  placeholder="Description"
                  class="edit-input"
                  @keyup.enter="saveNodeEdit"
                  @keyup.escape="cancelNodeEdit"
                />
                <select 
                  v-model="editingNodeData.ownerId"
                  class="edit-input"
                  @keyup.enter="saveNodeEdit"
                  @keyup.escape="cancelNodeEdit"
                >
                  <option :value="null">No Owner</option>
                  <option v-for="user in users" :key="user.id" :value="user.id">
                    {{ user.name || user.email || `User ${user.id}` }}
                  </option>
                  <option v-if="users.length === 0" disabled>Loading users...</option>
                </select>
                <select 
                  v-model="editingNodeData.teamId"
                  class="edit-input"
                  @keyup.enter="saveNodeEdit"
                  @keyup.escape="cancelNodeEdit"
                >
                  <option :value="null">No Team</option>
                  <option v-for="team in teams" :key="team.id" :value="team.id">
                    {{ team.name || `Team ${team.id}` }}
                  </option>
                  <option v-if="teams.length === 0" disabled>Loading teams...</option>
                </select>
                <select 
                  v-model="editingNodeData.type"
                  class="edit-input"
                  @keyup.enter="saveNodeEdit"
                  @keyup.escape="cancelNodeEdit"
                >
                  <option value="action">Action</option>
                  <option value="state">State</option>
                  <option value="artefact">Artefact</option>
                </select>
                <input 
                  v-model.number="editingNodeData.durationDays"
                  type="number"
                  placeholder="Days"
                  class="edit-input duration-input"
                  @keyup.enter="saveNodeEdit"
                  @keyup.escape="cancelNodeEdit"
                />
                <div class="edit-actions">
                  <button @click="saveNodeEdit" class="btn-small btn-save">✓</button>
                  <button @click="cancelNodeEdit" class="btn-small btn-cancel">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="node-actions" v-if="editingNodeId !== id">
                <button @click="editNode(id)" class="btn-icon edit-btn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button @click="removeNode(id)" class="btn-icon delete-btn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
            <!-- Vue Flow handles - duplicate each position as both source and target for maximum flexibility -->
            <Handle id="top-source" type="source" :position="Position.Top" />
            <Handle id="top-target" type="target" :position="Position.Top" />
            <Handle id="bottom-source" type="source" :position="Position.Bottom" />
            <Handle id="bottom-target" type="target" :position="Position.Bottom" />
            <Handle id="left-source" type="source" :position="Position.Left" />
            <Handle id="left-target" type="target" :position="Position.Left" />
            <Handle id="right-source" type="source" :position="Position.Right" />
            <Handle id="right-target" type="target" :position="Position.Right" />
          </div>
        </template>
      </VueFlow>
    </div>

    <!-- Edge Type Modal -->
    <div v-if="showEdgeModal" class="modal-overlay" @click="closeEdgeModal">
      <div class="edge-modal" @click.stop>
        <h3>Configure Connection</h3>
        <div class="edge-form">
          <div class="form-group">
            <label>Connection Type</label>
            <select v-model="currentEdgeType" class="form-control">
              <template v-if="isArtefactConnection">
                <option value="in">In (Data flows into Artefact)</option>
                <option value="out">Out (Data flows from Artefact)</option>
              </template>
              <template v-else>
                <option value="flow">Flow (Sequential)</option>
                <option value="or">OR (Alternative)</option>
                <option value="and">AND (Parallel)</option>
              </template>
            </select>
          </div>
          <div class="edge-type-info">
            <p v-if="currentEdgeType === 'flow'">
              <strong>Flow:</strong> Sequential execution - one element must complete before the next begins
            </p>
            <p v-if="currentEdgeType === 'or'">
              <strong>OR:</strong> Alternative paths - only one of the connected elements needs to be executed
            </p>
            <p v-if="currentEdgeType === 'and'">
              <strong>AND:</strong> Parallel execution - all connected elements must be completed
            </p>
            <p v-if="currentEdgeType === 'in'">
              <strong>In:</strong> Input connection to an artefact - represents data or resources flowing into the artefact
            </p>
            <p v-if="currentEdgeType === 'out'">
              <strong>Out:</strong> Output connection from an artefact - represents data or resources produced by the artefact
            </p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="saveEdgeType" class="btn btn-primary">Save</button>
          <button @click="closeEdgeModal" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow, Handle, Position, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Node, Edge, Connection, NodeChange, EdgeChange, XYPosition } from '@vue-flow/core'
import type { FlowTemplate } from '../../types/FlowTemplate'
import type { ElementTemplate } from '../../types/ElementTemplate'
import type { Relation } from '../../types/Relation'
import type { User } from '../../types/User'
import type { Team } from '../../types/Team'

// Props and emits
const props = defineProps<{
  template?: FlowTemplate | null
  isEditing: boolean
}>()

const emit = defineEmits<{
  save: [template: FlowTemplate]
  cancel: []
}>()

// Reactive state
const templateData = ref<{name: string, description: string, startingElementIds: string[]}>({
  name: '',
  description: '',
  startingElementIds: []
})

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const nodeCounter = ref(0)

// Vue Flow instance
const { fitView } = useVueFlow()

// Change tracking state
const initialState = ref<{
  templateData: {name: string, description: string, startingElementIds: string[]},
  nodes: Node[],
  edges: Edge[]
} | null>(null)

const hasChanges = computed(() => {
  if (!initialState.value) return false
  
  // Check template data changes
  const currentTemplateData = templateData.value
  const initialTemplateData = initialState.value.templateData
  
  if (currentTemplateData.name !== initialTemplateData.name ||
      currentTemplateData.description !== initialTemplateData.description ||
      JSON.stringify([...currentTemplateData.startingElementIds].sort()) !== JSON.stringify([...initialTemplateData.startingElementIds].sort())) {
    return true
  }
  
  // Check nodes changes
  if (nodes.value.length !== initialState.value.nodes.length) {
    return true
  }
  
  // Check if any node has changed
  for (const currentNode of nodes.value) {
    const initialNode = initialState.value.nodes.find(n => n.id === currentNode.id)
    if (!initialNode) return true
    
    if (JSON.stringify(currentNode.data) !== JSON.stringify(initialNode.data) ||
        JSON.stringify(currentNode.position) !== JSON.stringify(initialNode.position)) {
      return true
    }
  }
  
  // Check edges changes
  if (edges.value.length !== initialState.value.edges.length) {
    return true
  }
  
  // Check if any edge has changed
  for (const currentEdge of edges.value) {
    const initialEdge = initialState.value.edges.find(e => 
      e.source === currentEdge.source && 
      e.target === currentEdge.target &&
      e.data?.relationType === currentEdge.data?.relationType
    )
    if (!initialEdge) return true
  }
  
  return false
})

// Force reactivity for Vue Flow
const reactiveNodes = computed(() => {
  return nodes.value.map(node => ({
    ...node,
    data: { ...node.data }
  }))
})

// Check if the pending connection involves an artefact
const isArtefactConnection = computed(() => {
  if (!pendingConnection.value) return false
  
  const sourceNode = nodes.value.find(n => n.id === pendingConnection.value!.source)
  const targetNode = nodes.value.find(n => n.id === pendingConnection.value!.target)
  
  if (!sourceNode || !targetNode) return false
  
  const sourceType = sourceNode.data.type || 'action'
  const targetType = targetNode.data.type || 'action'
  
  return sourceType === 'artefact' || targetType === 'artefact'
})

// Editing state
const editingNodeId = ref<string | null>(null)
const editingNodeData = ref<ElementTemplate>({
  id: '',
  name: '',
  description: '',
  ownerId: null,
  teamId: null,
  durationDays: null,
  type: 'action'
})

// Edge configuration state
const showEdgeModal = ref(false)
const currentEdgeType = ref<'flow' | 'or' | 'and' | 'in' | 'out'>('flow')
const pendingConnection = ref<Connection | null>(null)

// Multi-select dropdown state
const dropdownOpen = ref(false)

// Refs
const nodeEditInput = ref<HTMLInputElement>()

// Users and teams data
const users = ref<User[]>([])
const teams = ref<Team[]>([])

// Fetch users and teams
const fetchUsers = async () => {
  try {
    const response = await $fetch<{success: boolean, data: User[]}>('/api/users')
    users.value = response?.data || []
  } catch (error) {
    console.error('Failed to fetch users:', error)
    users.value = []
  }
}

const fetchTeams = async () => {
  try {
    const response = await $fetch<{success: boolean, data: Team[]}>('/api/teams')
    teams.value = response?.data || []
  } catch (error) {
    console.error('Failed to fetch teams:', error)
    teams.value = []
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchUsers()
  fetchTeams()
  document.addEventListener('click', closeDropdownOnOutsideClick)
})

// Helper functions to get display names
const getUserName = (userId: string | null): string => {
  if (!userId) return ''
  const user = users.value.find(u => u.id === userId)
  return user?.name || user?.email || `User ${userId}`
}

const getTeamName = (teamId: string | null): string => {
  if (!teamId) return ''
  const team = teams.value.find(t => t.id === teamId)
  return team?.name || `Team ${teamId}`
}



// Helper lines logic - using fixed node dimensions
const getHelperLines = (change: NodeChange, nodes: Node[]): { horizontal?: number; vertical?: number } => {
  const defaultResult = { horizontal: undefined, vertical: undefined }
  
  if (change.type !== 'position' || !change.position || !change.id) {
    return defaultResult
  }

  const nodeA = nodes.find((node) => node.id === change.id)
  if (!nodeA) {
    return defaultResult
  }

  // Use fixed dimensions for our element nodes (250px width, ~120px height)
  const NODE_WIDTH = 250
  const NODE_HEIGHT = 120

  const nodeABounds = {
    left: change.position.x,
    right: change.position.x + NODE_WIDTH,
    top: change.position.y,
    bottom: change.position.y + NODE_HEIGHT,
    centerX: change.position.x + NODE_WIDTH / 2,
    centerY: change.position.y + NODE_HEIGHT / 2,
  }

  let horizontalDistance = Number.MAX_SAFE_INTEGER
  let verticalDistance = Number.MAX_SAFE_INTEGER
  let horizontal: number | undefined = undefined
  let vertical: number | undefined = undefined

  for (const nodeB of nodes) {
    if (nodeB.id === nodeA.id) {
      continue
    }

    const nodeBBounds = {
      left: nodeB.position.x,
      right: nodeB.position.x + NODE_WIDTH,
      top: nodeB.position.y,
      bottom: nodeB.position.y + NODE_HEIGHT,
      centerX: nodeB.position.x + NODE_WIDTH / 2,
      centerY: nodeB.position.y + NODE_HEIGHT / 2,
    }

    // Check vertical alignments (left, right, center)
    const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left)
    if (distanceLeftLeft < verticalDistance) {
      verticalDistance = distanceLeftLeft
      vertical = nodeBBounds.left
    }

    const distanceRightRight = Math.abs(nodeABounds.right - nodeBBounds.right)
    if (distanceRightRight < verticalDistance) {
      verticalDistance = distanceRightRight
      vertical = nodeBBounds.right
    }

    const distanceCenterCenter = Math.abs(nodeABounds.centerX - nodeBBounds.centerX)
    if (distanceCenterCenter < verticalDistance) {
      verticalDistance = distanceCenterCenter
      vertical = nodeBBounds.centerX
    }

    // Check horizontal alignments (top, bottom, center)
    const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top)
    if (distanceTopTop < horizontalDistance) {
      horizontalDistance = distanceTopTop
      horizontal = nodeBBounds.top
    }

    const distanceBottomBottom = Math.abs(nodeABounds.bottom - nodeBBounds.bottom)
    if (distanceBottomBottom < horizontalDistance) {
      horizontalDistance = distanceBottomBottom
      horizontal = nodeBBounds.bottom
    }

    const distanceCenterYCenter = Math.abs(nodeABounds.centerY - nodeBBounds.centerY)
    if (distanceCenterYCenter < horizontalDistance) {
      horizontalDistance = distanceCenterYCenter
      horizontal = nodeBBounds.centerY
    }
  }

  return {
    horizontal: horizontalDistance < 15 ? horizontal : undefined,
    vertical: verticalDistance < 15 ? vertical : undefined,
  }
}

// Utility function to generate IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Load existing flow into the visual editor
const loadTemplateIntoEditor = (template: FlowTemplate) => {
  // Clear existing data first
  nodes.value = []
  edges.value = []
  
  // Convert elements to nodes using smart layout algorithm (same as FlowVisualizationModal)
  const elements = template.elements
  const relations = template.relations || []
  
  // Create a map for quick element lookup
  const nodeMap = new Map(elements.map(el => [el.id, el]))
  const levels: string[][] = []
  
  // Build outgoing edges map for proper level calculation
  const outgoingEdges = new Map<string, string[]>()
  elements.forEach(el => {
    outgoingEdges.set(el.id, [])
  })
  
  relations.forEach(rel => {
    rel.fromElementIds.forEach((fromId: string) => {
      rel.toElementIds.forEach((toId: string) => {
        if (nodeMap.has(fromId) && nodeMap.has(toId)) {
          const outgoing = outgoingEdges.get(fromId) || []
          outgoing.push(toId)
          outgoingEdges.set(fromId, outgoing)
        }
      })
    })
  })
  
  // Calculate distance from end for each node (convergence-aware layout)
  const calculateDistanceFromEnd = (nodeId: string, memo: Map<string, number> = new Map(), visiting: Set<string> = new Set()): number => {
    if (memo.has(nodeId)) return memo.get(nodeId)!
    
    // Cycle detection - if we're already visiting this node, there's a cycle
    if (visiting.has(nodeId)) {
      memo.set(nodeId, 0)
      return 0
    }
    
    visiting.add(nodeId)
    
    const outgoing = outgoingEdges.get(nodeId) || []
    if (outgoing.length === 0) {
      // This is a leaf node (end node) - distance 0 from end
      memo.set(nodeId, 0)
      visiting.delete(nodeId)
      return 0
    }
    
    // Distance is 1 + maximum distance of all children
    const maxDistanceToEnd = Math.max(...outgoing.map(targetId => calculateDistanceFromEnd(targetId, memo, visiting))) + 1
    memo.set(nodeId, maxDistanceToEnd)
    visiting.delete(nodeId)
    return maxDistanceToEnd
  }
  
  // Calculate final positions based on distance from end
  const nodeDepths = new Map<string, number>()
  elements.forEach(el => {
    nodeDepths.set(el.id, calculateDistanceFromEnd(el.id))
  })
  
  // Group nodes by their distance from end (reverse so final nodes are at the end)
  const maxDistance = Math.max(...Array.from(nodeDepths.values()), 0)
  const levelGroups = new Map<number, string[]>()
  
  nodeDepths.forEach((distance, nodeId) => {
    const level = maxDistance - distance // Reverse so end nodes are at the highest level
    if (!levelGroups.has(level)) levelGroups.set(level, [])
    levelGroups.get(level)!.push(nodeId)
  })
  
  // Convert to levels array
  for (let i = 0; i <= maxDistance; i++) {
    if (levelGroups.has(i)) {
      levels.push(levelGroups.get(i)!)
    }
  }
  
  // Convert to nodes with positions
  const elementNodes: Node[] = []
  
  // Check if we have saved layout positions
  const savedLayout = template.layout
  
  if (savedLayout) {
    // Use saved positions
    elements.forEach(element => {
      const savedPosition = savedLayout[element.id]
      elementNodes.push({
        id: element.id,
        type: 'element',
        position: savedPosition ? 
          { x: savedPosition.x, y: savedPosition.y } :
          { x: 100, y: 100 }, // fallback position
        data: { ...element, type: element.type || 'action' }
      })
    })
  } else {
    // Use auto-layout algorithm
    levels.forEach((level, levelIndex) => {
      const levelY = 120 + levelIndex * 220  // Increased Y padding: 120 base + 220 spacing
      const levelWidth = level.length * 320  // Increased X padding: 320 spacing
      const startX = Math.max(80, (1000 - levelWidth) / 2) // Increased margins and canvas width
      
      level.forEach((elementId, nodeIndex) => {
        const element = nodeMap.get(elementId)
        if (element) {
          elementNodes.push({
            id: element.id,
            type: 'element',
            position: { 
              x: startX + nodeIndex * 320,  // Increased X spacing
              y: levelY 
            },
            data: { ...element }
          })
        }
      })
    })
  }

  // Convert relations to edges
  const relationEdges: Edge[] = []
  const elementIds = new Set(elements.map(el => el.id))
  
  template.relations.forEach(relation => {
    relation.fromElementIds.forEach((fromId: string) => {
      relation.toElementIds.forEach((toId: string) => {
        // Only create edges for elements that actually exist
        if (elementIds.has(fromId) && elementIds.has(toId)) {
          // Determine appropriate handles based on relation type and node types
          const sourceElement = nodeMap.get(fromId)
          const targetElement = nodeMap.get(toId)
          const sourceType = sourceElement?.type || 'action'
          const targetType = targetElement?.type || 'action'
          
          // Use default handles
          let sourceHandle = 'bottom-source'
          let targetHandle = 'top-target'
          
          // Check if we have saved handle information
          if (relation.connections) {
            const connection = relation.connections.find(
              conn => conn.fromElementId === fromId && conn.toElementId === toId
            )
            if (connection) {
              sourceHandle = connection.sourceHandle || sourceHandle
              targetHandle = connection.targetHandle || targetHandle
            }
          }
          
          relationEdges.push({
            id: generateId(),
            source: fromId,
            target: toId,
            sourceHandle,
            targetHandle,
            type: 'default',
            data: { relationType: relation.type },
            label: relation.type.toUpperCase(),
            style: getEdgeStyle(relation.type)
          })
        }
      })
    })
  })

  // Update reactive data
  nextTick(() => {
    nodes.value = elementNodes
    edges.value = relationEdges
    nodeCounter.value = template.elements.length
    
    // Fit view to show all elements after a short delay to ensure rendering is complete
    setTimeout(() => {
      fitView({ 
        padding: 0.1, // 10% padding around elements
        duration: 800, // smooth animation
        maxZoom: 1.5,  // don't zoom in too much
        minZoom: 0.2   // don't zoom out too much
      })
    }, 100)
  })
}

// Get edge style based on relation type
const getEdgeStyle = (type: string) => {
  const styles = {
    flow: { stroke: '#3498db', strokeWidth: 2 },
    or: { stroke: '#e67e22', strokeWidth: 2, strokeDasharray: '5,5' },
    and: { stroke: '#27ae60', strokeWidth: 3 },
    in: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '10,3' },
    out: { stroke: '#d97706', strokeWidth: 2, strokeDasharray: '3,10' }
  }
  return styles[type as keyof typeof styles] || styles.flow
}

// Initialize data when props change
watch(() => [props.template, props.isEditing] as const, ([template, isEditing]) => {
  if (template && isEditing) {
    templateData.value.name = template.name
    templateData.value.description = template.description
    templateData.value.startingElementIds = template.startingElementIds || []
    loadTemplateIntoEditor(template)
    
    // Save initial state after loading is complete
    nextTick(() => {
      saveInitialState()
    })
  } else {
    templateData.value.name = ''
    templateData.value.description = ''
    templateData.value.startingElementIds = []
    nodes.value = []
    edges.value = []
    nodeCounter.value = 0
    
    // Save initial state for new templates
    nextTick(() => {
      saveInitialState()
    })
  }
}, { immediate: true })

// Multi-select dropdown functions
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const toggleStartingElement = (elementId: string) => {
  const index = templateData.value.startingElementIds.indexOf(elementId)
  if (index > -1) {
    templateData.value.startingElementIds.splice(index, 1)
  } else {
    templateData.value.startingElementIds.push(elementId)
  }
}

const removeStartingElement = (elementId: string) => {
  const index = templateData.value.startingElementIds.indexOf(elementId)
  if (index > -1) {
    templateData.value.startingElementIds.splice(index, 1)
  }
}

const getElementName = (elementId: string): string => {
  const node = nodes.value.find(n => n.id === elementId)
  return node?.data.name || 'Unnamed Element'
}

// Close dropdown when clicking outside
const closeDropdownOnOutsideClick = (event: MouseEvent) => {
  if (dropdownOpen.value) {
    const target = event.target as HTMLElement
    if (!target.closest('.multi-select-dropdown')) {
      dropdownOpen.value = false
    }
  }
}

// Add new element node
const addElement = () => {
  nodeCounter.value++
  
  // Find the rightmost position on the bottom level to avoid overlaps
  let maxY = 100
  let maxXAtBottomY = 100
  
  if (nodes.value.length > 0) {
    // Find the bottom-most Y position
    maxY = Math.max(...nodes.value.map(node => node.position.y))
    
    // Find the rightmost X position at that Y level
    const nodesAtMaxY = nodes.value.filter(node => node.position.y === maxY)
    if (nodesAtMaxY.length > 0) {
      maxXAtBottomY = Math.max(...nodesAtMaxY.map(node => node.position.x)) + 320  // Increased spacing to match auto-layout
    }
  } else {
    // First node, center it
    maxXAtBottomY = 400
  }
  
  const elementId = generateId()
  const newNode: Node = {
    id: elementId, // Use same ID for both node and data
    type: 'element',
    position: { 
      x: maxXAtBottomY, 
      y: maxY
    },
    data: {
      id: elementId, // Same ID as node.id for consistency
      name: `Element ${nodeCounter.value}`,
      description: '',
      ownerId: null,
      teamId: null,
      durationDays: 1,
      type: 'action'
    }
  }
  nodes.value.push(newNode)
}

// Reorganize layout using the same algorithm as loadTemplateIntoEditor
const reorganizeLayout = () => {
  if (nodes.value.length === 0) return
  
  // Convert current nodes to a pseudo-template format for layout algorithm
  const elements = nodes.value.map(node => ({
    id: node.id,
    ...node.data
  }))
  
  // Use current edges to determine relations
  const relations: any[] = []
  const edgeGroups: Record<string, { from: string[], to: string[] }> = {}
  
  edges.value.forEach(edge => {
    const relationType = edge.data?.relationType || 'flow'
    const key = `${relationType}-${edge.source}-${edge.target}`
    
    if (!edgeGroups[key]) {
      edgeGroups[key] = { from: [edge.source], to: [edge.target] }
    }
  })
  
  Object.entries(edgeGroups).forEach(([key, group]) => {
    relations.push({
      fromElementIds: group.from,
      toElementIds: group.to,
      type: key.split('-')[0]
    })
  })
  
  // Apply the same improved layout algorithm
  const nodeMap = new Map(elements.map(el => [el.id, el]))
  const levels: string[][] = []
  
  // Build outgoing edges map for proper level calculation
  const outgoingEdges = new Map<string, string[]>()
  elements.forEach(el => {
    outgoingEdges.set(el.id, [])
  })
  
  relations.forEach(rel => {
    rel.fromElementIds.forEach((fromId: string) => {
      rel.toElementIds.forEach((toId: string) => {
        if (nodeMap.has(fromId) && nodeMap.has(toId)) {
          const outgoing = outgoingEdges.get(fromId) || []
          outgoing.push(toId)
          outgoingEdges.set(fromId, outgoing)
        }
      })
    })
  })
  
  // Calculate distance from end for each node (convergence-aware layout)
  const calculateDistanceFromEnd = (nodeId: string, memo: Map<string, number> = new Map(), visiting: Set<string> = new Set()): number => {
    if (memo.has(nodeId)) return memo.get(nodeId)!
    
    // Cycle detection - if we're already visiting this node, there's a cycle
    if (visiting.has(nodeId)) {
      memo.set(nodeId, 0)
      return 0
    }
    
    visiting.add(nodeId)
    
    const outgoing = outgoingEdges.get(nodeId) || []
    if (outgoing.length === 0) {
      // This is a leaf node (end node) - distance 0 from end
      memo.set(nodeId, 0)
      visiting.delete(nodeId)
      return 0
    }
    
    // Distance is 1 + maximum distance of all children
    const maxDistanceToEnd = Math.max(...outgoing.map(targetId => calculateDistanceFromEnd(targetId, memo, visiting))) + 1
    memo.set(nodeId, maxDistanceToEnd)
    visiting.delete(nodeId)
    return maxDistanceToEnd
  }
  
  // Calculate final positions based on distance from end
  const nodeDepths = new Map<string, number>()
  elements.forEach(el => {
    nodeDepths.set(el.id, calculateDistanceFromEnd(el.id))
  })
  
  // Group nodes by their distance from end (reverse so final nodes are at the end)
  const maxDistance = Math.max(...Array.from(nodeDepths.values()), 0)
  const levelGroups = new Map<number, string[]>()
  
  nodeDepths.forEach((distance, nodeId) => {
    const level = maxDistance - distance // Reverse so end nodes are at the highest level
    if (!levelGroups.has(level)) levelGroups.set(level, [])
    levelGroups.get(level)!.push(nodeId)
  })
  
  // Convert to levels array
  for (let i = 0; i <= maxDistance; i++) {
    if (levelGroups.has(i)) {
      levels.push(levelGroups.get(i)!)
    }
  }
  
  // Update node positions
  levels.forEach((level, levelIndex) => {
    const levelY = 120 + levelIndex * 220  // Increased Y padding: 120 base + 220 spacing
    const levelWidth = level.length * 320  // Increased X padding: 320 spacing
    const startX = Math.max(80, (1000 - levelWidth) / 2) // Increased margins and canvas width
    
    level.forEach((elementId, nodeIndex) => {
      const node = nodes.value.find(n => n.id === elementId)
      if (node) {
        node.position = {
          x: startX + nodeIndex * 320,  // Increased X spacing
          y: levelY
        }
      }
    })
  })
  
  // Auto-fit view after reorganizing
  setTimeout(() => {
    fitView({ 
      padding: 0.1,
      duration: 800,
      maxZoom: 1.5,
      minZoom: 0.2
    })
  }, 100)
}

// Fit view to show all elements
const fitToView = () => {
  fitView({ 
    padding: 0.1, // 10% padding around elements
    duration: 800, // smooth animation
    maxZoom: 1.5,  // don't zoom in too much
    minZoom: 0.2   // don't zoom out too much
  })
}

// Node editing functions
const editNode = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    editingNodeId.value = nodeId
    editingNodeData.value = { ...node.data }
    nextTick(() => {
      nodeEditInput.value?.focus()
    })
  }
}

const saveNodeEdit = () => {
  if (editingNodeId.value) {
    const nodeIndex = nodes.value.findIndex(n => n.id === editingNodeId.value)
    if (nodeIndex !== -1 && nodes.value[nodeIndex]) {
      // Update the node data with the edited values
      const updatedData = { ...editingNodeData.value }
      
      // Create a completely new node object to trigger reactivity
      const updatedNode = {
        ...nodes.value[nodeIndex],
        data: updatedData
      }
      
      // Replace the node in the array
      nodes.value.splice(nodeIndex, 1, updatedNode)
    }
    editingNodeId.value = null
  }
}

const cancelNodeEdit = () => {
  editingNodeId.value = null
}

// Handle node click - save edit if clicking outside editing area
const handleNodeClick = (nodeId: string) => {
  // If we're editing a different node, save the current edit first
  if (editingNodeId.value && editingNodeId.value !== nodeId) {
    saveNodeEdit()
  }
}

// Remove node and associated edges
const removeNode = (nodeId: string) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
}

// Vue Flow event handlers
const onNodesChange = (changes: NodeChange[]) => {
  // Handle node changes (position, selection, etc.)
  changes.forEach(change => {
    if (change.type === 'position' && change.position) {
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        // Calculate helper lines for snapping (no visual display)
        const helperLines = getHelperLines(change, nodes.value)

        // Snap to helper lines if close enough
        const NODE_WIDTH = 250
        const NODE_HEIGHT = 120
        
        if (helperLines.horizontal !== undefined) {
          // Determine if we're snapping to top, center, or bottom
          const nodeTop = change.position.y
          const nodeCenter = change.position.y + NODE_HEIGHT / 2
          const nodeBottom = change.position.y + NODE_HEIGHT

          if (Math.abs(nodeTop - helperLines.horizontal) < 15) {
            change.position.y = helperLines.horizontal
          } else if (Math.abs(nodeCenter - helperLines.horizontal) < 15) {
            change.position.y = helperLines.horizontal - NODE_HEIGHT / 2
          } else if (Math.abs(nodeBottom - helperLines.horizontal) < 15) {
            change.position.y = helperLines.horizontal - NODE_HEIGHT
          }
        }
        
        if (helperLines.vertical !== undefined) {
          // Determine if we're snapping to left, center, or right
          const nodeLeft = change.position.x
          const nodeCenter = change.position.x + NODE_WIDTH / 2
          const nodeRight = change.position.x + NODE_WIDTH

          if (Math.abs(nodeLeft - helperLines.vertical) < 15) {
            change.position.x = helperLines.vertical
          } else if (Math.abs(nodeCenter - helperLines.vertical) < 15) {
            change.position.x = helperLines.vertical - NODE_WIDTH / 2
          } else if (Math.abs(nodeRight - helperLines.vertical) < 15) {
            change.position.x = helperLines.vertical - NODE_WIDTH
          }
        }

        node.position = change.position
      }
    } else if (change.type === 'remove') {
      removeNode(change.id)
    }
  })
}

const onEdgesChange = (changes: EdgeChange[]) => {
  // Handle edge changes (removal, etc.)
  changes.forEach(change => {
    if (change.type === 'remove') {
      edges.value = edges.value.filter(e => e.id !== change.id)
    }
  })
}

// Handle new connections
const onConnect = (connection: Connection) => {
  // Get source and target node types
  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)
  
  if (!sourceNode || !targetNode) return
  
  const sourceType = sourceNode.data.type || 'action'
  const targetType = targetNode.data.type || 'action'
  
  // Set default edge type based on element types
  if (sourceType === 'artefact' || targetType === 'artefact') {
    // If source is artefact, default to 'out'
    // If target is artefact, default to 'in'
    currentEdgeType.value = sourceType === 'artefact' ? 'out' : 'in'
  } else {
    // Non-artefact elements default to 'flow'
    currentEdgeType.value = 'flow'
  }
  
  pendingConnection.value = connection
  showEdgeModal.value = true
}

const saveEdgeType = () => {
  if (pendingConnection.value) {
    // Validate relation type rules
    const sourceNode = nodes.value.find(n => n.id === pendingConnection.value!.source)
    const targetNode = nodes.value.find(n => n.id === pendingConnection.value!.target)
    
    if (sourceNode && targetNode) {
      const sourceType = sourceNode.data.type || 'action'
      const targetType = targetNode.data.type || 'action'
      const isArtefactInvolved = sourceType === 'artefact' || targetType === 'artefact'
      const isArtefactRelationType = currentEdgeType.value === 'in' || currentEdgeType.value === 'out'
      
      // Validation: artefacts can only use 'in'/'out', others cannot use 'in'/'out'
      if (isArtefactInvolved && !isArtefactRelationType) {
        alert('Artefact elements can only use "In" or "Out" relation types.')
        return
      }
      
      if (!isArtefactInvolved && isArtefactRelationType) {
        alert('Only artefact elements can use "In" and "Out" relation types.')
        return
      }
    }
    
    const newEdge: Edge = {
      id: generateId(),
      source: pendingConnection.value.source!,
      target: pendingConnection.value.target!,
      sourceHandle: pendingConnection.value.sourceHandle,
      targetHandle: pendingConnection.value.targetHandle,
      type: 'default',
      data: { relationType: currentEdgeType.value },
      label: currentEdgeType.value.toUpperCase(),
      style: getEdgeStyle(currentEdgeType.value)
    }
    edges.value.push(newEdge)
  }
  closeEdgeModal()
}

const closeEdgeModal = () => {
  showEdgeModal.value = false
  pendingConnection.value = null
  currentEdgeType.value = 'flow'
}

// Double click handlers
const onNodeDoubleClick = (event: any) => {
  editNode(event.node.id)
}

const onEdgeDoubleClick = (event: any) => {
  const edge = event.edge
  currentEdgeType.value = edge.data?.relationType || 'flow'
  pendingConnection.value = { source: edge.source, target: edge.target }
  
  // Remove existing edge and show modal for re-configuration
  edges.value = edges.value.filter(e => e.id !== edge.id)
  showEdgeModal.value = true
}

// Change tracking functions
const saveInitialState = () => {
  initialState.value = {
    templateData: {
      name: templateData.value.name,
      description: templateData.value.description,
      startingElementIds: [...templateData.value.startingElementIds]
    },
    nodes: nodes.value.map(node => ({
      ...node,
      data: { ...node.data },
      position: { ...node.position }
    })),
    edges: edges.value.map(edge => ({
      ...edge,
      data: edge.data ? { ...edge.data } : undefined
    }))
  }
}

const resetChanges = () => {
  if (!initialState.value) return
  
  // Reset template data
  templateData.value.name = initialState.value.templateData.name
  templateData.value.description = initialState.value.templateData.description
  templateData.value.startingElementIds = [...initialState.value.templateData.startingElementIds]
  
  // Reset nodes and edges
  nodes.value = initialState.value.nodes.map(node => ({
    ...node,
    data: { ...node.data },
    position: { ...node.position }
  }))
  
  edges.value = initialState.value.edges.map(edge => ({
    ...edge,
    data: edge.data ? { ...edge.data } : undefined
  }))
  
  nodeCounter.value = initialState.value.nodes.length
}

// Cleanup event listeners
onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnOutsideClick)
})

// Convert visual editor data back to template format
const convertToTemplate = (): FlowTemplate => {
  // Convert nodes back to elements
  // IMPORTANT: Use node.id consistently since that's what edges reference
  const elements: ElementTemplate[] = reactiveNodes.value.map(node => ({
    id: node.id, // Always use node.id to match edge references
    name: node.data.name || '',
    description: node.data.description || '',
    ownerId: node.data.ownerId || null,
    teamId: node.data.teamId || null,
    durationDays: node.data.durationDays || null,
    type: node.data.type || 'action'
  }))
  
  // Group edges by source and type, but preserve handle information
  const relationGroups = new Map<string, { 
    fromElementIds: string[], 
    toElementIds: string[], 
    type: 'flow' | 'or' | 'and' | 'in' | 'out',
    connections: Array<{
      fromElementId: string;
      toElementId: string;
      sourceHandle?: string;
      targetHandle?: string;
    }>
  }>()
  
  edges.value.forEach(edge => {
    const type = (edge.data?.relationType || 'flow') as 'flow' | 'or' | 'and' | 'in' | 'out'
    const groupKey = `${edge.source}-${type}`
    
    if (!relationGroups.has(groupKey)) {
      relationGroups.set(groupKey, {
        fromElementIds: [edge.source],
        toElementIds: [],
        type,
        connections: []
      })
    }
    
    const group = relationGroups.get(groupKey)!
    group.toElementIds.push(edge.target)
    group.connections.push({
      fromElementId: edge.source,
      toElementId: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined
    })
  })
  
  // Convert grouped relations to final format with preserved handle info
  const relations: Relation[] = Array.from(relationGroups.values()).map(group => ({
    id: generateId(),
    fromElementIds: group.fromElementIds,
    toElementIds: group.toElementIds,
    type: group.type,
    connections: group.connections
  }))
  
  // Create layout object from current node positions
  const layout: { [elementId: string]: { x: number; y: number } } = {}
  reactiveNodes.value.forEach(node => {
    layout[node.id] = {
      x: node.position.x,
      y: node.position.y
    }
  })

  const template = {
    id: props.template?.id || generateId(),
    name: templateData.value.name,
    description: templateData.value.description,
    elements,
    relations,
    startingElementIds: templateData.value.startingElementIds,
    layout
  }
  
  return template
}

// Save flow
const saveTemplate = () => {
  if (!templateData.value.name.trim()) {
    alert('Please enter a flow name in the field above')
    return
  }

  try {
    const template = convertToTemplate()
    emit('save', template)
    
    // Update initial state to reflect saved state
    nextTick(() => {
      saveInitialState()
    })
  } catch (error) {
    console.error('Error converting flow:', error)
    alert('Error creating flow. Please check the console for details.')
  }
}
</script>

<style scoped>
.flow-editor {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 0;
  border: none;
  box-shadow: none;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 110;
  min-height: 60px;
}

.editor-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.header-controls {
  display: flex;
  gap: 0.5rem;
}

.template-info {
  padding: 0.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 100;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 1rem;
  align-items: start;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: #475569;
  font-size: 0.8rem;
}

.form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 1);
}

.textarea-compact {
  resize: vertical;
  min-height: 60px;
  max-height: 80px;
  line-height: 1.4;
}

.layout-info {
  justify-self: end;
  text-align: right;
}

/* Starting Elements Control */
.starting-elements-control {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.no-elements-message {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  color: #64748b;
  text-align: center;
  font-style: italic;
  font-size: 0.75rem;
}

/* Multi-Select Dropdown */
.multi-select-wrapper {
  position: relative;
  z-index: 1000;
}

.multi-select-dropdown {
  position: relative;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.multi-select-dropdown.compact .selected-display {
  min-height: 36px;
  padding: 0.5rem 0.75rem;
}

.multi-select-dropdown:hover {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.multi-select-dropdown.open {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  position: relative;
  z-index: 1001;
}

.selected-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  min-height: 42px;
}

.placeholder {
  color: #9ca3af;
  font-size: 0.875rem;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.remove-tag-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.remove-tag-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.dropdown-arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: #64748b;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-top: none;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.dropdown-item.selected {
  background: rgba(102, 126, 234, 0.15);
}

.element-icon-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.element-icon-small.element-action {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.element-icon-small.element-state {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.element-icon-small.element-artefact {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.element-info-dropdown {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.element-name {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.element-description {
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.3;
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checkbox-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: #10b981;
}

/* Scrollbar for dropdown */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: rgba(100, 116, 139, 0.1);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.layout-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.layout-mode {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.layout-mode.custom {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.layout-mode.auto {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.flow-canvas {
  flex: 1;
  position: relative;
}

.vue-flow-container {
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
  position: relative;
}

.empty-flow-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 2px dashed rgba(102, 126, 234, 0.3);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  max-width: 400px;
  z-index: 10;
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.8;
  color: #667eea;
}

.empty-icon svg {
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
}

.empty-flow-message h3 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-flow-message p {
  margin: 0.5rem 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Custom Element Node Styles */
.element-node {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  min-width: 200px;
  max-width: 250px;
  transition: all 0.3s ease;
  position: relative;
}

/* Element type-specific styling */
.element-node.element-action {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(21, 128, 61, 0.05) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 8px 32px rgba(34, 197, 94, 0.15);
}

.element-node.element-state {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(2, 132, 199, 0.05) 100%);
  border: 1px solid rgba(14, 165, 233, 0.3);
  box-shadow: 0 8px 32px rgba(14, 165, 233, 0.15);
}

.element-node.element-artefact {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(180, 83, 9, 0.05) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15);
}

.element-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
}

.element-node.editing {
  border-color: #667eea;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
}

.node-header {
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.element-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

/* Element type-specific icon colors */
.element-action .element-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.element-state .element-icon {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.element-artefact .element-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.element-info {
  flex: 1;
  min-width: 0;
}

.element-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  line-height: 1.2;
  word-wrap: break-word;
}

.element-info .description {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.3;
}

.element-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.owner-tag,
.team-tag,
.duration {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1;
}

.owner-tag {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.team-tag {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(126, 34, 206, 0.1) 100%);
  color: #7e22ce;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.duration {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1;
}

.owner-tag svg,
.team-tag svg,
.duration svg,
.type-tag svg {
  flex-shrink: 0;
}

.type-action {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.type-state {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%);
  color: #0284c7;
  border: 1px solid rgba(14, 165, 233, 0.2);
}

.type-artefact {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(180, 83, 9, 0.1) 100%);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.element-edit {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-input {
  padding: 0.5rem;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.9);
}

.duration-input {
  width: 80px;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: flex-end;
}

.btn-small {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-save {
  background: #10b981;
  color: white;
}

.btn-save:hover {
  background: #059669;
}

.btn-cancel {
  background: #ef4444;
  color: white;
}

.btn-cancel:hover {
  background: #dc2626;
}

.node-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon svg {
  transition: all 0.2s ease;
}

.edit-btn {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.edit-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.edit-btn:hover svg {
  transform: rotate(5deg);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

.delete-btn:hover svg {
  transform: scale(1.1);
}

/* Button Styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #0d9488 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-info:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-warning:hover {
  background: linear-gradient(135deg, #e59400 0%, #c2610c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #cbd5e1 0%, #b0bec5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Edge Configuration Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edge-modal {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  min-width: 400px;
  max-width: 500px;
}

.edge-modal h3 {
  margin: 0 0 1.5rem 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.edge-type-info {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.edge-type-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #475569;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .layout-info {
    text-align: left;
  }

  .layout-status {
    justify-content: flex-start;
  }
}
</style>