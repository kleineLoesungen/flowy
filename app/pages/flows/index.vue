<template>
    <div class="flows-page" :class="{ 'editing': showWorkModal }">
        <!-- Flows List (only show when not working) -->
        <div v-if="!showWorkModal && pending" class="loading">
            Loading flows...
        </div>

        <div v-else-if="!showWorkModal && error" class="error">
            Error loading flows: {{ error }}
        </div>

        <div v-else-if="!showWorkModal" class="flows-container">
            <FlowInstancesOverview :flows="flows" @delete="confirmDelete" @create="showCreateModal = true" />
        </div>

        <!-- Create Flow Instance Modal -->
        <div v-if="showCreateModal" class="modal-overlay" @click="closeModals">
            <div class="modal create-modal" @click.stop>
                <FlowInstanceCreator @created="handleFlowCreated" @cancel="closeModals" />
            </div>
        </div>

        <!-- Delete Confirmation -->
        <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
            <div class="modal delete-modal" @click.stop>
                <h3>Delete Flow Instance</h3>
                <p>Are you sure you want to delete "{{ flowToDelete?.name }}"?</p>
                <div class="modal-actions">
                    <button @click="closeModals" class="btn btn-secondary">Cancel</button>
                    <button @click="deleteFlow" class="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Flow } from '../../../types/Flow'

// Page metadata
useHead({
    title: 'Flow Instances'
})

// Reactive data
const showCreateModal = ref(false)
const showWorkModal = ref(false)
const showDeleteModal = ref(false)
const selectedFlow = ref<Flow | null>(null)
const flowToDelete = ref<Flow | null>(null)

// Fetch flows
const { data: flowsData, pending, error, refresh } = await useFetch<{ data: Flow[] }>('/api/flows')

const flows = computed(() => flowsData.value?.data || [])

// Methods
const confirmDelete = (flow: Flow) => {
    flowToDelete.value = flow
    showDeleteModal.value = true
}

const closeModals = () => {
    showCreateModal.value = false
    showWorkModal.value = false
    showDeleteModal.value = false
    selectedFlow.value = null
    flowToDelete.value = null
}

const handleFlowCreated = async () => {
    await refresh()
    closeModals()
}

const handleSave = async (flow: Flow) => {
    try {
        await $fetch(`/api/flows/${flow.id}`, {
            method: 'PUT',
            body: flow
        })
        
        await refresh()
        closeModals()
    } catch (error) {
        console.error('Error updating flow:', error)
        alert(`Error saving flow: ${error}`)
    }
}

const deleteFlow = async () => {
    if (!flowToDelete.value) return

    try {
        await $fetch(`/api/flows/${flowToDelete.value.id}`, {
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
.flows-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    min-height: 100vh;
    position: relative;
}

.flows-page.editing {
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

.flows-container {
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

.create-modal {
    max-width: 600px;
    width: 90vw;
    padding: 0;
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

.fullscreen-work {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    background: #f8fafc;
}
</style>