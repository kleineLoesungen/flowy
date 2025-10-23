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
      <p>{{ error.data?.message || 'The requested element could not be found.' }}</p>
      <button @click="handleClose" class="btn btn-primary">
        <span class="icon">←</span>
        Back to Flow Editor
      </button>
    </div>

    <!-- Element Editor Modal -->
    <FlowInstanceElementEditorModal
      v-else
      :element="element"
      :is-new-element="isNewElement"
      @save="handleSave"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import type { Element } from '../../../../../../types/Element'
import FlowInstanceElementEditorModal from '~/components/Flow/Instance/ElementEditorModal.vue'

// Get route parameters
const route = useRoute()
const router = useRouter()
const flowId = route.params.id as string
const elementId = route.params.eid as string

// Get current user for authorization
const { user, isAdmin } = useUser()

// Load teams data for authorization
const { data: teamsData } = await useFetch('/api/teams')
const teams = computed(() => teamsData.value?.data || [])

// Check if this is a new element (elementId === 'new')
const isNewElement = computed(() => elementId === 'new')

// Fetch the flow to get the element
const { data: flowData, pending, error, refresh } = await useFetch<{ data: any }>(`/api/flows/${flowId}`)

const flow = computed(() => {
  if (flowData.value?.data) {
    return flowData.value.data
  }
  return null
})

const element = computed(() => {
  if (isNewElement.value || !flow.value || !flow.value.elements) {
    return null
  }
  return flow.value.elements.find((el: any) => el.id === elementId) || null
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

const canEdit = computed(() => {
  if (!flow.value) return false
  
  // Admin users can edit any element
  if (isAdmin.value) {
    return true
  }
  
  // Check if user is not logged in
  if (!user.value) {
    return false
  }
  
  // For new elements, check if user can edit the flow
  if (isNewElement.value) {
    // Check if any element has an owner
    const hasElementOwners = flow.value.elements.some((el: any) => el.ownerTeamId)
    
    // If no elements have owners, every logged-in user can edit the flow
    if (!hasElementOwners) {
      return true
    }
    
    // Check if user belongs to any team that owns elements in this flow
    return flow.value.elements.some((el: any) => {
      if (!el.ownerTeamId) return false
      return userTeamIds.value.has(el.ownerTeamId)
    })
  }
  
  // For existing elements, check if user's team owns this specific element
  if (element.value?.ownerTeamId) {
    return userTeamIds.value.has(element.value.ownerTeamId)
  }
  
  return false
})

// Don't redirect - let the flow edit page handle authorization
// The element page will only show if user has access to edit the flow

// Set page metadata
useHead({
  title: isNewElement.value ? 'Add Element' : 'Edit Element',
  meta: [
    { name: 'description', content: isNewElement.value ? 'Add a new element to the flow instance' : 'Edit flow instance element' }
  ]
})

// Methods

// Methods
const handleSave = async (updatedElement: any) => {
  try {
    if (!flow.value) return

    let updatedFlow: any
    
    if (isNewElement.value) {
      // Add new element
      updatedFlow = {
        ...flow.value,
        elements: [...flow.value.elements, updatedElement]
      }
    } else {
      // Update existing element
      updatedFlow = {
        ...flow.value,
        elements: flow.value.elements.map((el: any) => 
          el.id === elementId ? updatedElement : el
        )
      }
    }

    // Calculate and update flow's expected end date based on the latest element expected end date
    const elementsWithExpectedEnd = updatedFlow.elements.filter((el: any) => el.expectedEndedAt)
    
    if (elementsWithExpectedEnd.length > 0) {
      // Find the latest expected end date among all elements
      const latestExpectedEnd = elementsWithExpectedEnd.reduce((latest: string, el: any) => {
        if (!latest || new Date(el.expectedEndedAt) > new Date(latest)) {
          return el.expectedEndedAt
        }
        return latest
      }, null)
      
      // Update flow's expected end date (use simple date format YYYY-MM-DD to match existing format)
      if (latestExpectedEnd) {
        const latestDate = new Date(latestExpectedEnd)
        const year = latestDate.getFullYear()
        const month = String(latestDate.getMonth() + 1).padStart(2, '0')
        const day = String(latestDate.getDate()).padStart(2, '0')
        updatedFlow.expectedEndDate = `${year}-${month}-${day}`
      }
    } else {
      // If no elements have expected end dates, clear the flow's expected end date
      updatedFlow.expectedEndDate = null
    }

    // Save the updated flow
    await $fetch(`/api/flows/${flowId}`, {
      method: 'PUT',
      body: updatedFlow
    })

    // Navigate back to flow editor with preserved viewport state
    const query: Record<string, string> = {}
    
    // Restore viewport state from query parameters if they exist
    if (route.query.x) query.x = route.query.x as string
    if (route.query.y) query.y = route.query.y as string
    if (route.query.zoom) query.zoom = route.query.zoom as string
    
    await router.push({
      path: `/flows/${flowId}/edit`,
      query
    })
  } catch (error) {
    console.error('Failed to save element:', error)
    alert('Failed to save element. Please try again.')
  }
}

const handleClose = async () => {
  // Navigate back to flow editor with preserved viewport state
  const query: Record<string, string> = {}
  
  // Restore viewport state from query parameters if they exist
  if (route.query.x) query.x = route.query.x as string
  if (route.query.y) query.y = route.query.y as string
  if (route.query.zoom) query.zoom = route.query.zoom as string
  
  await router.push({
    path: `/flows/${flowId}/edit`,
    query
  })
}

// Handle 404 errors for flow
if (error.value && error.value.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Flow Not Found'
  })
}

// Handle 404 errors for element (only if not creating new and element not found)
watchEffect(() => {
  if (!pending.value && !isNewElement.value && flow.value && !element.value) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Element Not Found'
    })
  }
})
</script>

<style scoped>
.element-edit-page {
  min-height: 100vh;
  position: relative;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-state h2 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state p {
  color: #6b7280;
  margin-bottom: 2rem;
  max-width: 400px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.icon {
  font-size: 1.2em;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .loading-state, .error-state {
    padding: 1rem;
  }
  
  .error-state p {
    font-size: 0.9rem;
  }
}
</style>
