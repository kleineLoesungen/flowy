<template>
  <div class="template-edit-page">
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

    <!-- Template Editor -->
    <div v-else-if="template" class="template-editor">
      <TemplateForm :template="template" :is-editing="true" @save="handleSave" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../../../types/FlowTemplate'
import TemplateForm from '~/components/TemplateForm.vue'

// Get the template ID from the route
const route = useRoute()
const router = useRouter()
const templateId = route.params.id

// Set page metadata
useHead({
  title: `Edit Template: ${templateId}`,
  meta: [
    { name: 'description', content: `Edit flow template ${templateId}` }
  ]
})

// Fetch the specific template
const { data: templateData, pending, error, refresh } = await useFetch(`/api/templates/flows/${templateId}`)

const template = computed(() => templateData.value?.data || null)

// Update page title when template loads
watchEffect(() => {
  if (template.value) {
    useHead({
      title: `Edit Template: ${template.value.name}`,
      meta: [
        { name: 'description', content: `Edit flow template: ${template.value.name}` }
      ]
    })
  }
})

// Methods
const handleCancel = () => {
  // Navigate back
  router.go(-1)
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
.template-edit-page {
  height: 100vh;
  overflow: hidden;
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
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
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

.template-editor {
  height: 100vh;
  width: 100vw;
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