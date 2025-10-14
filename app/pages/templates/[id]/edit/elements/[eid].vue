<template>
  <div class="element-edit-page">
    <!-- Loading state -->
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading element...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <h2>Element Not Found</h2>
      <p>{{ error }}</p>
      <button @click="handleClose" class="btn btn-primary">
        <span class="icon">←</span>
        Back to Editor
      </button>
    </div>

    <!-- Element Editor Modal -->
    <ElementEditorModal
      v-else
      :element="element"
      :is-new-element="isNewElement"
      @save="handleSave"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import ElementEditorModal from '~/components/Flow/Template/ElementEditorModal.vue'

// Get route parameters
const route = useRoute()
const router = useRouter()
const templateId = route.params.id as string
const elementId = route.params.eid as string

// Check if this is a new element (elementId === 'new')
const isNewElement = computed(() => elementId === 'new')

// Fetch the template to get the element
const { data: templateData, pending, error, refresh } = await useFetch(`/api/templates/flows/${templateId}`)

const template = computed(() => templateData.value?.data || null)
const element = computed(() => {
  if (isNewElement.value || !template.value) {
    return null
  }
  return template.value.elements.find((el: any) => el.id === elementId) || null
})

// Set page metadata
useHead({
  title: isNewElement.value ? 'Add Element' : 'Edit Element',
  meta: [
    { name: 'description', content: isNewElement.value ? 'Add a new element to the flow template' : 'Edit flow template element' }
  ]
})

// Methods
const handleSave = async (updatedElement: any) => {
  try {
    if (!template.value) return

    let updatedTemplate: any
    
    if (isNewElement.value) {
      // Add new element
      updatedTemplate = {
        ...template.value,
        elements: [...template.value.elements, updatedElement]
      }
    } else {
      // Update existing element
      updatedTemplate = {
        ...template.value,
        elements: template.value.elements.map((el: any) => 
          el.id === elementId ? updatedElement : el
        )
      }
    }

    // Save the updated template
    await $fetch(`/api/templates/flows/${templateId}`, {
      method: 'PUT',
      body: updatedTemplate
    })

    // Refresh the template data
    await refresh()
    
    // Navigate back
    router.go(-1)
  } catch (error) {
    console.error('Error saving element:', error)
    alert(`Error saving element: ${error}`)
  }
}

const handleClose = () => {
  // Navigate back
  router.go(-1)
}
</script>

<style scoped>
.element-edit-page {
  position: relative;
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