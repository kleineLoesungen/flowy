<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-container" @click.stop>
      <!-- Header spans full width -->
      <header class="modal-header">
        <h3>{{ template?.name || 'Flow Template' }}</h3>
        <div class="header-actions">
          <button @click="fitToView" class="btn btn-info">
            Fit View
          </button>
          <button @click="reorganizeLayout" class="btn btn-info">
            Auto Layout
          </button>
          <button @click="$emit('close')" class="btn btn-secondary">
            Close
          </button>
        </div>
      </header>

      <!-- Content area with flow and sidebar -->
      <div class="modal-content">
        <!-- Main Flow Area -->
        <div class="flow-content">
          <!-- Vue Flow Viewer -->
          <main class="flow-viewer-main">
        <VueFlow
          :nodes="reactiveNodes"
          :edges="edges"
          @nodes-change="onNodesChange"
          :default-viewport="{ zoom: 1 }"
          :min-zoom="0.2"
          :max-zoom="4"
          class="vue-flow-container"
          :nodes-draggable="true"
          :edges-updatable="false"
          :nodes-connectable="false"
          :elements-selectable="true"
        >
          <Background pattern-color="#aaa" :gap="16" />
          <Controls />
          
          <!-- Empty State Message -->
          <div v-if="nodes.length === 0" class="empty-flow-message">
            <div class="empty-icon">
              <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </div>
            <h3>Empty Flow Template</h3>
            <p>This flow template doesn't have any elements yet.</p>
          </div>
          
          <!-- Custom Element Node (readonly) -->
          <template #node-element="{ data, id }">
            <div class="element-node readonly" :class="`element-${data.type || 'action'}`" :key="`node-${id}-${data.name}-${data.description}-${data.durationDays}`">
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
                <div class="element-info">
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
              </div>
              <!-- Vue Flow handles (for visual consistency) -->
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
          </main>
        </div>
        
        <!-- Right Sidebar with Template Info -->
        <aside class="template-sidebar">
          <div class="sidebar-content">
            <div class="info-item">
              <label>Flow Name</label>
              <div class="info-value">{{ template?.name || 'Unnamed Flow' }}</div>
            </div>
            <div class="info-item">
              <label>Description</label>
              <div class="info-value description-text">{{ template?.description || 'No description' }}</div>
            </div>
            <div class="info-item">
              <label>Starting Elements</label>
              <div class="info-value">
                <div v-if="!template?.startingElementIds?.length" class="no-elements">
                  No starting elements defined
                </div>
                <div v-else class="element-tags">
                  <span 
                    v-for="elementId in template.startingElementIds" 
                    :key="elementId"
                    class="element-tag"
                  >
                    {{ getElementName(elementId) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="info-item">
              <label>Elements</label>
              <div class="info-value element-count">
                <span class="count">{{ template?.elements?.length || 0 }}</span>
                <span class="label">elements</span>
              </div>
            </div>
            <div class="info-item">
              <label>Duration</label>
              <div class="info-value duration-range">
                <span class="duration-number">{{ formatDurationRange(durationRange) }}</span>
                <span class="duration-label">{{ getDurationLabel(durationRange) }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { VueFlow, Handle, Position, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Node, Edge, NodeChange } from '@vue-flow/core'
import type { FlowTemplate } from '../../types/FlowTemplate'
import type { User } from '../../types/User'
import type { Team } from '../../types/Team'
import { calculateFlowDuration, formatDurationRange, getDurationLabel } from '../../utils/flowDurationCalculator'

// Props and emits
const props = defineProps<{
  template: FlowTemplate | null
}>()

const emit = defineEmits<{
  close: []
}>()

// Reactive state
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

// Vue Flow instance
const { fitView } = useVueFlow()

// Force reactivity for Vue Flow
const reactiveNodes = computed(() => {
  return nodes.value.map(node => ({
    ...node,
    data: { ...node.data }
  }))
})

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

const getElementName = (elementId: string): string => {
  const node = nodes.value.find(n => n.id === elementId)
  return node?.data.name || 'Unnamed Element'
}

// Calculate duration range
const durationRange = computed(() => {
  if (!props.template) return { min: 0, max: 0 }
  return calculateFlowDuration(props.template)
})

// Utility function to generate IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Load existing flow into the visual viewer
const loadTemplateIntoViewer = (template: FlowTemplate) => {
  // Clear existing data first
  nodes.value = []
  edges.value = []
  
  if (!template.elements || template.elements.length === 0) {
    return
  }
  
  // Convert elements to nodes using smart layout algorithm
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
      memo.set(nodeId, 0)
      visiting.delete(nodeId)
      return 0
    }
    
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
    const level = maxDistance - distance
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
          { x: 100, y: 100 },
        data: { ...element },
        draggable: true
      })
    })
  } else {
    // Use auto-layout algorithm
    levels.forEach((level, levelIndex) => {
      const levelY = 100 + levelIndex * 180
      const levelWidth = level.length * 280
      const startX = Math.max(50, (800 - levelWidth) / 2)
      
      level.forEach((elementId, nodeIndex) => {
        const element = nodeMap.get(elementId)
        if (element) {
          elementNodes.push({
            id: element.id,
            type: 'element',
            position: { 
              x: startX + nodeIndex * 280, 
              y: levelY 
            },
            data: { ...element },
            draggable: true
          })
        }
      })
    })
  }

  // Convert relations to edges
  const relationEdges: Edge[] = []
  const elementIds = new Set(elements.map(el => el.id))
  
  relations.forEach(relation => {
    relation.fromElementIds.forEach((fromId: string) => {
      relation.toElementIds.forEach((toId: string) => {
        if (elementIds.has(fromId) && elementIds.has(toId)) {
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
            sourceHandle: sourceHandle,
            targetHandle: targetHandle,
            type: 'default',
            data: { relationType: relation.type },
            label: relation.type.toUpperCase(),
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

// Reorganize layout using the same algorithm as loadTemplateIntoViewer
const reorganizeLayout = () => {
  if (!props.template) return
  loadTemplateIntoViewer(props.template)
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

// Vue Flow event handlers (readonly - only position changes allowed, not saved)
const onNodesChange = (changes: NodeChange[]) => {
  changes.forEach(change => {
    if (change.type === 'position' && change.position) {
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        node.position = change.position
      }
    }
    // Ignore other types of changes (remove, select, etc.) or handle them readonly
  })
}

// Initialize data when template changes
watch(() => props.template, (template) => {
  if (template) {
    loadTemplateIntoViewer(template)
  } else {
    nodes.value = []
    edges.value = []
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 10000 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.modal-container {
  width: 90vw;
  height: 90vh;
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  flex-shrink: 0;
  min-height: 60px;
  box-sizing: border-box;
  width: 100%;
}

.modal-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
}

.flow-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.template-sidebar {
  width: 300px;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  overflow-y: auto;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.description-text {
  min-height: 80px !important;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.info-item label {
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
}

.info-value {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #1e293b;
  font-size: 0.875rem;
  min-height: 1rem;
}

.no-elements {
  color: #64748b;
  font-style: italic;
  font-size: 0.8rem;
}

.element-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.element-tag {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.element-count,
.duration-range {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.count,
.duration-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #667eea;
  line-height: 1;
}

.duration-number {
  color: #e67e22;
}

.label,
.duration-label {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
}

.flow-viewer-main {
  flex: 1;
  position: relative;
  min-height: 0;
}

.vue-flow-container {
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
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
  margin: 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

/* Custom Element Node Styles (readonly) */
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
  cursor: move;
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

.element-node.readonly {
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.element-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
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

.readonly-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  font-size: 0.8rem;
  color: #667eea;
  flex-shrink: 0;
}

/* Button Styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
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

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-container {
    height: 95vh;
  }
  
  .modal-content {
    flex-direction: column;
  }
  
  .template-sidebar {
    width: 100%;
    height: 200px;
    border-left: none;
    border-top: 1px solid #e2e8f0;
    border-radius: 0;
  }
  
  .sidebar-content {
    padding: 1rem;
    gap: 1rem;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .info-item {
    flex: 1;
    min-width: 150px;
  }
  
  .modal-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1rem;
  }

  .header-actions {
    justify-content: center;
  }
}
</style>