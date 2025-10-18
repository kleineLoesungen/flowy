<template>
  <div class="flow-work-page">
    <!-- Loading state -->
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading flow...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <h2>Flow Not Found</h2>
      <p>{{ error.data?.message || 'The requested flow could not be found.' }}</p>
      <NuxtLink to="/flows" class="btn btn-primary">
        <span class="icon">←</span>
        Back to Flows
      </NuxtLink>
    </div>

    <!-- Flow Editor -->
    <div v-else-if="flow" class="flow-editor-container">
      <Suspense>
        <FlowInstanceWork
          :key="`work-${flowId}`"
          :flow="flow" 
          :isWorking="true"
          @save="handleSave" 
          @cancel="handleCancel" 
        />
        <template #fallback>
          <div class="editor-loading">
            <div class="loading-spinner"></div>
            <p>Initializing editor...</p>
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Flow } from '../../../../../types/Flow'
import FlowInstanceWork from '~/components/Flow/Instance/Work.vue'

// Get route params
const route = useRoute()
const router = useRouter()
const flowId = route.params.id as string

// Fetch flow data
const { data: flow, pending, error } = await useFetch<Flow>(`/api/flows/${flowId}`)

// Set page metadata
useHead({
  title: computed(() => flow.value ? `Edit ${flow.value.name} - Flow Editor` : 'Flow Editor')
})

// Handle save event
const handleSave = async (updatedFlow: Flow) => {
  try {
    // Update the flow via API
    await $fetch(`/api/flows/${flowId}`, {
      method: 'PUT',
      body: updatedFlow
    })
    
    // Use nextTick to ensure component cleanup before navigation
    await nextTick()
    await router.push('/flows')
  } catch (error) {
    console.error('Failed to save flow:', error)
    // You could add error handling UI here
  }
}

// Handle cancel event
const handleCancel = async () => {
  // Use nextTick to ensure component cleanup before navigation
  await nextTick()
  router.go(-1)
}

// Ensure proper cleanup when component is unmounted
onBeforeUnmount(() => {
  // Allow Vue Flow and other components to clean up properly
  // This prevents the dispose error by giving components time to cleanup
})

// Handle 404 errors
if (error.value && error.value.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Flow Not Found'
  })
}
</script>

<style scoped>
.flow-work-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-top: 10vh;
}

.error-state h2 {
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.error-state p {
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.icon {
  font-size: 1.2em;
}

/* Flow editor container */
.flow-editor-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* Override the editor's default styling to fit full page */
:deep(.flow-editor) {
  height: 100vh;
}

:deep(.editor-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.flow-canvas) {
  height: calc(100vh - 200px); /* Adjust based on header height */
}

/* Editor loading state */
.editor-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: white;
  gap: 1rem;
}

.editor-loading .loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
