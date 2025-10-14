<template>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
            <div class="modal-header">
                <h2>{{ template?.name }}</h2>
                <button @click="closeModal" class="close-button">
                    <span>×</span>
                </button>
            </div>

            <div class="modal-content">
                <div class="flow-description" v-if="template?.description">
                    <p>{{ template.description }}</p>
                </div>

                <!-- View Toggle -->
                <div class="view-controls">
                    <div class="view-toggle">
                        <button @click="currentView = 'classic'" class="view-btn"
                            :class="{ active: currentView === 'classic' }">
                            📊 Classic View
                        </button>
                        <button @click="currentView = 'flowchart'" class="view-btn"
                            :class="{ active: currentView === 'flowchart' }">
                            🔗 Enhanced Flowchart
                        </button>
                    </div>
                </div>

                <!-- Classic Flow Visualization -->
                <div v-if="currentView === 'classic'" class="flow-visualization">
                    <div v-if="nodes.length === 0" class="empty-flow">
                        <p>No flow items to display</p>
                    </div>

                    <div v-else class="vue-flow-container">
                        <VueFlow :nodes="nodes" :edges="edges" :fit-view-on-init="true" :nodes-draggable="true"
                            :nodes-connectable="false" :elements-selectable="true" class="vue-flow"
                            @nodes-change="onNodesChange">
                            <Background pattern-color="#f1f5f9" />
                            <Controls />

                            <template #node-element="{ data }">
                                <div class="flow-element-node">
                                    <div class="element-header">
                                        <div class="element-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                                                <path d="M2 17L12 22L22 17" />
                                                <path d="M2 12L12 17L22 12" />
                                            </svg>
                                        </div>
                                        <h4>{{ data.name || 'Unnamed Element' }}</h4>
                                    </div>

                                    <p v-if="data.description && data.description.trim()" class="element-description">
                                        {{ data.description }}
                                    </p>

                                    <div class="element-meta">
                                        <span v-if="data.ownerId" class="owner-tag">
                                            👤 {{ getUserName(data.ownerId) }}
                                        </span>
                                        <span v-if="data.durationDays" class="duration-badge">
                                            ⏱️ {{ data.durationDays }} {{ data.durationDays === 1 ? 'day' : 'days' }}
                                        </span>
                                    </div>
                                </div>
                            </template>
                        </VueFlow>
                    </div>
                </div>

                <!-- Flow Summary -->
                <div class="flow-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-number">{{ template?.elements.length || 0 }}</span>
                            <span class="stat-label">Elements</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">{{ template?.relations.length || 0 }}</span>
                            <span class="stat-label">Connections</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">{{ totalDuration }}</span>
                            <span class="stat-label">Total Days</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Node, Edge, NodeChange } from '@vue-flow/core'
import type { FlowTemplate } from '../../types/FlowTemplate'
import type { User } from '../../types/User'
import { calculateFlowDuration, formatDurationRange } from '../../utils/flowDurationCalculator'

interface Props {
    isOpen: boolean
    template: FlowTemplate | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    close: []
}>()

const closeModal = () => {
    emit('close')
}

// Reactive nodes that can be modified by user interactions
const nodes = ref<Node[]>([])

// Users data
const users = ref<User[]>([])

// Fetch users
const fetchUsers = async () => {
    try {
        const response = await $fetch<{ success: boolean, data: User[] }>('/api/users')
        users.value = response?.data || []
    } catch (error) {
        console.error('Failed to fetch users:', error)
        users.value = []
    }
}

// Helper functions to get display names
const getUserName = (userId: string | null): string => {
    if (!userId) return ''
    const user = users.value.find(u => u.id === userId)
    return user?.name || user?.email || `User ${userId}`
}

// Fetch data on component mount
onMounted(() => {
    fetchUsers()
})

// Handle node changes (like dragging)
const onNodesChange = (changes: NodeChange[]) => {
    changes.forEach(change => {
        if (change.type === 'position' && change.position) {
            const node = nodes.value.find(n => n.id === change.id)
            if (node) {
                node.position = change.position
            }
        }
    })
}

// Function to generate nodes from template
const generateNodesFromTemplate = () => {
    if (!props.template?.elements.length) {
        nodes.value = []
        return
    }

    const elements = props.template.elements
    const relations = props.template.relations || []

    // Create a simple top-to-bottom layout
    // Group elements by their level in the flow
    const nodeMap = new Map(elements.map(el => [el.id, el]))
    const visited = new Set<string>()
    const levels: string[][] = []

    // Find root nodes (nodes with no incoming relations)
    const hasIncoming = new Set<string>()
    relations.forEach(rel => {
        rel.toElementIds.forEach((toId: string) => hasIncoming.add(toId))
    })

    const rootNodes = elements.filter(el => !hasIncoming.has(el.id))

    // If no clear roots, use first element
    if (rootNodes.length === 0 && elements.length > 0 && elements[0]) {
        rootNodes.push(elements[0])
    }

    // Build levels using BFS
    let currentLevel = rootNodes.map(n => n.id)

    while (currentLevel.length > 0) {
        levels.push([...currentLevel])
        currentLevel.forEach(nodeId => visited.add(nodeId))

        const nextLevel = new Set<string>()
        currentLevel.forEach(nodeId => {
            relations.forEach(rel => {
                if (rel.fromElementIds.includes(nodeId)) {
                    rel.toElementIds.forEach((toId: string) => {
                        if (!visited.has(toId) && nodeMap.has(toId)) {
                            nextLevel.add(toId)
                        }
                    })
                }
            })
        })

        currentLevel = Array.from(nextLevel)
    }

    // Add any remaining unvisited nodes to the last level
    const unvisited = elements.filter(el => !visited.has(el.id))
    if (unvisited.length > 0) {
        levels.push(unvisited.map(el => el.id))
    }

    // Convert to nodes with positions
    const newNodes: Node[] = []

    // Check if we have saved layout positions
    const savedLayout = props.template.layout

    if (savedLayout) {
        // Use saved positions
        elements.forEach(element => {
            const savedPosition = savedLayout[element.id]
            newNodes.push({
                id: element.id,
                type: 'element',
                position: savedPosition ?
                    { x: savedPosition.x, y: savedPosition.y } :
                    { x: 100, y: 100 }, // fallback position
                data: element,
                style: {
                    width: '250px',
                }
            })
        })
    } else {
        // Use auto-layout algorithm
        levels.forEach((level, levelIndex) => {
            const levelY = 100 + levelIndex * 180
            const levelWidth = level.length * 280
            const startX = Math.max(50, (800 - levelWidth) / 2) // Center horizontally

            level.forEach((elementId, nodeIndex) => {
                const element = nodeMap.get(elementId)
                if (element) {
                    newNodes.push({
                        id: element.id,
                        type: 'element',
                        position: {
                            x: startX + nodeIndex * 280,
                            y: levelY
                        },
                        data: element,
                        style: {
                            width: '250px',
                        }
                    })
                }
            })
        })
    }

    nodes.value = newNodes
}

// Watch for template changes and regenerate nodes
watch(() => props.template, () => {
    generateNodesFromTemplate()
}, { immediate: true, deep: true })

// Convert template relations to Vue Flow edges
const edges = computed<Edge[]>(() => {
    if (!props.template?.relations?.length) return []

    const edges: Edge[] = []

    props.template.relations.forEach((relation, relationIndex) => {
        relation.fromElementIds.forEach((fromId: string) => {
            relation.toElementIds.forEach((toId: string, targetIndex: number) => {
                edges.push({
                    id: `edge-${relationIndex}-${fromId}-${toId}-${targetIndex}`,
                    source: fromId,
                    target: toId,
                    label: relation.type?.toUpperCase() || 'FLOW',
                    type: 'default',
                    style: {
                        stroke: getEdgeColor(relation.type),
                        strokeWidth: 2,
                    },
                    labelStyle: {
                        fontSize: '12px',
                        fontWeight: '600',
                        fill: '#374151',
                    },
                    labelBgStyle: {
                        fill: '#ffffff',
                        fillOpacity: 0.9,
                    }
                })
            })
        })
    })

    return edges
})

// Get edge color based on relation type
const getEdgeColor = (type?: string) => {
    switch (type) {
        case 'and':
            return '#10b981' // green
        case 'or':
            return '#f59e0b' // amber
        case 'flow':
        default:
            return '#3b82f6' // blue
    }
}



const totalDuration = computed(() => {
    if (!props.template) return '0'
    const duration = calculateFlowDuration(props.template)
    return `${formatDurationRange(duration)} days`
})
</script>

<style scoped>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(102, 126, 234, 0.2);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    width: 90vw;
    max-width: 1000px;
    max-height: 90vh;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    color: white;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.close-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 12px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.close-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05) translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.close-button span {
    font-size: 1.5rem;
    line-height: 1;
}

.modal-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.flow-description {
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
}

.flow-description p {
    margin: 0;
    color: #64748b;
    line-height: 1.6;
    font-size: 1rem;
}

.flow-visualization {
    flex: 1;
    position: relative;
    min-height: 400px;
}

.empty-flow {
    text-align: center;
    padding: 3rem;
    color: #6c757d;
}

.vue-flow-container {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.vue-flow {
    height: 100%;
    width: 100%;
    background-color: #f8fafc;
}

/* Custom node styling */
:deep(.vue-flow__node-element) {
    background: transparent;
    border: none;
    padding: 0;
}

.flow-element-node {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 16px;
    padding: 1.2rem;
    width: 100%;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    transition: all 0.3s ease;
}

.flow-element-node:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.25);
    border-color: rgba(102, 126, 234, 0.4);
    background: rgba(255, 255, 255, 0.95);
}

.element-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.element-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.flow-element-node h4 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.2;
}

.element-description {
    margin: 0.5rem 0;
    color: #6c757d;
    font-size: 0.85rem;
    line-height: 1.3;
}

.element-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.75rem;
}

.owner-tag,
.team-tag,
.duration-badge {
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

.duration-badge {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    color: #667eea;
    border: 1px solid rgba(102, 126, 234, 0.2);
}

.flow-summary {
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-top: 1px solid #e0e0e0;
    flex-shrink: 0;
}

.summary-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1;
}

.stat-label {
    font-size: 0.8rem;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 0.25rem;
}

/* Custom Vue Flow edge styling */
:deep(.vue-flow__edge-default) {
    stroke-width: 2px;
}

:deep(.vue-flow__edge-label) {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 6px;
    padding: 2px 8px;
}

:deep(.vue-flow__controls) {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.vue-flow__controls-button) {
    border: none;
    background: transparent;
    color: #374151;
    font-size: 16px;
}

:deep(.vue-flow__controls-button:hover) {
    background: #f3f4f6;
}

/* Responsive design */
@media (max-width: 768px) {
    .modal-container {
        width: 95vw;
        max-height: 95vh;
    }

    .modal-header {
        padding: 1.5rem;
    }

    .flow-visualization {
        min-height: 300px;
    }

    .flow-element-node {
        padding: 0.75rem;
    }

    .element-icon {
        width: 32px;
        height: 32px;
    }

    .summary-stats {
        gap: 1rem;
    }

    .stat-number {
        font-size: 1.5rem;
    }
}
</style>