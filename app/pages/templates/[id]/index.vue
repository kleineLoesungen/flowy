<template>
  <div class="template-detail-page">
    <!-- Loading state -->
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading template...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <h2>Template Not Found</h2>
      <p>{{ error }}</p>
      <NuxtLink to="/templates" class="btn btn-primary">
        <span class="icon">←</span>
        Back to Templates
      </NuxtLink>
    </div>

    <!-- Template Content -->
    <div v-else-if="template" class="template-content">
      <FlowViewer :template="template" @close="handleClose" />
    </div>
  </div>
</template>

<style scoped>
.template-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p,
.error-state p {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
}

.error-state h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
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

.icon {
  font-size: 1rem;
}
</style>

<script setup lang="ts">
import type { FlowTemplate } from '../../../../types/FlowTemplate'
import { 
  calculateFlowDuration, 
  formatDurationRange, 
  getDurationLabel 
} from '../../../../utils/flowDurationCalculator'
import FlowViewer from '~/components/FlowViewer.vue'
import TemplateForm from '~/components/TemplateForm.vue'

// Get the template ID from the route
const route = useRoute()
const router = useRouter()
const templateId = route.params.id as string

// Check if we should start in edit mode (from query parameter)
const isEditMode = ref(!!route.query.edit)

// Set page metadata
useHead({
  title: `Template: ${templateId}`,
  meta: [
    { name: 'description', content: `Flow template details for ${templateId}` }
  ]
})

// Fetch the specific template
const { data: templateData, pending, error, refresh } = await useFetch<{ data: FlowTemplate }>(`/api/templates/flows/${templateId}`)

const template = computed(() => templateData.value?.data || null)

// Update page title when template loads
watchEffect(() => {
  if (template.value) {
    useHead({
      title: `Template: ${template.value.name}`,
      meta: [
        { name: 'description', content: template.value.description || `Flow template: ${template.value.name}` }
      ]
    })
  }
})

// Watch for query changes to toggle edit mode
watch(() => route.query.edit, (editParam) => {
  isEditMode.value = !!editParam
})

// Handle escape key to close editor
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isEditMode.value) {
    handleCancel()
  }
}

// Add/remove keyboard listener when edit mode changes
watch(isEditMode, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Methods
const handleClose = () => {
  // Navigate back
  router.go(-1)
}

const enableEditMode = () => {
  isEditMode.value = true
  // Update URL to reflect edit state
  router.push({ query: { ...route.query, edit: 'true' } })
}

const handleCancel = () => {
  // Navigate directly to the template view (without query parameters)
  router.push(`/templates/${templateId}`)
}

const handleSave = async (updatedTemplate: FlowTemplate) => {
  try {
    await $fetch(`/api/templates/flows/${updatedTemplate.id}`, {
      method: 'PUT',
      body: updatedTemplate
    })
    
    // Refresh the template data
    await refresh()
    
    // Stay in edit mode - don't close automatically
    // User can manually cancel if they want to exit
  } catch (error) {
    console.error('Error updating flow:', error)
    alert(`Error saving flow: ${error}`)
  }
}
</script>

<style scoped>
.template-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p,
.error-state p {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
}

.error-state h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.template-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.template-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
  z-index: 10;
  position: relative;
}

.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.back-button:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(-2px);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
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

.icon {
  font-size: 1rem;
}

.template-info {
  padding: 2rem;
}

.template-info h1 {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.description {
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 600px;
}

.template-stats {
  display: flex;
  gap: 3rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
  min-width: 120px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1;
}

.stat-duration {
  font-size: 1.5rem;
  font-weight: 600;
  color: #667eea;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.5rem;
}

.visualization-container {
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-nav {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .template-info {
    padding: 1rem;
  }

  .template-info h1 {
    font-size: 2rem;
  }

  .template-stats {
    gap: 1rem;
    justify-content: center;
  }

  .stat-item {
    min-width: 100px;
    padding: 0.75rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-duration {
    font-size: 1.25rem;
  }
}

/* Fullscreen Editor Overlay Styles */
.fullscreen-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.overlay-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 126, 234, 0.15);
  backdrop-filter: blur(4px);
  cursor: pointer;
}

.fullscreen-editor {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  background: white;
  border-radius: 0;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
  overflow: hidden;
  z-index: 1001;
}

.editor-close-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.editor-close-button:hover {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

.close-icon {
  font-size: 1.2rem;
  font-weight: bold;
  line-height: 1;
}

/* Responsive adjustments for overlay */
@media (max-width: 768px) {
  .fullscreen-editor-overlay {
    padding: 0;
  }
  
  .fullscreen-editor {
    border-radius: 0;
    width: 100%;
    height: 100%;
  }
  
  .editor-close-button {
    top: 0.75rem;
    right: 0.75rem;
    width: 40px;
    height: 40px;
  }
  
  .close-icon {
    font-size: 1rem;
  }
}
</style>
