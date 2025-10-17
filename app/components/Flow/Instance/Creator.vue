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

            <div v-else>
                <!-- Search Filter -->
                <div class="search-container">
                    <div class="search-wrapper">
                        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input v-model="searchQuery" type="text"
                            placeholder="Search templates by name or description..." class="search-input" />
                        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn"
                            title="Clear search">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div v-if="searchQuery && filteredTemplates.length === 0" class="no-results">
                        No templates found matching "{{ searchQuery }}"
                    </div>
                    <div v-else-if="searchQuery" class="search-results-info">
                        Found {{ filteredTemplates.length }} template{{ filteredTemplates.length === 1 ? '' : 's' }}
                    </div>
                </div>

                <div class="templates-grid">
                    <div v-for="template in filteredTemplates" :key="template.id" class="template-card"
                        :class="{ 'selected': selectedTemplate?.id === template.id }" @click="selectTemplate(template)">
                        <div class="template-header">
                            <h4>{{ template.name }}</h4>
                            <span class="stat duration-stat">≈ {{ calculateTemplateDuration(template) }} {{
                                getDurationLabel(calculateFlowDuration(template)) }}</span>
                        </div>
                        <p v-if="template.description" class="template-description">
                            {{ template.description }}
                        </p>
                    </div>
                </div>

                <div class="step-actions">
                    <button @click="$emit('cancel')" class="btn btn-secondary">Cancel</button>
                    <button @click="nextStep" :disabled="!selectedTemplate" class="btn btn-primary">
                        Next: Set Details
                    </button>
                </div>
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
                    <input id="flow-title" v-model="flowData.name" type="text" required
                        placeholder="Enter a title for this flow instance" class="form-control" />
                </div>

                <div class="form-group">
                    <label for="flow-description">Description</label>
                    <textarea id="flow-description" v-model="flowData.description" rows="3"
                        placeholder="Optional description for this flow instance" class="form-control"></textarea>
                </div>

                <div class="form-group">
                    <label for="start-date">Start Date *</label>
                    <input id="start-date" v-model="flowData.startDate" type="date" required class="form-control" />
                </div>

                <div v-if="flowData.startDate && selectedTemplate" class="form-group duration-preview">
                    <label>Expected Duration & End Date</label>
                    <div class="duration-info">
                        <div class="duration-item">
                            <span class="duration-label">Estimated Duration:</span>
                            <span class="duration-value">{{ calculateTemplateDuration(selectedTemplate) }} {{
                                getDurationLabel(calculateFlowDuration(selectedTemplate)) }}</span>
                        </div>
                        <div class="duration-item">
                            <span class="duration-label">Expected End Date:</span>
                            <span class="duration-value">{{ getExpectedEndDate() }}</span>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <button type="button" @click="previousStep" class="btn btn-secondary">Back</button>
                    <button type="submit" :disabled="!flowData.name.trim() || !flowData.startDate"
                        class="btn btn-success">
                        Create Flow Instance
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../../../types/FlowTemplate'
import type { Flow } from '../../../../types/Flow'
import { calculateFlowDuration, formatDurationRange, getDurationLabel } from '../../../../utils/flowDurationCalculator'
import { addWorkdays } from '../../../../utils/workdayCalculator'

const emit = defineEmits<{
    created: []
    cancel: []
}>()

// Component state
const currentStep = ref(1)
const selectedTemplate = ref<FlowTemplate | null>(null)
const searchQuery = ref('')

// Flow creation data
const flowData = ref({
    name: '',
    description: '',
    startDate: ''
})

// Fetch templates
const { data: templatesData, pending: templatesLoading, error: templatesError } =
    await useFetch<{ data: FlowTemplate[] }>('/api/templates')

const templates = computed(() => templatesData.value?.data || [])

// Filtered templates based on search query
const filteredTemplates = computed(() => {
    if (!searchQuery.value.trim()) {
        return templates.value
    }

    const query = searchQuery.value.toLowerCase()
    return templates.value.filter(template =>
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query))
    )
})

// Duration calculation for display in template selection
const calculateTemplateDuration = (template: FlowTemplate): string => {
    const durationRange = calculateFlowDuration(template)
    return formatDurationRange(durationRange)
}

// Methods
const selectTemplate = (template: FlowTemplate) => {
    selectedTemplate.value = template
}

const getExpectedEndDate = (): string => {
    if (!flowData.value.startDate || !selectedTemplate.value) return ''

    const startDate = new Date(flowData.value.startDate)
    const durationRange = calculateFlowDuration(selectedTemplate.value)
    const endDate = addWorkdays(startDate, durationRange.max)

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
        // Calculate flow duration using the utility function
        const durationRange = calculateFlowDuration(selectedTemplate.value)
        const flowDurationDays = durationRange.max

        // Calculate overall flow end date using the flow duration
        const startDate = new Date(flowData.value.startDate)
        const overallEndDate = addWorkdays(startDate, flowDurationDays)

        // Create flow instance from template with calculated dates
        const newFlow: Flow = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: flowData.value.name.trim(),
            description: flowData.value.description.trim() || null,
            templateId: selectedTemplate.value.id, // Link to template
            elements: selectedTemplate.value.elements.map(element => {
                // Calculate expected end date for each element
                const elementStartDate = new Date(startDate)
                const elementEndDate = addWorkdays(elementStartDate, element.durationDays || 0)

                return {
                    id: element.id,
                    name: element.name,
                    description: element.description,
                    ownerId: element.ownerId,
                    consultedUserIds: element.consultedUserIds,
                    completedAt: null,
                    expectedEndedAt: elementEndDate.toISOString().split('T')[0] || null,
                    type: element.type,
                    status: 'pending' as const,
                    comments: []
                }
            }),
            relations: selectedTemplate.value.relations,
            startingElementId: selectedTemplate.value.startingElementId || '', // Copy starting element from template
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

.loading,
.error {
    text-align: center;
    padding: 2rem;
    color: #64748b;
}

.error {
    color: #dc2626;
}

.search-container {
    margin-bottom: 2rem;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 500px;
    margin: 0 auto;
}

.search-icon {
    position: absolute;
    left: 1rem;
    width: 20px;
    height: 20px;
    color: #9ca3af;
    pointer-events: none;
    z-index: 1;
}

.search-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    font-size: 0.95rem;
    transition: all 0.3s ease;
    font-family: inherit;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.08);
}

.search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 20px rgba(102, 126, 234, 0.15);
    background: rgba(255, 255, 255, 1);
}

.search-input::placeholder {
    color: #9ca3af;
}

.clear-search-btn {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-search-btn:hover {
    color: #dc2626;
    background: rgba(220, 38, 38, 0.1);
}

.clear-search-btn svg {
    width: 16px;
    height: 16px;
}

.no-results {
    text-align: center;
    padding: 1.5rem;
    color: #6b7280;
    font-style: italic;
    background: rgba(107, 114, 128, 0.05);
    border-radius: 12px;
    margin-top: 1rem;
}

.search-results-info {
    text-align: center;
    padding: 0.75rem;
    color: #667eea;
    font-size: 0.9rem;
    font-weight: 500;
    margin-top: 1rem;
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

.template-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.template-header h4 {
    margin: 0;
    color: #2d3748;
    font-size: 1.1rem;
    font-weight: 600;
    flex: 1;
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