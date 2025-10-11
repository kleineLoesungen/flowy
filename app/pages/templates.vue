<template>
    <div class="templates-page" :class="{ 'editing': showEditModal }">
        <!-- Page Header (only show when not editing) -->
        <div v-if="!showEditModal" class="page-header">
            <h2>Templates</h2>
            <button @click="showAddModal = true" class="btn btn-primary">
                <span class="icon">+</span>
                Template
            </button>
        </div>

        <!-- Templates List (only show when not editing) -->
        <div v-if="!showEditModal && pending" class="loading">
            Loading templates...
        </div>

        <div v-else-if="!showEditModal && error" class="error">
            Error loading templates: {{ error }}
        </div>

        <div v-else-if="!showEditModal" class="templates-container">
            <FlowTemplatesOverview :templates="templates" @edit="editTemplate" @delete="confirmDelete" />
        </div>

        <!-- Full-Screen Editor -->
        <div v-if="showEditModal" class="fullscreen-editor">
            <TemplateForm :template="selectedTemplate" :is-editing="showEditModal" @save="handleSave"
                @cancel="closeModals" />
        </div>

        <!-- Add Flow Modal (Simple) -->
        <div v-if="showAddModal" class="modal-overlay" @click="closeModals">
            <div class="modal add-modal" @click.stop>
                <h3>Add New Flow</h3>
                <form @submit.prevent="handleAddFlow">
                    <div class="form-group">
                        <label for="flow-name">Flow Name</label>
                        <input id="flow-name" v-model="newFlowData.name" type="text" required
                            placeholder="Enter flow name" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label for="flow-description">Description</label>
                        <textarea id="flow-description" v-model="newFlowData.description" rows="3"
                            placeholder="Enter flow description (optional)" class="form-control"></textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" @click="closeModals" class="btn btn-secondary">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Flow</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Delete Confirmation -->
        <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
            <div class="modal delete-modal" @click.stop>
                <h3>Delete Flow</h3>
                <p>Are you sure you want to delete "{{ templateToDelete?.name }}"?</p>
                <div class="modal-actions">
                    <button @click="closeModals" class="btn btn-secondary">Cancel</button>
                    <button @click="deleteTemplate" class="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../types/FlowTemplate'

// Page metadata
useHead({
    title: 'Flow Templates'
})

// Reactive data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedTemplate = ref<FlowTemplate | null>(null)
const templateToDelete = ref<FlowTemplate | null>(null)

// New flow form data
const newFlowData = ref({
    name: '',
    description: ''
})

// Fetch templates
const { data: templatesData, pending, error, refresh } = await useFetch<{ data: FlowTemplate[] }>('/api/templates/flows')

const templates = computed(() => templatesData.value?.data || [])

// Methods
const editTemplate = (template: FlowTemplate) => {
    selectedTemplate.value = template
    showEditModal.value = true
}

const confirmDelete = (template: FlowTemplate) => {
    templateToDelete.value = template
    showDeleteModal.value = true
}

const closeModals = () => {
    showAddModal.value = false
    showEditModal.value = false
    showDeleteModal.value = false
    selectedTemplate.value = null
    templateToDelete.value = null
    // Reset form data
    newFlowData.value = {
        name: '',
        description: ''
    }
}

const handleAddFlow = async () => {
    if (!newFlowData.value.name.trim()) {
        alert('Please enter a flow name')
        return
    }

    try {
        // Create new flow with just name and description
        const newFlow: FlowTemplate = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: newFlowData.value.name.trim(),
            description: newFlowData.value.description.trim(),
            elements: [],
            relations: [],
            startingElementIds: []
        }

        await $fetch('/api/templates/flows', {
            method: 'POST',
            body: newFlow
        })

        await refresh()
        closeModals()
    } catch (error) {
        console.error('Error creating flow:', error)
        alert('Error creating flow. Please try again.')
    }
}

const handleSave = async (template: FlowTemplate) => {
    try {
        // This function is now only used for editing existing flows
        await $fetch(`/api/templates/flows/${template.id}`, {
            method: 'PUT',
            body: template
        })
        
        await refresh()
        // Don't close modal after saving - user can continue editing
    } catch (error) {
        console.error('Error updating flow:', error)
        alert(`Error saving flow: ${error}`)
    }
}

const deleteTemplate = async () => {
    if (!templateToDelete.value) return

    try {
        await $fetch(`/api/templates/flows/${templateToDelete.value.id}`, {
            method: 'DELETE'
        })

        await refresh()
        closeModals()
    } catch (error) {
        console.error('Error deleting flow:', error)
    }
}
</script>

<style scoped>
.templates-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    min-height: 100vh;
    position: relative;
}

.templates-page.editing {
    padding: 0;
    max-width: none;
    margin: 0;
    min-height: 100vh;
    height: 100vh;
    overflow: hidden;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    padding: 2rem 2.5rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.page-header h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    color: #2d3748;
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

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.btn-secondary {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    color: #475569;
    border: 1px solid rgba(71, 85, 105, 0.1);
}

.btn-secondary:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #cbd5e1 0%, #b0bec5 100%);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.btn-danger {
    background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-danger:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

.icon {
    margin-right: 0.5rem;
    font-size: 1.1rem;
}

.loading,
.error {
    text-align: center;
    padding: 3rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

.loading {
    color: #64748b;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.error {
    color: #dc2626;
    background: linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
}

.templates-container {
    width: 100%;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(102, 126, 234, 0.2);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 2.5rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.add-modal {
    max-width: 500px;
    width: 90vw;
}

.add-modal h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 1.5rem;
    font-weight: 700;
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

.form-control::placeholder {
    color: #9ca3af;
}

.delete-modal {
    max-width: 450px;
    text-align: center;
}

.delete-modal h3 {
    margin-top: 0;
    background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 1.5rem;
    font-weight: 700;
}

.delete-modal p {
    color: #64748b;
    font-size: 1rem;
    line-height: 1.6;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.fullscreen-editor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
}
</style>