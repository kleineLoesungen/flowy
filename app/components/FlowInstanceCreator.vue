<template>
    <div class="flow-creator">
        <!-- Step 1: Select Template -->
        <div v-if="currentStep === 1" class="step-content">
            <div class="step-header">
                <h3>Create New Flow Instance</h3>
                <p>Step 1: Select a flow template</p>
            </div>

            <div v-if="templatesLoading" class="loading">
                Loading templates...
            </div>

            <div v-else-if="templatesError" class="error">
                Error loading templates: {{ templatesError }}
            </div>

            <div v-else class="templates-grid">
                <div 
                    v-for="template in templates" 
                    :key="template.id"
                    class="template-card"
                    :class="{ 'selected': selectedTemplate?.id === template.id }"
                    @click="selectTemplate(template)"
                >
                    <div class="template-header">
                        <h4>{{ template.name }}</h4>
                        <div class="template-stats">
                            <span class="stat">{{ template.elements.length }} elements</span>
                            <span class="stat">{{ template.relations.length }} connections</span>
                            <span class="stat duration-stat">≈ {{ calculateTemplateDuration(template) }} days</span>
                        </div>
                    </div>
                    <p v-if="template.description" class="template-description">
                        {{ template.description }}
                    </p>
                </div>
            </div>

            <div class="step-actions">
                <button @click="$emit('cancel')" class="btn btn-secondary">Cancel</button>
                <button 
                    @click="nextStep" 
                    :disabled="!selectedTemplate"
                    class="btn btn-primary"
                >
                    Next: Set Details
                </button>
            </div>
        </div>

        <!-- Step 2: Set Flow Details -->
        <div v-if="currentStep === 2" class="step-content">
            <div class="step-header">
                <h3>Create New Flow Instance</h3>
                <p>Step 2: Set flow details</p>
                <div class="selected-template">
                    <span>Based on template: <strong>{{ selectedTemplate?.name }}</strong></span>
                </div>
            </div>

            <form @submit.prevent="createFlow" class="flow-form">
                <div class="form-group">
                    <label for="flow-title">Flow Title *</label>
                    <input 
                        id="flow-title"
                        v-model="flowData.name"
                        type="text" 
                        required
                        placeholder="Enter a title for this flow instance"
                        class="form-control"
                    />
                </div>

                <div class="form-group">
                    <label for="flow-description">Description</label>
                    <textarea 
                        id="flow-description"
                        v-model="flowData.description"
                        rows="3"
                        placeholder="Optional description for this flow instance"
                        class="form-control"
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="start-date">Start Date *</label>
                    <input 
                        id="start-date"
                        v-model="flowData.startDate"
                        type="date"
                        required
                        class="form-control"
                    />
                </div>

                <div v-if="flowData.startDate && selectedTemplate" class="form-group duration-preview">
                    <label>Expected Duration & End Date</label>
                    <div class="duration-info">
                        <div class="duration-item">
                            <span class="duration-label">Estimated Duration:</span>
                            <span class="duration-value">{{ calculateTemplateDuration(selectedTemplate) }} days</span>
                        </div>
                        <div class="duration-item">
                            <span class="duration-label">Expected End Date:</span>
                            <span class="duration-value">{{ getExpectedEndDate() }}</span>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <button type="button" @click="previousStep" class="btn btn-secondary">Back</button>
                    <button type="submit" :disabled="!flowData.name.trim() || !flowData.startDate" class="btn btn-success">
                        Create Flow Instance
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../types/FlowTemplate'
import type { Flow } from '../../types/Flow'

const emit = defineEmits<{
    created: []
    cancel: []
}>()

// Component state
const currentStep = ref(1)
const selectedTemplate = ref<FlowTemplate | null>(null)

// Flow creation data
const flowData = ref({
    name: '',
    description: '',
    startDate: ''
})

// Fetch templates
const { data: templatesData, pending: templatesLoading, error: templatesError } = 
    await useFetch<{ data: FlowTemplate[] }>('/api/templates/flows')

const templates = computed(() => templatesData.value?.data || [])

// Duration calculation for display in template selection
const calculateTemplateDuration = (template: FlowTemplate): number => {
    if (template.elements.length === 0) return 0
    
    // Build dependency graph
    const outgoingEdges = new Map<string, string[]>()
    const incomingEdges = new Map<string, string[]>()
    
    // Initialize maps for all elements
    template.elements.forEach(el => {
        outgoingEdges.set(el.id, [])
        incomingEdges.set(el.id, [])
    })
    
    // Populate relationships
    template.relations.forEach(relation => {
        relation.fromElementIds.forEach(fromId => {
            relation.toElementIds.forEach(toId => {
                outgoingEdges.get(fromId)?.push(toId)
                incomingEdges.get(toId)?.push(fromId)
            })
        })
    })
    
    // Calculate critical path
    const memo = new Map<string, number>()
    
    const calculateLongestPath = (elementId: string): number => {
        if (memo.has(elementId)) return memo.get(elementId)!
        
        const element = template.elements.find(el => el.id === elementId)
        const elementDuration = element?.durationDays || 0
        
        const outgoing = outgoingEdges.get(elementId) || []
        
        if (outgoing.length === 0) {
            memo.set(elementId, elementDuration)
            return elementDuration
        }
        
        const maxSuccessorPath = Math.max(...outgoing.map(successorId => 
            calculateLongestPath(successorId)
        ))
        
        const totalPath = elementDuration + maxSuccessorPath
        memo.set(elementId, totalPath)
        return totalPath
    }
    
    // Find starting elements
    let startingElementIds = template.startingElementIds || []
    
    if (startingElementIds.length === 0) {
        startingElementIds = template.elements
            .filter(el => (incomingEdges.get(el.id) || []).length === 0)
            .map(el => el.id)
    }
    
    if (startingElementIds.length === 0 && template.elements.length > 0) {
        const firstElement = template.elements[0]
        if (firstElement) {
            startingElementIds = [firstElement.id]
        }
    }
    
    // Calculate critical path
    const criticalPath = Math.max(...startingElementIds.map(startId => 
        calculateLongestPath(startId)
    ))
    
    return criticalPath || 0
}

// Methods
const selectTemplate = (template: FlowTemplate) => {
    selectedTemplate.value = template
}

const getExpectedEndDate = (): string => {
    if (!flowData.value.startDate || !selectedTemplate.value) return ''
    
    const startDate = new Date(flowData.value.startDate)
    const durationDays = calculateTemplateDuration(selectedTemplate.value)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + durationDays)
    
    return endDate.toLocaleDateString()
}

const nextStep = () => {
    if (selectedTemplate.value) {
        currentStep.value = 2
        // Pre-fill flow name with template name
        if (!flowData.value.name) {
            flowData.value.name = `${selectedTemplate.value.name} - ${new Date().toLocaleDateString()}`
        }
        // Set default start date to today
        if (!flowData.value.startDate) {
            flowData.value.startDate = new Date().toISOString().split('T')[0] || ''
        }
    }
}

const previousStep = () => {
    currentStep.value = 1
}

const createFlow = async () => {
    if (!selectedTemplate.value || !flowData.value.name.trim() || !flowData.value.startDate) {
        return
    }

    try {
        // Calculate total duration from template elements using critical path analysis
        const calculateFlowDuration = (template: FlowTemplate): number => {
            if (template.elements.length === 0) return 0
            
            // Build dependency graph
            const outgoingEdges = new Map<string, string[]>()
            const incomingEdges = new Map<string, string[]>()
            
            // Initialize maps for all elements
            template.elements.forEach(el => {
                outgoingEdges.set(el.id, [])
                incomingEdges.set(el.id, [])
            })
            
            // Populate relationships
            template.relations.forEach(relation => {
                relation.fromElementIds.forEach(fromId => {
                    relation.toElementIds.forEach(toId => {
                        outgoingEdges.get(fromId)?.push(toId)
                        incomingEdges.get(toId)?.push(fromId)
                    })
                })
            })
            
            // Calculate critical path using longest path algorithm
            const memo = new Map<string, number>()
            
            const calculateLongestPath = (elementId: string): number => {
                if (memo.has(elementId)) return memo.get(elementId)!
                
                const element = template.elements.find(el => el.id === elementId)
                const elementDuration = element?.durationDays || 0
                
                const outgoing = outgoingEdges.get(elementId) || []
                
                if (outgoing.length === 0) {
                    // End node - just return its duration
                    memo.set(elementId, elementDuration)
                    return elementDuration
                }
                
                // Calculate maximum path through all successors
                const maxSuccessorPath = Math.max(...outgoing.map(successorId => 
                    calculateLongestPath(successorId)
                ))
                
                const totalPath = elementDuration + maxSuccessorPath
                memo.set(elementId, totalPath)
                return totalPath
            }
            
            // Find starting elements (no incoming edges or explicit starting elements)
            let startingElementIds = template.startingElementIds || []
            
            if (startingElementIds.length === 0) {
                startingElementIds = template.elements
                    .filter(el => (incomingEdges.get(el.id) || []).length === 0)
                    .map(el => el.id)
            }
            
            if (startingElementIds.length === 0 && template.elements.length > 0) {
                const firstElement = template.elements[0]
                if (firstElement) {
                    startingElementIds = [firstElement.id]
                }
            }
            
            // Calculate critical path from all starting elements
            const criticalPath = Math.max(...startingElementIds.map(startId => 
                calculateLongestPath(startId)
            ))
            
            return criticalPath || 0
        }

        // Calculate element start and end dates based on flow sequence and relation types
        const calculateElementSchedule = (template: FlowTemplate, startDate: Date) => {
            const elements = [...template.elements]
            const relations = template.relations
            
            // Build dependency graph with relation type information
            const incomingRelations = new Map<string, Array<{fromIds: string[], type: string}>>()
            const outgoingRelations = new Map<string, Array<{toIds: string[], type: string}>>()
            
            elements.forEach(el => {
                incomingRelations.set(el.id, [])
                outgoingRelations.set(el.id, [])
            })
            
            relations.forEach(relation => {
                relation.toElementIds.forEach(toId => {
                    incomingRelations.get(toId)?.push({
                        fromIds: relation.fromElementIds,
                        type: relation.type
                    })
                })
                
                relation.fromElementIds.forEach(fromId => {
                    outgoingRelations.get(fromId)?.push({
                        toIds: relation.toElementIds,
                        type: relation.type
                    })
                })
            })
            
            // Find starting elements
            let startingElementIds = template.startingElementIds || []
            
            if (startingElementIds.length === 0) {
                startingElementIds = elements
                    .filter(el => (incomingRelations.get(el.id) || []).length === 0)
                    .map(el => el.id)
            }
            
            if (startingElementIds.length === 0 && elements.length > 0) {
                const firstElement = elements[0]
                if (firstElement) {
                    startingElementIds = [firstElement.id]
                }
            }
            
            // Calculate earliest start times for each element considering relation types
            const elementSchedule = new Map<string, { startDate: Date, endDate: Date }>()
            const calculating = new Set<string>()
            
            const calculateElementDates = (elementId: string): { startDate: Date, endDate: Date } => {
                // Return cached result if already calculated
                if (elementSchedule.has(elementId)) {
                    return elementSchedule.get(elementId)!
                }
                
                // Prevent infinite recursion
                if (calculating.has(elementId)) {
                    const fallbackStart = new Date(startDate)
                    return { startDate: fallbackStart, endDate: new Date(fallbackStart) }
                }
                
                calculating.add(elementId)
                
                const element = elements.find(el => el.id === elementId)
                if (!element) {
                    const fallbackStart = new Date(startDate)
                    calculating.delete(elementId)
                    return { startDate: fallbackStart, endDate: new Date(fallbackStart) }
                }
                
                const duration = element.durationDays || 0
                const incomingRels = incomingRelations.get(elementId) || []
                
                let elementStartDate: Date
                
                if (incomingRels.length === 0 || startingElementIds.includes(elementId)) {
                    // Starting element or no dependencies - starts with flow
                    elementStartDate = new Date(startDate)
                } else {
                    // Calculate based on dependencies and relation types
                    elementStartDate = new Date(startDate)
                    
                    incomingRels.forEach(relation => {
                        let relationRequiredDate = new Date(startDate)
                        
                        if (relation.type === 'flow') {
                            // Sequential: wait for ALL predecessors to complete
                            const allPredecessorEnds = relation.fromIds.map(fromId => {
                                const predSchedule = calculateElementDates(fromId)
                                return predSchedule.endDate
                            })
                            relationRequiredDate = new Date(Math.max(...allPredecessorEnds.map(d => d.getTime())))
                            
                        } else if (relation.type === 'and') {
                            // Parallel with sync: wait for ALL predecessors to complete (same as flow)
                            const allPredecessorEnds = relation.fromIds.map(fromId => {
                                const predSchedule = calculateElementDates(fromId)
                                return predSchedule.endDate
                            })
                            relationRequiredDate = new Date(Math.max(...allPredecessorEnds.map(d => d.getTime())))
                            
                        } else if (relation.type === 'or') {
                            // Alternative: can start as soon as ANY predecessor completes
                            const allPredecessorEnds = relation.fromIds.map(fromId => {
                                const predSchedule = calculateElementDates(fromId)
                                return predSchedule.endDate
                            })
                            relationRequiredDate = new Date(Math.min(...allPredecessorEnds.map(d => d.getTime())))
                        }
                        
                        // Take the latest required date from all incoming relations
                        if (relationRequiredDate > elementStartDate) {
                            elementStartDate = relationRequiredDate
                        }
                    })
                }
                
                const elementEndDate = new Date(elementStartDate)
                elementEndDate.setDate(elementEndDate.getDate() + duration)
                
                const schedule = { startDate: elementStartDate, endDate: elementEndDate }
                elementSchedule.set(elementId, schedule)
                calculating.delete(elementId)
                return schedule
            }
            
            // Calculate schedule for all elements
            elements.forEach(element => {
                calculateElementDates(element.id)
            })
            
            return elementSchedule
        }
        
        // Calculate schedule for all elements
        const startDate = new Date(flowData.value.startDate)
        const elementSchedule = calculateElementSchedule(selectedTemplate.value, startDate)
        
        // Calculate overall flow end date
        const allEndDates = Array.from(elementSchedule.values()).map(schedule => schedule.endDate)
        const overallEndDate = allEndDates.length > 0 ? new Date(Math.max(...allEndDates.map(d => d.getTime()))) : new Date(startDate)

        // Create flow instance from template with calculated dates
        const newFlow: Flow = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: flowData.value.name.trim(),
            description: flowData.value.description.trim() || null,
            templateId: selectedTemplate.value.id, // Link to template
            elements: selectedTemplate.value.elements.map(element => {
                const schedule = elementSchedule.get(element.id)
                return {
                    ...element,
                    // Reset element-specific flow data but set calculated end date
                    startedAt: null,
                    endedAt: schedule ? schedule.endDate.getTime() : null, // Store as timestamp
                    completedAt: null,
                    status: 'pending' as const,
                    comments: []
                }
            }),
            relations: selectedTemplate.value.relations,
            startingElementIds: selectedTemplate.value.startingElementIds || [], // Copy starting elements from template
            startedAt: flowData.value.startDate,
            expectedEndDate: overallEndDate.toISOString().split('T')[0] || null, // Expected end date based on calculated schedule
            completedAt: null,
            layout: selectedTemplate.value.layout // Copy layout from template
        }

        // Save the flow instance
        await $fetch('/api/flows', {
            method: 'POST',
            body: newFlow
        })

        emit('created')
    } catch (error) {
        console.error('Error creating flow:', error)
        alert('Error creating flow. Please try again.')
    }
}
</script>

<style scoped>
.flow-creator {
    padding: 2rem;
}

.step-content {
    max-width: 100%;
}

.step-header {
    text-align: center;
    margin-bottom: 2rem;
}

.step-header h3 {
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 1.8rem;
    font-weight: 700;
}

.step-header p {
    color: #64748b;
    font-size: 1rem;
    margin: 0;
}

.selected-template {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 8px;
    color: #667eea;
    font-size: 0.9rem;
}

.loading, .error {
    text-align: center;
    padding: 2rem;
    color: #64748b;
}

.error {
    color: #dc2626;
}

.templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.template-card {
    padding: 1.5rem;
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.template-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.4);
}

.template-card.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
}

.template-card.selected::before {
    content: '✓';
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 24px;
    height: 24px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
}

.template-header h4 {
    margin: 0 0 0.5rem 0;
    color: #2d3748;
    font-size: 1.1rem;
    font-weight: 600;
}

.template-stats {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.stat {
    font-size: 0.8rem;
    color: #64748b;
    padding: 0.25rem 0.5rem;
    background: rgba(100, 116, 139, 0.1);
    border-radius: 6px;
}

.duration-stat {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    color: #667eea;
    font-weight: 600;
}

.template-description {
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.flow-form {
    max-width: 500px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    font-size: 0.9rem;
    transition: all 0.3s ease;
    font-family: inherit;
}

.form-control:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background: rgba(255, 255, 255, 1);
}

.duration-preview {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(102, 126, 234, 0.1);
}

.duration-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.duration-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}

.duration-label {
    color: #64748b;
    font-size: 0.9rem;
}

.duration-value {
    color: #667eea;
    font-weight: 600;
    font-size: 0.9rem;
}

.step-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.btn-success:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.btn-secondary {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    color: #475569;
}

.btn-secondary:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #cbd5e1 0%, #b0bec5 100%);
}
</style>