<template>
    <div class="flow-work-editor">
        <div class="work-header">
            <div class="flow-info">
                <h2>{{ flow?.name || 'Flow Work' }}</h2>
                <p v-if="flow?.description" class="flow-description">{{ flow.description }}</p>
                <div class="progress-info">
                    <div class="progress-details">
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: getProgressPercentage() + '%' }"></div>
                        </div>
                        <span class="progress-text">{{ getProgressText() }} completed</span>
                    </div>
                    <div class="date-info">
                        <div v-if="flow?.startedAt" class="date-item">
                            <span class="date-label">Started:</span>
                            <span class="date-value">{{ formatDate(flow.startedAt) }}</span>
                        </div>
                        <div v-if="flow?.expectedEndDate" class="date-item">
                            <span class="date-label">Expected End:</span>
                            <span class="date-value" :class="{ 'overdue': isOverdue() }">{{ formatDate(flow.expectedEndDate) }}</span>
                        </div>
                        <div v-if="flow?.completedAt" class="date-item">
                            <span class="date-label">Completed:</span>
                            <span class="date-value completed">{{ formatDate(flow.completedAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="work-actions">
                <button @click="saveWork" class="btn btn-primary" :disabled="!hasUnsavedChanges">
                    Save Work
                </button>
                <button @click="$emit('close')" class="btn btn-secondary">
                    Close
                </button>
            </div>
        </div>

        <div class="work-content" v-if="localFlow">
            <!-- View Controls -->
            <div class="view-controls">
                <div class="view-toggle">
                    <button 
                        @click="currentView = 'flowchart'"
                        class="view-btn"
                        :class="{ active: currentView === 'flowchart' }"
                    >
                        🔗 Flowchart
                    </button>
                    <button 
                        @click="currentView = 'streams'"
                        class="view-btn"
                        :class="{ active: currentView === 'streams' }"
                    >
                        🌊 Streams
                    </button>
                </div>
            </div>

            <!-- Stream View -->
            <div v-if="currentView === 'streams'" class="streams-container">
                <div class="streams-grid">
                    <div 
                        v-for="(stream, streamIndex) in executionStreams" 
                        :key="'stream-' + streamIndex"
                        class="stream-container"
                        :class="{ 
                            'minimized': hiddenStreams.has(streamIndex),
                            'main-stream': stream.type === 'main',
                            'alternative-stream': stream.type === 'alternative'
                        }"
                    >
                        <div class="stream-header">
                            <div class="stream-title">
                                <h3>{{ getStreamTypeBadge(stream.type) }}</h3>
                                <div class="stream-path-info">
                                    {{ stream.elements.map(e => e.name).join(' → ') }}
                                </div>
                            </div>
                            <div class="stream-controls">
                                <button 
                                    @click="toggleStream(streamIndex)"
                                    class="stream-toggle-btn"
                                >
                                    {{ hiddenStreams.has(streamIndex) ? 'Show' : 'Hide' }}
                                </button>
                            </div>
                        </div>
                        
                        <div v-if="!hiddenStreams.has(streamIndex)" class="stream-elements">
                            <div 
                                v-for="element in stream.elements"
                                :key="element.id"
                                class="element-card"
                                :class="[
                                    'status-' + element.status,
                                    {
                                        'collapsed': !expandedElements.has(element.id),
                                        'in-progress-highlight': element.status === 'in-progress'
                                    }
                                ]"
                            >
                                <div class="element-header" @click="toggleElementExpansion(element.id)">
                                    <div class="element-info">
                                        <div class="header-content">
                                            <div class="element-order">{{ stream.elements.findIndex(el => el.id === element.id) + 1 }}</div>
                                            <svg :class="{
                                                'collapse-icon': true,
                                                'expanded': expandedElements.has(element.id)
                                            }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                            <div class="element-title-section">
                                                <h3>{{ element.name }}</h3>
                                                <div v-if="element.endedAt" class="element-end-date" :class="{ 'overdue-compact': isElementOverdue(element) }">
                                                    Expected: {{ new Date(element.endedAt).toLocaleDateString() }}
                                                </div>
                                            </div>
                                        </div>
                                        <p v-if="element.description && expandedElements.has(element.id)">{{ element.description }}</p>
                                    </div>
                                    <div class="element-status" @click.stop>
                                        <select 
                                            v-model="element.status" 
                                            @change="updateElementStatus(element)"
                                            class="status-select"
                                            :class="'select-' + element.status"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="blocked">Blocked</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Collapsible Content -->
                                <div v-show="expandedElements.has(element.id)" class="element-details">
                                    <div class="element-meta" v-if="element.ownerId">
                                        <span v-if="element.ownerId" class="owner-tag">
                                            👤 {{ getUserName(element.ownerId) }}
                                        </span>
                                    </div>

                                    <div class="element-timestamps">
                                        <div v-if="element.startedAt" class="timestamp started">
                                            <span class="label">Started:</span>
                                            <span class="value">{{ formatTimestamp(element.startedAt) }}</span>
                                        </div>
                                        <div v-if="element.endedAt" class="timestamp expected">
                                            <span class="label">Expected End:</span>
                                            <span class="value" :class="{ 'overdue-element': isElementOverdue(element) }">{{ new Date(element.endedAt).toLocaleDateString() }}</span>
                                        </div>
                                        <div v-if="element.completedAt" class="timestamp completed">
                                            <span class="label">Completed:</span>
                                            <span class="value">{{ formatTimestamp(element.completedAt) }}</span>
                                        </div>
                                    </div>

                                    <div class="element-comments">
                                        <h4>Comments</h4>
                                        <div class="comments-list">
                                            <div 
                                                v-for="comment in element.comments" 
                                                :key="comment.timestamp"
                                                class="comment"
                                            >
                                                <div class="comment-header">
                                                    <span class="comment-author">{{ getUserName(comment.userId) }}</span>
                                                    <span class="comment-time">{{ formatTimestamp(comment.timestamp) }}</span>
                                                </div>
                                                <p class="comment-text">{{ comment.comment }}</p>
                                            </div>
                                        </div>
                                        
                                        <div class="add-comment">
                                            <textarea
                                                v-model="newComments[element.id]"
                                                placeholder="Add a comment..."
                                                class="comment-input"
                                                rows="3"
                                            ></textarea>
                                            <button 
                                                @click="addComment(element.id)"
                                                :disabled="!newComments[element.id]?.trim()"
                                                class="btn btn-comment"
                                            >
                                                Add Comment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Flow } from '../../types/Flow'
import type { Element } from '../../types/Element'
import type { User } from '../../types/User'

interface Props {
    flow: Flow | null
}

const props = defineProps<Props>()

defineEmits<{
    close: []
    save: [flow: Flow]
}>()

// Reactive state
const localFlow = ref<Flow | null>(null)
const hasUnsavedChanges = ref(false)
const users = ref<User[]>([])
const newComments = ref<Record<string, string>>({})
const expandedElements = ref<Set<string>>(new Set())
const hiddenStreams = ref<Set<number>>(new Set())
const currentView = ref<'flowchart' | 'streams'>('streams')

// Current user (in a real app, this would come from auth)
// For now, use the first user ID we have available
const currentUserId = computed(() => {
    return users.value.length > 0 ? users.value[0]?.id || 'unknown-user' : 'unknown-user'
})

// Methods - Define early so they can be used in watchers
const initializeFlowProgress = (flow: Flow) => {
    // Use explicit starting element if defined, otherwise fall back to flow analysis
    let startingElementIds: string[] = []
    
    if (flow.startingElementId) {
        startingElementIds = [flow.startingElementId]
    } else {
        // Build incoming edges map to find starting elements
        const incomingEdges = new Map<string, string[]>()
        
        // Initialize incoming edges for all elements
        flow.elements.forEach(el => {
            incomingEdges.set(el.id, [])
        })
        
        // Populate incoming edge relationships from relations
        flow.relations.forEach(relation => {
            relation.fromElementIds.forEach(fromId => {
                relation.toElementIds.forEach(toId => {
                    // toId has an incoming edge from fromId
                    incomingEdges.get(toId)?.push(fromId)
                })
            })
        })
        
        // Find starting elements (elements with no incoming edges)
        const inferredStartingElements = flow.elements.filter(el => 
            (incomingEdges.get(el.id) || []).length === 0
        )
        
        startingElementIds = inferredStartingElements.map(el => el.id)
    }
    
    // If still no starting elements found, take first element
    if (startingElementIds.length === 0 && flow.elements.length > 0) {
        const firstElement = flow.elements[0]
        if (firstElement) {
            startingElementIds = [firstElement.id]
        }
    }
    
    // Find and set starting elements as in-progress
    const elementsToStart = flow.elements.filter(el => 
        startingElementIds.includes(el.id)
    )
    
    elementsToStart.forEach(element => {
        if (element.status === 'pending') {  // Only change if currently pending
            element.status = 'in-progress'
            element.startedAt = Date.now()
        }
    })
    
    hasUnsavedChanges.value = true
}

const toggleElementExpansion = (elementId: string) => {
    if (expandedElements.value.has(elementId)) {
        expandedElements.value.delete(elementId)
    } else {
        expandedElements.value.add(elementId)
    }
}

const toggleStream = (streamIndex: number) => {
    if (hiddenStreams.value.has(streamIndex)) {
        hiddenStreams.value.delete(streamIndex)
    } else {
        hiddenStreams.value.add(streamIndex)
    }
}

// Flowchart event handlers
const onFlowchartElementClick = (element: Element) => {
    // Toggle expansion when clicking on an element in flowchart
    toggleElementExpansion(element.id)
}

const onFlowchartElementDoubleClick = (element: Element) => {
    // Double-click to expand element details in flowchart
    if (!expandedElements.value.has(element.id)) {
        expandedElements.value.add(element.id)
    }
}

const onFlowchartStatusChange = (elementId: string, status: string) => {
    if (!localFlow.value) return
    
    const element = localFlow.value.elements.find(el => el.id === elementId)
    if (element) {
        element.status = status as any
        updateElementStatus(element)
    }
}

const onLayoutChange = (nodes: any[], edges: any[]) => {
    if (!localFlow.value) return
    
    // Save layout positions
    const positions: Record<string, { x: number; y: number }> = {}
    nodes.forEach(node => {
        positions[node.id] = node.position
    })
    
    if (!localFlow.value.layout) {
        localFlow.value.layout = {}
    }
    (localFlow.value.layout as any).positions = positions
    
    hasUnsavedChanges.value = true
}

// Computed properties
const sortedElements = computed(() => {
    if (!localFlow.value) return []
    
    const elements = [...localFlow.value.elements]
    const relations = localFlow.value.relations
    
    // Build forward flow graph (from -> to relationships)
    const outgoingEdges = new Map<string, string[]>()
    const incomingEdges = new Map<string, string[]>()
    
    // Initialize maps for all elements
    elements.forEach(el => {
        outgoingEdges.set(el.id, [])
        incomingEdges.set(el.id, [])
    })
    
    // Populate flow relationships based on relations
    relations.forEach(relation => {
        relation.fromElementIds.forEach(fromId => {
            relation.toElementIds.forEach(toId => {
                // fromId flows TO toId
                outgoingEdges.get(fromId)?.push(toId)
                incomingEdges.get(toId)?.push(fromId)
            })
        })
    })
    
    // Get starting elements (explicit or inferred)
    let startingElementIds: string[] = []
    
    if (localFlow.value.startingElementId) {
        startingElementIds = [localFlow.value.startingElementId]
    } else {
        // Infer starting elements: elements with no incoming edges
        startingElementIds = elements
            .filter(el => (incomingEdges.get(el.id) || []).length === 0)
            .map(el => el.id)
    }
    
    // If still no starting elements, use first element
    if (startingElementIds.length === 0 && elements.length > 0) {
        const firstElement = elements[0]
        if (firstElement) {
            startingElementIds = [firstElement.id]
        }
    }
    
    // Perform flow-based topological sort starting from starting elements
    const visited = new Set<string>()
    const sorted: Element[] = []
    const processing = new Set<string>()
    
    const visit = (elementId: string) => {
        if (processing.has(elementId)) {
            // Cycle detected - skip to avoid infinite loop
            return
        }
        
        if (visited.has(elementId)) return
        
        processing.add(elementId)
        visited.add(elementId)
        
        // Add current element to sorted list
        const element = elements.find(el => el.id === elementId)
        if (element) {
            sorted.push(element)
        }
        
        // Visit all elements that this element flows to
        const nextElements = outgoingEdges.get(elementId) || []
        
        // Sort next elements by their current status to prioritize in-progress elements
        const nextElementsSorted = nextElements
            .map(id => elements.find(el => el.id === id))
            .filter(Boolean)
            .sort((a, b) => {
                const statusOrder: Record<string, number> = { 
                    'in-progress': 0, 'pending': 1, 'blocked': 2, 'completed': 3, 'aborted': 4 
                }
                return (statusOrder[a!.status] || 999) - (statusOrder[b!.status] || 999)
            })
            .map(el => el!.id)
        
        nextElementsSorted.forEach(nextId => visit(nextId))
        
        processing.delete(elementId)
    }
    
    // Start with starting elements, sorted by status
    const startingElements = startingElementIds
        .map(id => elements.find(el => el.id === id))
        .filter(Boolean)
        .sort((a, b) => {
            const statusOrder: Record<string, number> = { 
                'in-progress': 0, 'pending': 1, 'blocked': 2, 'completed': 3, 'aborted': 4 
            }
            return (statusOrder[a!.status] || 999) - (statusOrder[b!.status] || 999)
        })
    
    // Visit starting elements first
    startingElements.forEach(el => visit(el!.id))
    
    // Visit any remaining unvisited elements (disconnected elements)
    elements.forEach(el => {
        if (!visited.has(el.id)) {
            visit(el.id)
        }
    })
    
    return sorted
})

// Stream visualization computed property for end-to-end execution paths
const executionStreams = computed(() => {
    if (!localFlow.value) return []

    interface ExecutionStream {
        type: 'main' | 'alternative'
        elements: Element[]
        relationInfo?: string
    }

    const streams: ExecutionStream[] = []
    const elements = [...localFlow.value.elements]
    const relations = localFlow.value.relations

    // Build relation maps
    const outgoingRelations = new Map<string, Array<{toIds: string[], type: string}>>()
    const incomingRelations = new Map<string, Array<{fromIds: string[], type: string}>>()

    elements.forEach(el => {
        outgoingRelations.set(el.id, [])
        incomingRelations.set(el.id, [])
    })

    relations.forEach(relation => {
        relation.fromElementIds.forEach(fromId => {
            outgoingRelations.get(fromId)?.push({
                toIds: relation.toElementIds,
                type: relation.type
            })
        })
        
        relation.toElementIds.forEach(toId => {
            incomingRelations.get(toId)?.push({
                fromIds: relation.fromElementIds,
                type: relation.type
            })
        })
    })

    // Find starting elements (no incoming relations)
    let startingElementIds: string[] = []
    if (localFlow.value.startingElementId) {
        startingElementIds = [localFlow.value.startingElementId]
    } else {
        startingElementIds = elements
            .filter(el => (incomingRelations.get(el.id) || []).length === 0)
            .map(el => el.id)
    }
    if (startingElementIds.length === 0 && elements.length > 0) {
        startingElementIds = [elements[0]!.id]
    }

    // Find end elements (no outgoing relations)
    const endElementIds = elements
        .filter(el => (outgoingRelations.get(el.id) || []).length === 0)
        .map(el => el.id)

    // Generate all possible end-to-end paths
    const generateEndToEndPaths = (): Element[][] => {
        const allPaths: Element[][] = []

        const findPaths = (currentPath: Element[], currentElementId: string, visited: Set<string>) => {
            // Prevent infinite loops
            if (visited.has(currentElementId)) return

            const element = elements.find(el => el.id === currentElementId)
            if (!element) return

            const newPath = [...currentPath, element]
            const newVisited = new Set([...visited, currentElementId])

            // Check if this is an end element
            const outgoing = outgoingRelations.get(currentElementId) || []
            if (outgoing.length === 0 || endElementIds.includes(currentElementId)) {
                // This is an end-to-end path
                allPaths.push(newPath)
                return
            }

            // Continue exploring outgoing paths
            outgoing.forEach(rel => {
                rel.toIds.forEach(toId => {
                    findPaths(newPath, toId, newVisited)
                })
            })
        }

        // Start path discovery from each starting element
        startingElementIds.forEach(startId => {
            findPaths([], startId, new Set())
        })

        return allPaths
    }

    const endToEndPaths = generateEndToEndPaths()

    // Find the main path (longest path or first complete path)
    let mainPath: Element[] = []
    if (endToEndPaths.length > 0) {
        // Use the longest path as the main path
        mainPath = endToEndPaths.reduce((longest, current) => 
            current.length > longest.length ? current : longest
        )
    }

    // Create main stream
    if (mainPath.length > 0) {
        streams.push({
            type: 'main',
            elements: mainPath,
            relationInfo: 'Main Execution Path'
        })
    }

    // Create alternative streams that include the main path plus alternatives
    endToEndPaths.forEach((path, index) => {
        // Skip if this is already the main path
        if (path === mainPath) return

        // Create an alternative stream that includes main path elements plus this alternative
        const mainElementIds = new Set(mainPath.map(el => el.id))
        const alternativeElements = path.filter(el => !mainElementIds.has(el.id))

        if (alternativeElements.length > 0) {
            // Merge main path with alternative elements in logical order
            const mergedPath: Element[] = []
            const usedElements = new Set<string>()

            // Add elements in execution order, preferring main path
            const allElements = [...mainPath, ...alternativeElements]
            
            // Sort by execution order based on relations
            const addElementInOrder = (elementId: string) => {
                if (usedElements.has(elementId)) return

                const element = allElements.find(el => el.id === elementId)
                if (!element) return

                // Check prerequisites first
                const incoming = incomingRelations.get(elementId) || []
                incoming.forEach(rel => {
                    rel.fromIds.forEach(fromId => {
                        if (allElements.some(el => el.id === fromId) && !usedElements.has(fromId)) {
                            addElementInOrder(fromId)
                        }
                    })
                })

                if (!usedElements.has(elementId)) {
                    mergedPath.push(element)
                    usedElements.add(elementId)
                }
            }

            // Start with starting elements and build forward
            allElements.forEach(el => addElementInOrder(el.id))

            streams.push({
                type: 'alternative',
                elements: mergedPath,
                relationInfo: `Alternative Path ${index + 1} (with Main Path)`
            })
        }
    })

    // If no alternative paths, ensure we have at least the main stream
    if (streams.length === 0 && elements.length > 0) {
        streams.push({
            type: 'main',
            elements: elements,
            relationInfo: 'All Elements'
        })
    }

    return streams
})

// Watchers
watch(() => props.flow, (newFlow) => {
    if (newFlow) {
        localFlow.value = JSON.parse(JSON.stringify(newFlow))
        
        // Check if this is a new flow (all elements are pending)
        const isNewFlow = newFlow.elements.every(el => el.status === 'pending')
        
        if (isNewFlow) {
            // Set first elements as in-progress based on flow structure
            initializeFlowProgress(localFlow.value!)
        }
        
        hasUnsavedChanges.value = false
        
        // Initialize comment inputs
        newComments.value = {}
        newFlow.elements.forEach(element => {
            newComments.value[element.id] = ''
        })
        
        // Set expanded state: only in-progress elements are open, all others closed
        const elementsToExpand = newFlow.elements.filter(el => 
            el.status === 'in-progress'
        )
        
        expandedElements.value = new Set(
            elementsToExpand.map(el => el.id)
        )
    }
}, { immediate: true })

// Additional Methods
const updateElementStatus = (element: Element) => {
    const now = Date.now()
    
    if (element.status === 'in-progress' && !element.startedAt) {
        element.startedAt = now
    } else if (element.status === 'completed' && !element.completedAt) {
        element.completedAt = now
    } else if (element.status === 'pending') {
        element.startedAt = null
        element.completedAt = null
    }
    
    hasUnsavedChanges.value = true
}

const addComment = (elementId: string) => {
    const commentText = newComments.value[elementId]?.trim()
    if (!commentText || !localFlow.value) return
    
    const element = localFlow.value.elements.find(el => el.id === elementId)
    if (!element) return
    
    element.comments.push({
        timestamp: Date.now(),
        comment: commentText,
        userId: currentUserId.value
    })
    
    newComments.value[elementId] = ''
    hasUnsavedChanges.value = true
}

const saveWork = async () => {
    if (!localFlow.value || !hasUnsavedChanges.value) return
    
    try {
        const response = await fetch(`/api/flows/${localFlow.value.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(localFlow.value)
        })
        
        if (!response.ok) {
            throw new Error('Failed to save work')
        }
        
        hasUnsavedChanges.value = false
        console.log('Work saved successfully')
    } catch (error) {
        console.error('Error saving work:', error)
    }
}

const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
}

const isOverdue = (): boolean => {
    if (!localFlow.value?.expectedEndDate) return false
    const today = new Date()
    const expectedEnd = new Date(localFlow.value.expectedEndDate)
    return today > expectedEnd && !localFlow.value.completedAt
}

const isElementOverdue = (element: Element): boolean => {
    if (!element.endedAt || element.completedAt) return false
    const today = new Date()
    const expectedEnd = new Date(element.endedAt)
    return today > expectedEnd
}

const getProgressPercentage = (): number => {
    if (!localFlow.value || localFlow.value.elements.length === 0) return 0
    const completed = localFlow.value.elements.filter(el => el.status === 'completed').length
    return Math.round((completed / localFlow.value.elements.length) * 100)
}

const getProgressText = (): string => {
    if (!localFlow.value) return '0/0'
    const completed = localFlow.value.elements.filter(el => el.status === 'completed').length
    const total = localFlow.value.elements.length
    return `${completed}/${total}`
}

const getUserName = (userId: string): string => {
    const user = users.value.find(u => u.id === userId)
    return user?.name || 'Unknown User'
}



// Stream visualization helper methods
const getStreamTitle = (stream: any): string => {
    if (stream.relationInfo) return stream.relationInfo
    if (stream.type === 'main') return 'Main Flow'
    if (stream.type === 'or') return 'Alternative Path'
    if (stream.type === 'and') return 'Parallel Path'
    return 'Flow Path'
}

const getStreamTypeBadge = (type: string): string => {
    switch (type) {
        case 'main': return '🌊 Main Path'
        case 'alternative': return '🔀 Alternative'
        default: return '➡️ Path'
    }
}

// Load users and teams on mount
onMounted(async () => {
    try {
        const usersResponse = await fetch('/api/users')
        
        if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            users.value = usersData.data || []
        }
    } catch (error) {
        console.error('Error loading users/teams:', error)
    }
})
</script>

<style scoped>
.flow-work-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.work-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
}

.flow-info h2 {
    margin: 0 0 0.5rem 0;
    color: #2d3748;
    font-size: 1.5rem;
    font-weight: 600;
}

.flow-description {
    margin: 0 0 1rem 0;
    color: #64748b;
    line-height: 1.5;
}

.progress-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.progress-details {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.progress-bar {
    width: 200px;
    height: 8px;
    background: rgba(100, 116, 139, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    color: #374151;
    font-weight: 500;
    font-size: 0.9rem;
}

.date-info {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.date-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.date-label {
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.date-value {
    color: #374151;
    font-weight: 600;
    font-size: 0.875rem;
}

.date-value.overdue {
    color: #ef4444;
}

.date-value.completed {
    color: #10b981;
}

.work-actions {
    display: flex;
    gap: 1rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    color: #475569;
}

.btn-secondary:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #cbd5e1 0%, #b0bec5 100%);
}

.work-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
}

.elements-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 800px;
    margin: 0 auto;
}

.element-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 1.5rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
}

.element-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
}

.status-pending {
    border-left: 4px solid #64748b;
}

.status-in-progress {
    border-left: 4px solid #f59e0b;
}

.status-completed {
    border-left: 4px solid #10b981;
}

.status-blocked {
    border-left: 4px solid #ef4444;
}

.element-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.element-info h3 {
    margin: 0;
    color: #2d3748;
    font-size: 1.25rem;
    font-weight: 600;
}

.element-info p {
    margin: 0;
    color: #64748b;
    line-height: 1.5;
}

.status-select {
    padding: 0.625rem 1rem 0.625rem 0.75rem;
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    backdrop-filter: blur(10px);
    color: #374151;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.75rem center;
    background-repeat: no-repeat;
    background-size: 1.25em 1.25em;
    padding-right: 2.75rem;
}

.status-select:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.4);
}

.status-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 8px 20px rgba(102, 126, 234, 0.15);
    transform: translateY(-1px);
}

.select-pending {
    border-color: rgba(100, 116, 139, 0.3);
    background: linear-gradient(135deg, rgba(100, 116, 139, 0.05) 0%, rgba(248, 250, 252, 0.95) 100%);
}

.select-pending:hover {
    border-color: rgba(100, 116, 139, 0.5);
    box-shadow: 0 8px 20px rgba(100, 116, 139, 0.15);
}

.select-in-progress {
    border-color: rgba(245, 158, 11, 0.3);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(254, 243, 199, 0.95) 100%);
    color: #92400e;
}

.select-in-progress:hover {
    border-color: rgba(245, 158, 11, 0.5);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.15);
}

.select-completed {
    border-color: rgba(16, 185, 129, 0.3);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(209, 250, 229, 0.95) 100%);
    color: #047857;
}

.select-completed:hover {
    border-color: rgba(16, 185, 129, 0.5);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15);
}

.select-blocked {
    border-color: rgba(239, 68, 68, 0.3);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(254, 226, 226, 0.95) 100%);
    color: #991b1b;
}

.select-blocked:hover {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15);
}

.element-meta {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.owner-tag,
.team-tag {
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.owner-tag {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
    color: #2563eb;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.team-tag {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.element-timestamps {
    margin-bottom: 1.5rem;
}

.timestamp {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(100, 116, 139, 0.1);
    font-size: 0.9rem;
}

.timestamp:last-child {
    border-bottom: none;
}

.timestamp .label {
    color: #64748b;
    font-weight: 500;
}

.timestamp .value {
    color: #374151;
    font-weight: 600;
}

.timestamp.started .label {
    color: #f59e0b;
}

.timestamp.expected .label {
    color: #667eea;
}

.timestamp.completed .label {
    color: #10b981;
}

.overdue-element {
    color: #ef4444 !important;
    font-weight: 700;
}

.element-comments h4 {
    margin: 0 0 1rem 0;
    color: #2d3748;
    font-size: 1rem;
    font-weight: 600;
}

.comments-list {
    margin-bottom: 1rem;
    max-height: 200px;
    overflow-y: auto;
}

.comment {
    background: rgba(248, 250, 252, 0.5);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border: 1px solid rgba(100, 116, 139, 0.1);
}

.comment:last-child {
    margin-bottom: 0;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.comment-author {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
}

.comment-time {
    color: #64748b;
    font-size: 0.8rem;
}

.comment-text {
    margin: 0;
    color: #374151;
    line-height: 1.4;
    font-size: 0.9rem;
}

.add-comment {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.comment-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 8px;
    background: white;
    color: #374151;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.4;
    resize: vertical;
    transition: all 0.3s ease;
}

.comment-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-comment {
    align-self: flex-start;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
}

.btn-comment:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Collapsible Element Styles */
.element-header {
    cursor: pointer;
    transition: all 0.2s ease;
}

.element-header:hover {
    background: rgba(102, 126, 234, 0.05);
}

.header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.element-title-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.element-end-date {
    font-size: 0.75rem;
    color: #667eea;
    font-weight: 500;
}

.element-end-date.overdue-compact {
    color: #ef4444;
    font-weight: 600;
}

.element-order {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.collapse-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #64748b;
    transition: transform 0.2s ease;
    flex-shrink: 0;
}

.collapse-icon.expanded {
    transform: rotate(90deg);
}

.element-card.collapsed {
    opacity: 0.7;
    transform: scale(0.98);
    transition: all 0.3s ease;
}

.element-card.collapsed:hover {
    opacity: 0.9;
    transform: scale(1);
}

.element-card.in-progress-highlight {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
    border-left: 4px solid #667eea;
    transform: scale(1.02);
}

.element-details {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
        overflow: hidden;
    }
    to {
        opacity: 1;
        max-height: 500px;
    }
}

/* Status-based scaling for collapsed elements */
.element-card.collapsed.status-pending,
.element-card.collapsed.status-completed,
.element-card.collapsed.status-blocked {
    transform: scale(0.95);
}

.element-card.status-in-progress {
    transform: scale(1.02);
}

/* Scrollbar styling */
.comments-list::-webkit-scrollbar {
    width: 6px;
}

.comments-list::-webkit-scrollbar-track {
    background: rgba(100, 116, 139, 0.1);
    border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
}

/* View Controls */
.view-controls {
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
}

.view-toggle {
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 0.25rem;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
}

.view-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    background: transparent;
    color: #64748b;
}

.view-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.view-btn:hover:not(.active) {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
}

/* Stream Visualization */
.streams-container {
    max-width: 1200px;
    margin: 0 auto;
}

.streams-grid {
    display: flex;
    gap: 2rem;
    overflow-x: auto;
    padding: 1rem 0;
    min-height: 500px;
}

.execution-stream {
    flex: 0 0 300px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 1.5rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
}

.execution-stream:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
}

.stream-main {
    border-left: 4px solid #667eea;
}

.stream-or {
    border-left: 4px solid #f59e0b;
}

.stream-and {
    border-left: 4px solid #10b981;
}

.stream-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.stream-title {
    margin: 0;
    color: #2d3748;
    font-size: 1rem;
    font-weight: 600;
}

.stream-type-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
}

.badge-main {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    color: #667eea;
}

.badge-or {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
    color: #92400e;
}

.badge-and {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
    color: #047857;
}

.stream-elements {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.stream-element {
    background: rgba(248, 250, 252, 0.7);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    position: relative;
}

.stream-element:hover {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.stream-element.status-pending {
    border-left: 4px solid #64748b;
}

.stream-element.status-in-progress {
    border-left: 4px solid #f59e0b;
    background: rgba(245, 158, 11, 0.05);
}

.stream-element.status-completed {
    border-left: 4px solid #10b981;
    background: rgba(16, 185, 129, 0.05);
}

.stream-element.status-blocked {
    border-left: 4px solid #ef4444;
    background: rgba(239, 68, 68, 0.05);
}

.stream-element.in-progress-highlight {
    border: 2px solid #667eea;
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
    transform: scale(1.02);
}

.stream-element-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.element-order-stream {
    width: 1.5rem;
    height: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.75rem;
    flex-shrink: 0;
}

.element-info-stream {
    flex: 1;
}

.element-info-stream h5 {
    margin: 0;
    color: #2d3748;
    font-size: 0.9rem;
    font-weight: 600;
}

.element-end-date-stream {
    font-size: 0.7rem;
    color: #667eea;
    font-weight: 500;
    margin-top: 0.25rem;
}

.element-end-date-stream.overdue-compact {
    color: #ef4444;
    font-weight: 600;
}

.status-select-stream {
    padding: 0.375rem 0.5rem;
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 6px;
    background: white;
    color: #374151;
    font-weight: 500;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.status-select-stream:hover {
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.stream-element-details {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(100, 116, 139, 0.1);
}

.element-description-stream {
    margin: 0 0 0.5rem 0;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.4;
}

.element-meta-stream {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.owner-tag-stream,
.team-tag-stream {
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 500;
}

.owner-tag-stream {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
    color: #2563eb;
}

.team-tag-stream {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
    color: #059669;
}

.stream-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.5rem 0;
}

.connector-line {
    width: 2px;
    height: 20px;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    border-radius: 1px;
}

.connector-arrow {
    color: #667eea;
    font-weight: bold;
    font-size: 1.2rem;
    margin-top: -2px;
}

/* Flowchart Container Styles */
.flowchart-container {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 12px;
    margin-bottom: 2rem;
    min-height: 600px;
}

/* Stream Container Styles */
.streams-container {
    padding: 1rem;
}

.streams-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.stream-container {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.stream-container.minimized {
    opacity: 0.7;
}

.stream-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.main-stream .stream-header {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.alternative-stream .stream-header {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.main-stream {
    border-color: #2563eb;
    border-width: 2px;
}

.alternative-stream {
    border-color: #059669;
}

.stream-title h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.stream-path-info {
    font-size: 0.875rem;
    opacity: 0.9;
    max-width: 60ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stream-toggle-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.stream-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
}

.stream-elements {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Responsive Design for Streams */
@media (max-width: 768px) {
    .streams-grid {
        flex-direction: column;
        gap: 1rem;
    }
    
    .execution-stream {
        flex: 1 1 auto;
    }
    
    .stream-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .stream-path-info {
        max-width: 100%;
    }
}
</style>