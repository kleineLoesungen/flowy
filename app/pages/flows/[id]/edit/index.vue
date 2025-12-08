<template>
  <div class="flow-edit-page">
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner">
        <svg class="animate-spin" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      <p>Loading flow...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>
      <h3>Error Loading Flow</h3>
      <p>{{ error.message || 'Failed to load flow data' }}</p>
      <button @click="refresh()" class="btn btn-primary">
        Try Again
      </button>
    </div>

    <div v-else-if="!flow && !pending && !error" class="no-flow-state">
      <div class="error-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.26-5.417-3.097"></path>
        </svg>
      </div>
      <h3>Flow Not Found</h3>
      <p>The flow with ID "{{ flowId }}" was not found.</p>
      <button @click="$router.push('/flows')" class="btn btn-primary">
        Go to Flows
      </button>
    </div>

    <div v-else-if="flow && !canEditFlow" class="access-denied-state">
      <div class="error-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
      </div>
      <h3>Access Denied</h3>
      <p>You don't have permission to edit this flow.</p>
      <p>Only team members who own elements in this flow can edit it.</p>
      <div class="access-actions">
        <button @click="$router.push(`/flows/${flowId}/work`)" class="btn btn-secondary">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          View Flow
        </button>
        <button @click="$router.push('/flows')" class="btn btn-primary">
          Go to Flows
        </button>
      </div>
    </div>

    <FlowInstanceEditor 
      v-else-if="flow && canEditFlow" 
      :flow="flow" 
      :isEditing="true"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { Flow } from '../../../../../types/Flow'
import FlowInstanceEditor from '~/components/Flow/Instance/Editor.vue'

// Get route parameters
const route = useRoute()
const router = useRouter()
const flowId = route.params.id as string

// Get current user for authorization
const { user, isAdmin } = useUser()

// Page metadata
definePageMeta({
  title: 'Edit Flow'
})

// Load teams data for authorization
const { data: teamsData } = await useFetch('/api/teams')
const teams = computed(() => teamsData.value?.data || [])

// Fetch flow data
const { data: flowData, pending, error, refresh } = await useFetch<{ data: Flow }>(`/api/flows/${flowId}`)

// Transform the response data to get just the Flow object
const flow = computed(() => {
  if (flowData.value?.data) {
    return flowData.value.data
  }
  return null
})

// Helper computed property to get user's team IDs from team data
const userTeamIds = computed(() => {
  if (!user.value) return new Set<string>()
  
  const teamIds = new Set<string>()
  teams.value.forEach(team => {
    if (team.userIds && team.userIds.includes(user.value!.id)) {
      teamIds.add(team.id)
    }
  })
  return teamIds
})

// Authorization function to check if user can edit this flow (matches InstancesOverview logic)
const canEditFlow = computed(() => {
  if (!flow.value) return false
  
  // Admin users can edit any flow
  if (isAdmin.value) {
    return true
  }
  
  // Check if user is not logged in
  if (!user.value) {
    return false
  }
  
  // Check if any element has an owner
  const hasElementOwners = flow.value.elements.some(element => element.ownerTeamId)
  
  // If no elements have owners, every logged-in user can edit the flow
  if (!hasElementOwners) {
    return true
  }
  
  // Check each element to see if user's team owns it
  return flow.value.elements.some(element => {
    if (!element.ownerTeamId) return false
    return userTeamIds.value.has(element.ownerTeamId)
  })
})

// Save flow changes
const saving = ref(false)

const handleSave = async (updatedFlow: Flow) => {
  if (saving.value) return
  
  try {
    saving.value = true
    
    const response = await $fetch<{ data: Flow }>(`/api/flows/${flowId}`, {
      method: 'PUT',
      body: updatedFlow
    })

    if (response.data) {
      // Update local flow data
      if (flowData.value) {
        flowData.value.data = response.data
      }
    } else {
      throw new Error('Failed to save flow')
    }
  } catch (err: any) {
    console.error('Error saving flow:', err)
    alert(err.message || 'Failed to save flow')
  } finally {
    saving.value = false
  }
}

const handleCancel = async () => {
  // Navigate back to flow list page
  await router.push(`/flows`)
}

// Set page title with flow name
watchEffect(() => {
  if (flow.value?.name) {
    useHead({
      title: `Edit ${flow.value.name} - Flowy`
    })
  }
})
</script>

<style scoped>
.flow-edit-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: white;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-icon {
  margin-bottom: 1rem;
  color: #fca5a5;
}

.error-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-state p {
  margin: 0 0 1.5rem 0;
  color: rgba(255, 255, 255, 0.8);
}

.no-flow-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: white;
}

.no-flow-state pre {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  text-align: left;
  margin: 1rem 0;
  max-width: 600px;
  overflow: auto;
}

.access-denied-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: white;
}

.access-denied-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.access-denied-state p {
  margin: 0 0 0.5rem 0;
  color: rgba(255, 255, 255, 0.8);
}

.access-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
</style>
