<template>
  <div class="flow-work">
    <div class="work-header">
      <h3>{{ isWorking ? 'Work on Flow' : 'View Flow' }}</h3>
      
      <!-- Highlight Filters -->
      <div class="highlight-filters">
        <!-- Team Filter -->
        <div class="filter-dropdown" :class="{ 'is-open': teamDropdownOpen }">
          <button class="dropdown-trigger" @click="toggleTeamDropdown"
            :class="{ 'has-selections': selectedTeamId, 'disabled': filteredTeams.length === 0 }">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path
                d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
            </svg>
            <span>{{ selectedTeamId ? getTeamName(selectedTeamId) : (filteredTeams.length > 0 ? 'Highlight Team' :
              'No Teams') }}</span>
            <svg class="chevron" :class="{ 'rotated': teamDropdownOpen }" width="12" height="12" fill="currentColor"
              viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div v-if="teamDropdownOpen" class="dropdown-panel">
            <div v-if="selectedTeamId" class="dropdown-item clear-item" @click="clearTeamHighlight">
              <span>Clear Team Highlight</span>
            </div>
            <div v-if="filteredTeams.length === 0" class="dropdown-item empty-state">
              <span>No teams found</span>
            </div>
            <div v-for="team in filteredTeams" :key="team.id" class="dropdown-item"
              :class="{ 'selected': selectedTeamId === team.id }" @click="selectTeamHighlight(team.id)">
              <span class="team-name">{{ team.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- User Filter -->
        <div class="filter-dropdown" :class="{ 'is-open': userDropdownOpen }">
          <button class="dropdown-trigger" @click="toggleUserDropdown"
            :class="{ 'has-selections': selectedUserId, 'disabled': filteredUsers.length === 0 }">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
            </svg>
            <span>{{ selectedUserId ? getUserName(selectedUserId) : (filteredUsers.length > 0 ? 'Highlight User' :
              'No Users') }}</span>
            <svg class="chevron" :class="{ 'rotated': userDropdownOpen }" width="12" height="12" fill="currentColor"
              viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div v-if="userDropdownOpen" class="dropdown-panel">
            <div v-if="selectedUserId" class="dropdown-item clear-item" @click="clearUserHighlight">
              <span>Clear User Highlight</span>
            </div>
            <div v-if="filteredUsers.length === 0" class="dropdown-item empty-state">
              <span>No users found</span>
            </div>
            <div v-for="user in filteredUsers" :key="user.id" class="dropdown-item"
              :class="{ 'selected': selectedUserId === user.id }" @click="selectUserHighlight(user.id)">
              <span class="user-name">{{ user.name || 'No Name' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="header-controls">
        <button @click="fitToView" class="btn btn-info">
          Fit View
        </button>
        <button v-if="hasChanges" @click="resetChanges" class="btn btn-warning">
          Reset
        </button>
        <button @click="handleClose" class="btn btn-secondary">
          Close
        </button>
      </div>
    </div>

    <!-- Flow Info (Read-only) -->
    <div class="flow-info">
      <div class="info-row">
        <div class="form-group">
          <label>Flow Name</label>
          <div class="readonly-field">{{ flowData.name }}</div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <div class="readonly-field">{{ flowData.description || 'No description provided' }}</div>
        </div>
        <div class="form-group">
          <label>Started At</label>
          <div class="readonly-field">{{ flowData.startedAt ? formatDate(flowData.startedAt) : 'Not started' }}</div>
        </div>
        <div class="form-group">
          <label>Expected End Date</label>
          <div class="readonly-field">{{ flowData.expectedEndDate ? formatDate(flowData.expectedEndDate) : 'Not set' }}</div>
        </div>
        <div class="form-group">
          <label>Completed At</label>
          <div class="readonly-field">{{ flowData.completedAt ? formatDate(flowData.completedAt) : 'Not completed' }}</div>
        </div>
        <div class="form-group">
          <label>Starting Element</label>
          <div class="readonly-field">{{ getElementName(flowData.startingElementId) || 'Not set' }}</div>
        </div>
      </div>
    </div>

    <!-- Vue Flow Canvas -->
    <div class="flow-canvas">
      <VueFlow :nodes="reactiveNodes" :edges="edges" @nodes-change="onNodesChange" @edges-change="onEdgesChange"
        @connect="onConnect" @node-double-click="onNodeDoubleClick" @edge-double-click="onEdgeDoubleClick"
        :default-viewport="{ zoom: 1 }" :min-zoom="0.2" :max-zoom="4" class="vue-flow-container">
        <template #edge-straight="edgeProps">
          <StraightEdge v-bind="edgeProps" />
        </template>
        <Background pattern-color="#aaa" :gap="16" />
        <Controls />

        <!-- Empty State Message -->
        <div v-if="nodes.length === 0" class="empty-flow-message">
          <div class="empty-icon">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h3>Ready to build your flow!</h3>
          <p>Click the "+ Add Element" button above to start building your flow.</p>
          <p>You can add elements, connect them, and create your workflow visually.</p>
        </div>

        <!-- Custom Element Node -->
        <template #node-element="{ data, id }">
          <div class="element-node" :class="[
            `element-${data.type || 'action'}`,
            data.status && data.type === 'action' ? `element-status-${data.status}` : '',
            { 'team-highlighted': isTeamHighlighted(data) },
            { 'user-highlighted': isUserHighlighted(data) }
          ]" :key="`node-${id}-${data.name}-${data.description}-${data.status}-${(data.consultedUserIds || []).length}`">
            <div class="node-header">
              <div class="element-icon-container">
                <div class="element-icon">
                  <svg v-if="data.type === 'action'" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10h5l-6 6-6-6h5V3h2v7z" />
                  </svg>
                  <svg v-else-if="data.type === 'state'" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                  <svg v-else width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>
                <div v-if="data.expectedEndedAt && data.type === 'action'" class="expected-end-date">
                  {{ formatExpectedEndDate(data.expectedEndedAt) }}
                </div>
              </div>
              <div class="element-info">
                <h4>{{ data.name || 'Unnamed Element' }}</h4>
                <p v-if="data.description && data.description.trim()" class="description">{{ data.description }}</p>
                <div class="element-meta">
                  <!-- Comment count -->
                  <span v-if="data.comments && data.comments.length > 0" class="meta-item comment-count">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    {{ data.comments.length }}
                  </span>
                  <!-- Status for actions -->
                  <span v-if="data.status && data.type === 'action'" class="meta-item status-icon" :class="`status-${data.status}`">
                    <svg v-if="data.status === 'pending'" width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <svg v-else-if="data.status === 'in-progress'" width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <svg v-else-if="data.status === 'completed'" width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <svg v-else-if="data.status === 'aborted'" width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </span>
                  <!-- Owner icon -->
                  <span v-if="data.ownerId" class="meta-item owner-icon">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                    </svg>
                  </span>
                  <!-- Consulted users count -->
                  <span v-if="data.consultedUserIds && data.consultedUserIds.length > 0" class="meta-item consulted-count">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
                    </svg>
                    {{ data.consultedUserIds.length }}
                  </span>
                </div>
              </div>
              <div class="node-actions">
                <button @click="workOnNode(id)" class="btn-icon edit-btn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
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
              <strong>In:</strong> Input connection to an artefact - represents data or resources flowing into the
              artefact
            </p>
            <p v-if="currentEdgeType === 'out'">
              <strong>Out:</strong> Output connection from an artefact - represents data or resources produced by the
              artefact
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
import { StraightEdge } from '@vue-flow/core'
import type { Node, Edge, Connection, NodeChange, EdgeChange, XYPosition } from '@vue-flow/core'
import type { Flow } from '../../../../types/Flow'
import type { Element } from '../../../../types/Element'
import type { Relation } from '../../../../types/Relation'
import type { User } from '../../../../types/User'
import type { Team } from '../../../../types/Team'

// Props and emits
const props = defineProps<{
  flow?: Flow | null
  isWorking: boolean
}>()

const emit = defineEmits<{
  save: [flow: Flow]
  cancel: []
}>()

// Reactive state
const flowData = ref<{ 
  name: string, 
  description: string, 
  startingElementId: string,
  templateId: string,
  startedAt: string | null,
  expectedEndDate: string | null,
  completedAt: string | null 
}>({
  name: '',
  description: '',
  startingElementId: '',
  templateId: '',
  startedAt: null,
  expectedEndDate: null,
  completedAt: null
})

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const nodeCounter = ref(0)

// Vue Flow instance
const { fitView, getViewport, setViewport } = useVueFlow()

// Track if viewport should be restored from URL
const route = useRoute()
const shouldRestoreViewport = computed(() => {
  return !!(route.query.x && route.query.y && route.query.zoom)
})

// Change tracking state
const initialState = ref<{
  flowData: { 
    name: string, 
    description: string, 
    startingElementId: string,
    templateId: string,
    startedAt: string | null,
    expectedEndDate: string | null,
    completedAt: string | null 
  },
  nodes: Node[],
  edges: Edge[]
} | null>(null)

const hasChanges = computed(() => {
  if (!initialState.value) return false

  // Check flow data changes
  const currentFlowData = flowData.value
  const initialFlowData = initialState.value.flowData

  if (currentFlowData.name !== initialFlowData.name ||
    currentFlowData.description !== initialFlowData.description ||
    currentFlowData.startingElementId !== initialFlowData.startingElementId ||
    currentFlowData.templateId !== initialFlowData.templateId ||
    currentFlowData.startedAt !== initialFlowData.startedAt ||
    currentFlowData.expectedEndDate !== initialFlowData.expectedEndDate ||
    currentFlowData.completedAt !== initialFlowData.completedAt) {
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

// Edge configuration state
const showEdgeModal = ref(false)
const currentEdgeType = ref<'flow' | 'or' | 'and' | 'in' | 'out'>('flow')
const pendingConnection = ref<Connection | null>(null)

// Highlight state
const selectedTeamId = ref<string | null>(null)
const selectedUserId = ref<string | null>(null)
const teamDropdownOpen = ref(false)
const userDropdownOpen = ref(false)

// No longer needed - using simple select

// Refs
// Removed nodeEditInput ref - no longer needed

// Users data
const users = ref<User[]>([])
const teams = ref<(Team & { users: User[] })[]>([])

// Fetch users
const fetchUsers = async () => {
  try {
    const response = await $fetch<{ success: boolean, data: User[] }>('/api/users')
    users.value = response?.data || []
  } catch (error) {
    users.value = []
  }
}

// Fetch teams
const fetchTeams = async () => {
  try {
    const response = await $fetch<{ success: boolean, data: (Team & { users: User[] })[] }>('/api/teams')
    teams.value = response?.data || []
  } catch (error) {
    teams.value = []
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchUsers()
  fetchTeams()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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

const formatExpectedEndDate = (timestamp: string | null): string => {
  if (!timestamp) return 'Not set'
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.`
}

// Computed properties for filtered users and teams (only those used in the flow)
const usedUserIds = computed(() => {
  if (!nodes.value.length) return new Set<string>()

  const userIds = new Set<string>()

  nodes.value.forEach(node => {
    const data = node.data

    // Add owner IDs
    if (data.ownerId) {
      userIds.add(data.ownerId)
    }

    // Add consulted user IDs
    if (data.consultedUserIds && Array.isArray(data.consultedUserIds)) {
      data.consultedUserIds.forEach((userId: string) => userIds.add(userId))
    }
  })

  return userIds
})

const usedTeamIds = computed(() => {
  if (!nodes.value.length || !teams.value.length) return new Set<string>()

  const teamIds = new Set<string>()
  const userIds = usedUserIds.value

  // Find teams that contain any of the used users
  teams.value.forEach(team => {
    if (team.users && team.users.some(user => userIds.has(user.id))) {
      teamIds.add(team.id)
    }
  })

  return teamIds
})

const filteredUsers = computed(() => {
  const usedIds = usedUserIds.value
  return users.value.filter(user => usedIds.has(user.id))
})

const filteredTeams = computed(() => {
  const usedIds = usedTeamIds.value
  return teams.value.filter(team => usedIds.has(team.id))
})


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

// Load existing flow into the work interface
const loadFlowIntoWork = (flow: Flow) => {
  // Clear existing data first
  nodes.value = []
  edges.value = []

  // Convert elements to nodes using smart layout algorithm (same as FlowVisualizationModal)
  const elements = flow.elements
  const relations = flow.relations || []

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
  const savedLayout = flow.layout

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
        data: {
          ...element,
          type: element.type || 'action',
          status: element.status,
          completedAt: element.completedAt,
          expectedEndedAt: element.expectedEndedAt,
          consultedUserIds: element.consultedUserIds || []
        }
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
            data: {
              ...element,
              status: element.status,
              completedAt: element.completedAt,
              expectedEndedAt: element.expectedEndedAt,
              consultedUserIds: element.consultedUserIds || []
            }
          })
        }
      })
    })
  }

  // Convert relations to edges
  const relationEdges: Edge[] = []
  const elementIds = new Set(elements.map(el => el.id))

  flow.relations.forEach((relation: Relation) => {
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
              (conn: any) => conn.fromElementId === fromId && conn.toElementId === toId
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
            type: 'straight',
            data: { relationType: relation.type },
            label: relation.type.toUpperCase(),
            labelStyle: {
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748b',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.5px',
            },
            labelBgStyle: {
              fill: '#ffffff',
              stroke: '#cbd5e1',
              strokeWidth: 1,
              fillOpacity: 0.9,
            } as any,
            style: getEdgeStyle(relation.type),
            updatable: false
          })
        }
      })
    })
  })

  // Update reactive data
  nextTick(() => {
    nodes.value = elementNodes
    edges.value = relationEdges
    nodeCounter.value = flow.elements.length

    // Only fit view if viewport parameters are not in the URL (will be restored later)
    if (!shouldRestoreViewport.value) {
      // Fit view to show all elements after a short delay to ensure rendering is complete
      setTimeout(() => {
        fitView({
          padding: 0.1, // 10% padding around elements
          duration: 800, // smooth animation
          maxZoom: 1.5,  // don't zoom in too much
          minZoom: 0.2   // don't zoom out too much
        })
      }, 100)
    }
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
watch(() => [props.flow, props.isWorking] as const, ([flow, isWorking]) => {
  if (flow && isWorking) {
    flowData.value.name = flow.name
    flowData.value.description = flow.description || ''
    flowData.value.startingElementId = flow.startingElementId || ''
    flowData.value.templateId = flow.templateId || ''
    flowData.value.startedAt = flow.startedAt
    flowData.value.expectedEndDate = flow.expectedEndDate
    flowData.value.completedAt = flow.completedAt
    loadFlowIntoWork(flow)

    // Save initial state after loading is complete
    nextTick(() => {
      saveInitialState()

      // Restore viewport from URL parameters if present (after template is loaded)
      if (shouldRestoreViewport.value) {
        const x = route.query.x as string
        const y = route.query.y as string
        const zoom = route.query.zoom as string

        // Restore viewport to the saved position and zoom
        setTimeout(() => {
          setViewport({
            x: parseFloat(x),
            y: parseFloat(y),
            zoom: parseFloat(zoom)
          })

          // Clean up the URL by removing viewport parameters
          const router = useRouter()
          const newQuery = { ...route.query }
          delete newQuery.x
          delete newQuery.y
          delete newQuery.zoom
          router.replace({ query: newQuery })
        }, 50) // Small delay to ensure template is rendered
      }
    })
  } else {
    flowData.value.name = ''
    flowData.value.description = ''
    flowData.value.startingElementId = ''
    flowData.value.templateId = ''
    flowData.value.startedAt = null
    flowData.value.expectedEndDate = null
    flowData.value.completedAt = null
    nodes.value = []
    edges.value = []
    nodeCounter.value = 0

    // Save initial state for new templates
    nextTick(() => {
      saveInitialState()
    })
  }
}, { immediate: true })

// Helper function for element names
const getElementName = (elementId: string): string => {
  const node = nodes.value.find(n => n.id === elementId)
  return node?.data.name || 'Unnamed Element'
}

// Helper function for date formatting
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}



// Reset layout to saved positions from flow data
const reorganizeLayout = () => {
  if (nodes.value.length === 0) return

  // Convert current nodes to a pseudo-template format for layout algorithm
  const elements = nodes.value.map(node => ({
    id: node.id,
    ...node.data
  }))

  // Use current edges to determine relations and flow direction
  const relations: any[] = []
  const connectionInfo = new Map<string, { sourceHandle: string, targetHandle: string }>()

  // Group edges by relation type and analyze connection points
  const edgeGroups: Record<string, { from: string[], to: string[], connections: any[] }> = {}

  edges.value.forEach(edge => {
    const relationType = edge.data?.relationType || 'flow'
    const connectionKey = `${edge.source}-${edge.target}`

    // Store connection handle information
    connectionInfo.set(connectionKey, {
      sourceHandle: edge.sourceHandle || 'bottom-source',
      targetHandle: edge.targetHandle || 'top-target'
    })

    // Group edges by relation type
    const groupKey = relationType
    if (!edgeGroups[groupKey]) {
      edgeGroups[groupKey] = { from: [], to: [], connections: [] }
    }

    // For OR/AND relations, group all edges of the same type together
    if (relationType === 'or' || relationType === 'and') {
      if (!edgeGroups[groupKey].from.includes(edge.source)) {
        edgeGroups[groupKey].from.push(edge.source)
      }
      if (!edgeGroups[groupKey].to.includes(edge.target)) {
        edgeGroups[groupKey].to.push(edge.target)
      }
    } else {
      // For flow relations, create individual relations
      const flowKey = `${relationType}-${Date.now()}-${Math.random()}`
      edgeGroups[flowKey] = {
        from: [edge.source],
        to: [edge.target],
        connections: [{
          fromElementId: edge.source,
          toElementId: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        }]
      }
    }
  })

  // Convert edge groups to relations
  Object.entries(edgeGroups).forEach(([key, group]) => {
    const relationType = key.startsWith('flow-') ? 'flow' : key
    relations.push({
      fromElementIds: group.from,
      toElementIds: group.to,
      type: relationType,
      connections: group.connections
    })
  })

  // Apply improved layout algorithm that respects starting elements and connection points
  const nodeMap = new Map(elements.map(el => [el.id, el]))
  const levels: Array<{ nodes: string[], isHorizontalGroup: boolean, relationType?: string }> = []

  // Build flow direction maps based on connection handles
  const verticalFlow = new Map<string, string[]>() // top-bottom connections (flow direction)
  const horizontalGroups = new Map<string, { nodes: string[], type: string }>() // OR/AND groups

  elements.forEach(el => {
    verticalFlow.set(el.id, [])
  })

  relations.forEach(rel => {
    if (rel.type === 'or' || rel.type === 'and') {
      // OR/AND relations create horizontal groups
      const groupKey = `${rel.type}-${rel.fromElementIds.join('-')}-${rel.toElementIds.join('-')}`
      horizontalGroups.set(groupKey, {
        nodes: [...rel.fromElementIds, ...rel.toElementIds],
        type: rel.type
      })
    } else {
      // Flow relations create vertical connections (top to bottom)
      rel.fromElementIds.forEach((fromId: string) => {
        rel.toElementIds.forEach((toId: string) => {
          if (nodeMap.has(fromId) && nodeMap.has(toId)) {
            // Check connection handles to determine direction
            const connectionKey = `${fromId}-${toId}`
            const connection = connectionInfo.get(connectionKey)

            // If source uses bottom handle or target uses top handle, it's vertical flow
            if (connection &&
              (connection.sourceHandle.includes('bottom') ||
                connection.targetHandle.includes('top'))) {
              const outgoing = verticalFlow.get(fromId) || []
              outgoing.push(toId)
              verticalFlow.set(fromId, outgoing)
            }
          }
        })
      })
    }
  })

  // Simple sequential flow algorithm - create straight top-to-bottom flow
  const createSequentialFlow = (): Map<string, number> => {
    const levels = new Map<string, number>()
    const processed = new Set<string>()

    // Start with designated starting elements
    const queue: Array<{ nodeId: string, level: number }> = []

    // Add starting element at level 0
    if (flowData.value.startingElementId && nodeMap.has(flowData.value.startingElementId)) {
      levels.set(flowData.value.startingElementId, 0)
      processed.add(flowData.value.startingElementId)
      queue.push({ nodeId: flowData.value.startingElementId, level: 0 })
    }

    // If no starting elements defined, find elements with no incoming flow relations
    if (queue.length === 0) {
      const noIncoming = elements.filter(el => {
        return !relations.some(rel =>
          rel.type === 'flow' && rel.toElementIds.includes(el.id)
        )
      })

      noIncoming.forEach(el => {
        levels.set(el.id, 0)
        processed.add(el.id)
        queue.push({ nodeId: el.id, level: 0 })
      })
    }

    // Process queue to build sequential levels
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!

      // Find all direct flow targets from this node, considering connection handles
      relations.forEach(rel => {
        if (rel.type === 'flow' && rel.fromElementIds.includes(nodeId)) {
          rel.toElementIds.forEach((targetId: string) => {
            if (nodeMap.has(targetId) && !processed.has(targetId)) {
              // Check connection handles to determine actual flow direction
              const connection = rel.connections?.find((conn: any) =>
                conn.fromElementId === nodeId && conn.toElementId === targetId
              )

              // Only follow forward flow connections (bottom->top, left->right)
              // Skip reverse connections (top->bottom, right->left)
              if (connection) {
                const isForwardFlow =
                  (connection.sourceHandle?.includes('bottom') && connection.targetHandle?.includes('top')) ||
                  (connection.sourceHandle?.includes('right') && connection.targetHandle?.includes('left')) ||
                  (!connection.sourceHandle || !connection.targetHandle) // Default case

                if (isForwardFlow) {
                  const nextLevel = level + 1
                  levels.set(targetId, nextLevel)
                  processed.add(targetId)
                  queue.push({ nodeId: targetId, level: nextLevel })
                }
              } else {
                // No connection handle info - assume forward flow
                const nextLevel = level + 1
                levels.set(targetId, nextLevel)
                processed.add(targetId)
                queue.push({ nodeId: targetId, level: nextLevel })
              }
            }
          })
        }
      })

      // Also check for reverse flow connections where this node is the target
      relations.forEach(rel => {
        if (rel.type === 'flow' && rel.toElementIds.includes(nodeId)) {
          rel.fromElementIds.forEach((sourceId: string) => {
            if (nodeMap.has(sourceId) && !processed.has(sourceId)) {
              const connection = rel.connections?.find((conn: any) =>
                conn.fromElementId === sourceId && conn.toElementId === nodeId
              )

              // Check for reverse flow connections (top->bottom means source comes after target)
              if (connection) {
                const isReverseFlow =
                  (connection.sourceHandle?.includes('top') && connection.targetHandle?.includes('bottom'))

                if (isReverseFlow) {
                  const nextLevel = level + 1
                  levels.set(sourceId, nextLevel)
                  processed.add(sourceId)
                  queue.push({ nodeId: sourceId, level: nextLevel })
                }
              }
            }
          })
        }
      })
    }

    // Handle any remaining unprocessed nodes (orphans)
    elements.forEach(el => {
      if (!processed.has(el.id) && el.type !== 'artefact') {
        levels.set(el.id, 0)
      }
    })

    return levels
  }

  // Calculate levels for all nodes using sequential flow algorithm
  const nodeLevels = createSequentialFlow()

  // Detect OR/AND groups and create proper branching layout
  const maxLevel = Math.max(...Array.from(nodeLevels.values()), 0)

  // Identify OR/AND groups - elements that should be arranged horizontally
  const orAndGroups = new Map<string, { nodes: Set<string>, type: string, level: number }>()

  relations.forEach(rel => {
    if (rel.type === 'or' || rel.type === 'and') {
      // Group all elements involved in OR/AND relations by their level
      const allElements = [...rel.fromElementIds, ...rel.toElementIds]

      allElements.forEach(elementId => {
        const elementLevel = nodeLevels.get(elementId) || 0
        const groupKey = `${rel.type}-level-${elementLevel}`

        if (!orAndGroups.has(groupKey)) {
          orAndGroups.set(groupKey, {
            nodes: new Set([elementId]),
            type: rel.type,
            level: elementLevel
          })
        } else {
          orAndGroups.get(groupKey)!.nodes.add(elementId)
        }
      })
    }
  })

  // Build levels considering OR/AND groups
  for (let level = 0; level <= maxLevel; level++) {
    const levelNodes = Array.from(nodeLevels.entries())
      .filter(([nodeId, nodeLevel]) => nodeLevel === level)
      .map(([nodeId]) => nodeId)

    if (levelNodes.length === 0) continue

    // Check if any of these nodes are part of an OR/AND group
    let processedNodes = new Set<string>()

    // Process OR/AND groups first
    orAndGroups.forEach((group, groupKey) => {
      if (group.level === level) {
        const groupNodes = Array.from(group.nodes).filter(nodeId =>
          levelNodes.includes(nodeId) && !processedNodes.has(nodeId)
        )

        if (groupNodes.length >= 1) {
          levels.push({
            nodes: groupNodes,
            isHorizontalGroup: true,
            relationType: group.type
          })

          groupNodes.forEach(nodeId => processedNodes.add(nodeId))
        }
      }
    })

    // Add remaining individual nodes
    const remainingNodes = levelNodes.filter(nodeId => !processedNodes.has(nodeId))
    if (remainingNodes.length > 0) {
      levels.push({
        nodes: remainingNodes,
        isHorizontalGroup: false
      })
    }
  }

  // Handle artefacts and side elements (IN/OUT relations)
  const sideElements: string[] = []
  relations.forEach(rel => {
    if (rel.type === 'in' || rel.type === 'out') {
      rel.fromElementIds.forEach((fromId: string) => {
        const element = nodeMap.get(fromId)
        if (element && element.type === 'artefact' && !sideElements.includes(fromId)) {
          sideElements.push(fromId)
        }
      })
    }
  })

  // Position main flow elements in vertical sequence
  const mainFlowX = 400 // Center X position for main flow
  let currentY = 120 // Start Y position
  const verticalSpacing = 220

  levels.forEach((levelGroup, levelIndex) => {
    if (levelGroup.isHorizontalGroup) {
      // Horizontal arrangement for OR/AND groups
      const nonArtefactNodes = levelGroup.nodes.filter(nodeId => {
        const element = nodeMap.get(nodeId)
        return element && element.type !== 'artefact'
      })

      if (nonArtefactNodes.length > 0) {
        const groupWidth = nonArtefactNodes.length * 300
        const startX = mainFlowX - (groupWidth / 2) + 150

        nonArtefactNodes.forEach((nodeId, nodeIndex) => {
          const node = nodes.value.find(n => n.id === nodeId)
          if (node) {
            node.position = {
              x: startX + nodeIndex * 300,
              y: currentY
            }
          }
        })
      }
    } else {
      // Handle single or multiple nodes at the same level
      const nonArtefactNodes = levelGroup.nodes.filter(nodeId => {
        const element = nodeMap.get(nodeId)
        return element && element.type !== 'artefact'
      })

      // For sequential flow, arrange all nodes in a single vertical column
      nonArtefactNodes.forEach((nodeId, nodeIndex) => {
        const node = nodes.value.find(n => n.id === nodeId)
        if (node) {
          node.position = {
            x: mainFlowX, // All nodes in same X column
            y: currentY + (nodeIndex * verticalSpacing) // Separate Y levels for multiple nodes at same level
          }
        }
      })

      // If there are multiple nodes at this level, adjust the next Y position
      if (nonArtefactNodes.length > 1) {
        currentY += (nonArtefactNodes.length - 1) * verticalSpacing
      }
    }

    currentY += verticalSpacing
  })

  // Position side elements (artefacts) to the right of main flow
  sideElements.forEach((elementId, index) => {
    const node = nodes.value.find(n => n.id === elementId)
    if (node) {
      // Find connected element to position artefact next to it
      let connectedY = currentY / 2 // Default middle position

      relations.forEach(rel => {
        if ((rel.type === 'in' || rel.type === 'out') && rel.fromElementIds.includes(elementId)) {
          rel.toElementIds.forEach((targetId: string) => {
            const targetNode = nodes.value.find(n => n.id === targetId)
            if (targetNode) {
              connectedY = targetNode.position.y
            }
          })
        }
      })

      node.position = {
        x: mainFlowX + 400, // Position to the right of main flow
        y: connectedY + (index * 30) // Small offset for multiple artefacts
      }
    }
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

// Node working functions
const workOnNode = async (nodeId: string) => {
  // Navigate to the element work page
  if (props.flow?.id && nodeId) {
    try {
      const router = useRouter()
      
      // Get current viewport state from Vue Flow
      const viewport = getViewport()
      
      await router.push({
        path: `/flows/${props.flow.id}/work/elements/${nodeId}`,
        query: {
          // Preserve current viewport state
          x: viewport.x.toString(),
          y: viewport.y.toString(),
          zoom: viewport.zoom.toString()
        }
      })
    } catch (error) {
      // Navigation failed silently
    }
  }
}

// Removed inline working functions - now using modal routes

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
    }
    // Note: Removed 'remove' handling - elements cannot be deleted in work interface
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
  // Connection creation is disabled - flow structure is read-only during work
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
      type: 'straight',
      data: { relationType: currentEdgeType.value },
      label: currentEdgeType.value.toUpperCase(),
      labelStyle: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#64748b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '0.5px',
      },
      labelBgStyle: {
        fill: '#ffffff',
        stroke: '#cbd5e1',
        strokeWidth: 1,
        fillOpacity: 0.9,
      } as any,
      style: getEdgeStyle(currentEdgeType.value),
      updatable: false
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
  workOnNode(event.node.id)
}

const onEdgeDoubleClick = (event: any) => {
  // Edge editing is disabled - flow structure is read-only during work
}

// Change tracking functions
const saveInitialState = () => {
  initialState.value = {
    flowData: {
      name: flowData.value.name,
      description: flowData.value.description,
      startingElementId: flowData.value.startingElementId,
      templateId: flowData.value.templateId,
      startedAt: flowData.value.startedAt,
      expectedEndDate: flowData.value.expectedEndDate,
      completedAt: flowData.value.completedAt
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
  flowData.value.name = initialState.value.flowData.name
  flowData.value.description = initialState.value.flowData.description
  flowData.value.startingElementId = initialState.value.flowData.startingElementId
  flowData.value.templateId = initialState.value.flowData.templateId
  flowData.value.startedAt = initialState.value.flowData.startedAt
  flowData.value.expectedEndDate = initialState.value.flowData.expectedEndDate
  flowData.value.completedAt = initialState.value.flowData.completedAt

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

// No cleanup needed for simple select dropdown

// Convert visual work data back to Flow format
const convertToFlow = (): Flow => {
  // Convert nodes back to elements
  // IMPORTANT: Use node.id consistently since that's what edges reference
  const elements: Element[] = reactiveNodes.value.map(node => {
    const elementType = node.data.type || 'action'
    return {
      id: node.id, // Always use node.id to match edge references
      name: node.data.name || '',
      description: node.data.description || '',
      ownerId: node.data.ownerId || null,
      type: elementType,
      status: node.data.status || 'pending',
      completedAt: node.data.completedAt || null,
      expectedEndedAt: node.data.expectedEndedAt || null,
      consultedUserIds: node.data.consultedUserIds || [],
      comments: node.data.comments || []
    }
  })

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

  const flow = {
    id: props.flow?.id || generateId(),
    name: flowData.value.name,
    description: flowData.value.description,
    templateId: flowData.value.templateId,
    startedAt: flowData.value.startedAt,
    expectedEndDate: flowData.value.expectedEndDate,
    completedAt: flowData.value.completedAt,
    elements,
    relations,
    startingElementId: flowData.value.startingElementId,
    layout
  }

  return flow
}

// Save flow
const saveFlow = () => {
  if (!flowData.value.name.trim()) {
    alert('Please enter a flow name in the field above')
    return
  }

  try {
    const flow = convertToFlow()
    emit('save', flow)

    // Update initial state to reflect saved state
    nextTick(() => {
      saveInitialState()
    })
  } catch (error) {
    // Silent error handling
  }
}

// Dropdown methods for highlighting
const toggleTeamDropdown = () => {
  if (filteredTeams.value.length === 0) return
  teamDropdownOpen.value = !teamDropdownOpen.value
  if (teamDropdownOpen.value) {
    userDropdownOpen.value = false
  }
}

const toggleUserDropdown = () => {
  if (filteredUsers.value.length === 0) return
  userDropdownOpen.value = !userDropdownOpen.value
  if (userDropdownOpen.value) {
    teamDropdownOpen.value = false
  }
}

// Highlight methods
const selectTeamHighlight = (teamId: string) => {
  selectedTeamId.value = teamId
  selectedUserId.value = null // Clear user highlight when team is selected
  teamDropdownOpen.value = false
}

const clearTeamHighlight = () => {
  selectedTeamId.value = null
  teamDropdownOpen.value = false
}

const selectUserHighlight = (userId: string) => {
  selectedUserId.value = userId
  selectedTeamId.value = null // Clear team highlight when user is selected
  userDropdownOpen.value = false
}

const clearUserHighlight = () => {
  selectedUserId.value = null
  userDropdownOpen.value = false
}

// Highlighting logic
const isTeamHighlighted = (data: any): boolean => {
  if (!selectedTeamId.value) return false

  const team = teams.value.find(t => t.id === selectedTeamId.value)
  if (!team || !team.users) return false

  // Check if element owner is in selected team
  if (data.ownerId) {
    const isOwnerInTeam = team.users.some((user: User) => user.id === data.ownerId)
    if (isOwnerInTeam) return true
  }

  // Check if any consulted users are in selected team
  if (data.consultedUserIds && data.consultedUserIds.length > 0) {
    const hasConsultedInTeam = data.consultedUserIds.some((userId: string) =>
      team.users.some((user: User) => user.id === userId)
    )
    if (hasConsultedInTeam) return true
  }

  return false
}

const isUserHighlighted = (data: any): boolean => {
  if (!selectedUserId.value) return false

  // Check if element owner is selected user
  if (data.ownerId === selectedUserId.value) return true

  // Check if selected user is in consulted users
  if (data.consultedUserIds && data.consultedUserIds.includes(selectedUserId.value)) return true

  return false
}

// Handle click outside dropdowns
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.filter-dropdown')) {
    teamDropdownOpen.value = false
    userDropdownOpen.value = false
  }
}

// Handle close button - navigate to flows page
const handleClose = async () => {
  const router = useRouter()
  await router.push('/flows')
}
</script>

<style scoped>
.flow-work {
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

.work-header {
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

.work-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.header-controls {
  display: flex;
  gap: 0.5rem;
}

/* Highlight Filters */
.highlight-filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.filter-dropdown {
  position: relative;
  z-index: 1000;
}

.filter-dropdown.is-open {
  z-index: 1001;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.dropdown-trigger.has-selections {
  background: rgba(16, 185, 129, 0.3);
  border-color: rgba(16, 185, 129, 0.5);
}

.dropdown-trigger.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.filter-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.chevron {
  width: 12px;
  height: 12px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 200px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.dropdown-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.dropdown-item.selected {
  background: rgba(102, 126, 234, 0.15);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.clear-item {
  color: #ef4444;
  font-weight: 500;
  border-bottom: 2px solid rgba(239, 68, 68, 0.2) !important;
}

.clear-item:hover {
  background: rgba(239, 68, 68, 0.1) !important;
}

.empty-state {
  color: #9ca3af;
  font-style: italic;
  cursor: default;
  text-align: center;
}

.empty-state:hover {
  background: transparent !important;
}

.team-name,
.user-name {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.team-members,
.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Scrollbar for dropdown */
.dropdown-panel::-webkit-scrollbar {
  width: 6px;
}

.dropdown-panel::-webkit-scrollbar-track {
  background: rgba(100, 116, 139, 0.1);
  border-radius: 3px;
}

.dropdown-panel::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.dropdown-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.flow-info {
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

.readonly-field {
  padding: 0.5rem 0.75rem;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 8px;
  color: #475569;
  font-size: 0.8rem;
  min-height: 38px;
  display: flex;
  align-items: center;
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
  width: 250px;
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

/* Status-based element styling (overrides type styling for action elements) */
.element-node.element-status-pending {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.08) 0%, rgba(75, 85, 99, 0.05) 100%);
  border: 1px solid rgba(107, 114, 128, 0.3);
  box-shadow: 0 8px 32px rgba(107, 114, 128, 0.15);
}

.element-node.element-status-in-progress {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
}

.element-node.element-status-completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
}

.element-node.element-status-aborted {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.08) 0%, rgba(239, 68, 68, 0.05) 100%);
  border: 1px solid rgba(248, 113, 113, 0.3);
  box-shadow: 0 8px 32px rgba(248, 113, 113, 0.15);
}

.element-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
}

.element-node.editing {
  border-color: #667eea;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
}

/* Highlighting Styles */
.element-node.team-highlighted {
  border: 4px solid #10b981 !important;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3), 0 8px 32px rgba(16, 185, 129, 0.25) !important;
}

.element-node.user-highlighted {
  border: 4px solid #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(59, 130, 246, 0.25) !important;
}

.node-header {
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.element-icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.expected-end-date {
  font-size: 0.65rem;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
  line-height: 1;
  opacity: 0.8;
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

/* Status-specific icon colors (overrides type colors for action elements) */
.element-status-pending .element-icon {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.element-status-in-progress .element-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.element-status-completed .element-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.element-status-aborted .element-icon {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
}

.element-info {
  flex: 1;
  min-width: 0;
}

.element-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  word-wrap: break-word;
}

.element-info .description {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.3;
}

.element-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 500;
  line-height: 1;
}

.comment-count {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.status-icon.status-pending {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.status-icon.status-in-progress {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-icon.status-completed {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-icon.status-aborted {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.owner-icon {
  background: rgba(168, 85, 247, 0.1);
  color: #9333ea;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.consulted-count {
  background: rgba(168, 85, 247, 0.1);
  color: #9333ea;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.owner-tag,
.duration,
.consulted-users {
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

.consulted-users {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
  color: #9333ea;
  border: 1px solid rgba(168, 85, 247, 0.2);
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
.duration svg,
.consulted-users svg,
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

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1;
}

.status-pending {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.1) 100%);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.status-in-progress {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-aborted {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.2);
}

.completion-date {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1;
  text-transform: capitalize;
}

.status-tag.status-pending {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.status-tag.status-in-progress {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-tag.status-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-tag.status-completed-with-date {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
  font-weight: 500;
}

.status-tag.status-aborted {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.completion-date {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1;
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

.edit-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.2rem;
  margin-top: 0.3rem;
}

.duration-input {
  width: 80px;
}

.consulted-users-select {
  min-height: 60px;
  max-height: 80px;
  overflow-y: auto;
  font-size: 0.75rem;
}

.consulted-users-select option {
  padding: 2px 4px;
}

.consulted-users-select option:checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
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
  .work-header {
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

/* Consulted Users Styles */
.consulted-users-display {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #e3f2fd;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #1565c0;
}

.consulted-users-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-checkbox:hover {
  background-color: #f5f5f5;
}

.user-checkbox input[type="checkbox"] {
  cursor: pointer;
}

/* Vue Flow Edge Styles */
:deep(.vue-flow__edge-straight) {
  stroke-width: 3px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

:deep(.vue-flow__edge-straight path) {
  stroke-width: 3px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Improve text rendering for all Vue Flow elements */
:deep(.vue-flow__node-element),
:deep(.vue-flow__edge),
:deep(.vue-flow__edge-label) {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Subtle edge labels for display */
:deep(.vue-flow__edge-label) {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #64748b !important;
  font-family: system-ui, -apple-system, sans-serif !important;
  letter-spacing: 0.5px !important;
  text-transform: uppercase !important;
}

:deep(.vue-flow__edge-label-bg) {
  fill: rgba(255, 255, 255, 0.9) !important;
  stroke: #cbd5e1 !important;
  stroke-width: 1px !important;
  rx: 4px !important;
  ry: 4px !important;
}

</style>