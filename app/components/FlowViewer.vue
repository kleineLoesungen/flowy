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
            <div class="empty-icon">👁️</div>
            <h3>Empty Flow Template</h3>
            <p>This flow template doesn't have any elements yet.</p>
          </div>
          
          <!-- Custom Element Node (readonly) -->
          <template #node-element="{ data, id }">
            <div class="element-node readonly" :key="`node-${id}-${data.name}-${data.description}-${data.durationDays}`">
              <div class="node-header">
                <div class="element-icon">{{ data.name?.charAt(0) || 'E' }}</div>
                <div class="element-info">
                  <h4>{{ data.name || 'Unnamed Element' }}</h4>
                  <p v-if="data.description && data.description.trim()" class="description">{{ data.description }}</p>
                  <div class="element-meta">
                    <span v-if="data.type" class="type-tag" :class="'type-' + data.type">
                      {{ data.type === 'action' ? '⚡' : data.type === 'state' ? '⭕' : '📄' }} {{ data.type }}
                    </span>
                    <span v-if="data.ownerId" class="owner-tag">
                      👤 {{ getUserName(data.ownerId) }}
                    </span>
                    <span v-if="data.teamId" class="team-tag">
                      👥 {{ getTeamName(data.teamId) }}
                    </span>
                    <span v-if="data.durationDays" class="duration">
                      ⏱️ {{ data.durationDays }} day{{ data.durationDays === 1 ? '' : 's' }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Vue Flow handles (for visual consistency) -->
              <Handle type="target" :position="Position.Top" />
              <Handle type="source" :position="Position.Bottom" />
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
  const calculateDistanceFromEnd = (nodeId: string, memo: Map<string, number> = new Map()): number => {
    if (memo.has(nodeId)) return memo.get(nodeId)!
    
    const outgoing = outgoingEdges.get(nodeId) || []
    if (outgoing.length === 0) {
      memo.set(nodeId, 0)
      return 0
    }
    
    const maxDistanceToEnd = Math.max(...outgoing.map(targetId => calculateDistanceFromEnd(targetId, memo))) + 1
    memo.set(nodeId, maxDistanceToEnd)
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
          relationEdges.push({
            id: generateId(),
            source: fromId,
            target: toId,
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
    and: { stroke: '#27ae60', strokeWidth: 3 }
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
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
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
  display: inline-block;
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
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1;
}

.type-action {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.type-state {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
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