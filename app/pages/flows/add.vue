<template>
  <div class="page-container">
    <!-- Modal Overlay -->
    <div class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create New Flow</h3>
          <button @click="navigateBack" class="modal-close" title="Close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <FlowInstanceCreator 
            :preselected-template-id="templateId"
            @flow-created="handleFlowCreated"
            @cancel="navigateBack"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

// Get templateId from query parameters
const templateId = computed(() => {
  return route.query.templateId || null
})

// Handle overlay click (close modal)
const handleOverlayClick = () => {
  navigateBack()
}

// Navigate back to flows page
const navigateBack = () => {
  router.push('/flows')
}

// Handle successful flow creation
const handleFlowCreated = async (flow) => {
  try {
    // Navigate to edit page for empty flows (no template), work page for template-based flows
    if (!flow.templateId) {
      await router.push(`/flows/${flow.id}/edit`)
    } else {
      await router.push(`/flows/${flow.id}/work`)
    }
  } catch (error) {
    console.error('Navigation error:', error)
    // Fallback: navigate to flows list if direct navigation fails
    await router.push('/flows')
  }
}
</script>

<style scoped>
.page-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #334155;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 0;
}

/* Ensure the Creator component fills the modal body */
.modal-body :deep(.creator-container) {
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}
</style>