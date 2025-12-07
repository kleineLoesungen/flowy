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
        Back to Flow Work
      </button>
    </div>

    <!-- Element Editor Modal -->
    <FlowInstanceElementWorkModal
      v-else
      :element="element"
      :is-new-element="isNewElement"
      :is-flow-completed="!!flow?.completedAt"
      @save="handleSave"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">

// Import the relations composable for handling the new connections structure
const { getFromElementIds, getToElementIds } = useRelations()

// Get route parameters
const route = useRoute()
const router = useRouter()
const flowId = route.params.id as string
const elementId = route.params.eid as string

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

// Set page metadata
useHead({
  title: isNewElement.value ? 'Add Element' : 'Work on Element',
  meta: [
    { name: 'description', content: isNewElement.value ? 'Add a new element to the flow instance' : 'Edit flow instance element' }
  ]
})

// Helper function to find the next action elements after a state element
const findNextActionElements = (stateElementId: string, flowData: any, isReversed: boolean): string[] => {
  const actionElements: string[] = []
  
  // Find relations where the state element is a source
  const nextRelationsFromState = isReversed 
    ? flowData.relations.filter((relation: any) => getToElementIds(relation).includes(stateElementId))
    : flowData.relations.filter((relation: any) => getFromElementIds(relation).includes(stateElementId))
  
  nextRelationsFromState.forEach((relation: any) => {
    const targetIds = isReversed ? getFromElementIds(relation) : getToElementIds(relation)
    
    targetIds.forEach((targetId: string) => {
      const targetElement = flowData.elements.find((el: any) => el.id === targetId)
      
      if (targetElement && targetElement.status === 'pending') {
        if (targetElement.type === 'action') {
          // Found an action element - add it to progress
          actionElements.push(targetId)
        } else if (targetElement.type === 'state') {
          // Found another state element - recursively find actions after it
          const recursiveActions = findNextActionElements(targetId, flowData, isReversed)
          actionElements.push(...recursiveActions)
        }
        // Skip artefacts as they don't need to be progressed
      }
    })
  })
  
  return actionElements
}

// Helper function to automatically progress next elements
const progressNextElements = (completedElementId: string, flowData: any): any => {
  // Find all relations where the completed element is a source - try both directions
  const nextRelationsFrom = flowData.relations.filter((relation: any) => {
    const fromElementIds = getFromElementIds(relation)
    return fromElementIds.includes(completedElementId)
  })
  
  const nextRelationsTo = flowData.relations.filter((relation: any) => {
    const toElementIds = getToElementIds(relation)
    return toElementIds.includes(completedElementId)
  })

  // Determine which direction to use - try both and see which makes sense
  // If we find relations where this element is in toElementIds, then the flow direction might be reversed
  const nextRelations = nextRelationsFrom.length > 0 ? nextRelationsFrom : nextRelationsTo
  const isReversed = nextRelationsTo.length > 0 && nextRelationsFrom.length === 0

  // Group next elements by relation type and check if they should be progressed
  const elementsToProgress = new Set<string>()

  nextRelations.forEach((relation: any) => {
    // Determine which IDs are the targets based on direction
    const targetIds = isReversed ? getFromElementIds(relation) : getToElementIds(relation)
    const sourceIds = isReversed ? getToElementIds(relation) : getFromElementIds(relation)
    
    targetIds.forEach((targetId: string) => {
      // Skip if this is the element we just completed (avoid circular logic)
      if (targetId === completedElementId) {
        return
      }
      
      const targetElement = flowData.elements.find((el: any) => el.id === targetId)
      
      // Only progress if target element is currently pending
      if (!targetElement || targetElement.status !== 'pending') {
        return
      }

      if (relation.type === 'flow') {
        // Flow relation: check if target is a state element
        if (targetElement.type === 'state') {
          // Skip state elements and progress their next elements instead
          const nextActionElements = findNextActionElements(targetId, flowData, isReversed)
          nextActionElements.forEach(actionId => {
            elementsToProgress.add(actionId)
          })
        } else {
          elementsToProgress.add(targetId)
        }
      } else if (relation.type === 'or') {
        // OR relation: check if target is a state element
        if (targetElement.type === 'state') {
          const nextActionElements = findNextActionElements(targetId, flowData, isReversed)
          nextActionElements.forEach(actionId => {
            elementsToProgress.add(actionId)
          })
        } else {
          elementsToProgress.add(targetId)
        }
      } else if (relation.type === 'and') {
        // AND relation: only progress if ALL source elements are completed or aborted
        const allSourcesCompleted = sourceIds.every((sourceId: string) => {
          if (sourceId === completedElementId) {
            // For the element we just updated, use the new status
            return true // We know it's completed or aborted since this function is called
          }
          
          const sourceElement = flowData.elements.find((el: any) => el.id === sourceId)
          return sourceElement && (sourceElement.status === 'completed' || sourceElement.status === 'aborted')
        })
        
        if (allSourcesCompleted) {
          if (targetElement.type === 'state') {
            const nextActionElements = findNextActionElements(targetId, flowData, isReversed)
            nextActionElements.forEach((actionId: string) => {
              elementsToProgress.add(actionId)
            })
          } else {
            elementsToProgress.add(targetId)
          }
        }
      }
      // Note: 'in' and 'out' relations are for artefacts and don't affect flow progression
    })
  })

  // Update elements: change status from 'pending' to 'in-progress' for eligible elements
  const updatedElements = flowData.elements.map((element: any) => {
    if (elementsToProgress.has(element.id)) {
      return {
        ...element,
        status: 'in-progress'
      }
    }
    return element
  })

  return {
    ...flowData,
    elements: updatedElements
  }
}

// Helper function to revert dependent elements when an element is no longer completed
const revertDependentElements = (revertedElementId: string, flowData: any): any => {
  // Find all relations where the reverted element is a source
  const dependentRelations = flowData.relations.filter((relation: any) => {
    const fromElementIds = getFromElementIds(relation)
    return fromElementIds.includes(revertedElementId)
  })

  // Get all target element IDs that might need to be reverted
  const potentiallyAffectedElements = new Set<string>()
  dependentRelations.forEach((relation: any) => {
    const toElementIds = getToElementIds(relation)
    toElementIds.forEach((id: string) => potentiallyAffectedElements.add(id))
  })

  // Check which elements should be reverted to pending
  const elementsToRevert = new Set<string>()
  
  potentiallyAffectedElements.forEach((targetId: string) => {
    const targetElement = flowData.elements.find((el: any) => el.id === targetId)
    
    // Only consider elements that are currently in-progress
    if (!targetElement || targetElement.status !== 'in-progress') {
      return
    }

    // Find all relations that could have triggered this element
    const triggeringRelations = flowData.relations.filter((relation: any) => {
      const toElementIds = getToElementIds(relation)
      return toElementIds.includes(targetId)
    })

    // Check if this element still has valid triggers
    let hasValidTrigger = false
    
    for (const relation of triggeringRelations) {
      if (relation.type === 'flow' || relation.type === 'or') {
        // For flow/or relations, any completed source is enough
        const fromElementIds = getFromElementIds(relation)
        const hasCompletedSource = fromElementIds.some((sourceId: string) => {
          if (sourceId === revertedElementId) return false // The reverted element no longer counts
          const sourceElement = flowData.elements.find((el: any) => el.id === sourceId)
          return sourceElement && (sourceElement.status === 'completed' || sourceElement.status === 'aborted')
        })
        if (hasCompletedSource) {
          hasValidTrigger = true
          break
        }
      } else if (relation.type === 'and') {
        // For AND relations, all sources must be completed
        const fromElementIds = getFromElementIds(relation)
        const allSourcesCompleted = fromElementIds.every((sourceId: string) => {
          if (sourceId === revertedElementId) return false // The reverted element no longer counts
          const sourceElement = flowData.elements.find((el: any) => el.id === sourceId)
          return sourceElement && (sourceElement.status === 'completed' || sourceElement.status === 'aborted')
        })
        if (allSourcesCompleted) {
          hasValidTrigger = true
          break
        }
      }
    }

    // If no valid trigger exists, revert to pending
    if (!hasValidTrigger) {
      elementsToRevert.add(targetId)
    }
  })

  // Update elements: change status back to 'pending' for elements without valid triggers
  const updatedElements = flowData.elements.map((element: any) => {
    if (elementsToRevert.has(element.id)) {
      return {
        ...element,
        status: 'pending'
      }
    }
    return element
  })

  return {
    ...flowData,
    elements: updatedElements
  }
}

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
      const originalElement = flow.value.elements.find((el: any) => el.id === elementId)
      
      updatedFlow = {
        ...flow.value,
        elements: flow.value.elements.map((el: any) => 
          el.id === elementId ? updatedElement : el
        )
      }

      // Check if element status changed to completed or aborted
      if (originalElement) {
        const wasCompleted = originalElement.status === 'completed' || originalElement.status === 'aborted'
        const isNowCompleted = updatedElement.status === 'completed' || updatedElement.status === 'aborted'
        
        if (!wasCompleted && isNowCompleted) {
          // Element became completed/aborted: progress next elements
          updatedFlow = progressNextElements(elementId, updatedFlow)
        } else if (wasCompleted && !isNowCompleted) {
          // Element was reverted from completed/aborted: potentially reset dependent elements
          updatedFlow = revertDependentElements(elementId, updatedFlow)
        }
      }
    }

    // Save the updated flow
    await $fetch(`/api/flows/${flowId}`, {
      method: 'PUT' as const,
      body: updatedFlow
    })

    // Check if user came from dashboard
    if (route.query.from === 'dashboard') {
      // Navigate back to the dashboard (InstancesOverview)
      await router.push('/flows')
      return
    }

    // Navigate back to flow work page with preserved viewport state
    const query: Record<string, string> = {}
    
    // Restore viewport state from query parameters if they exist
    if (route.query.x) query.x = route.query.x as string
    if (route.query.y) query.y = route.query.y as string
    if (route.query.zoom) query.zoom = route.query.zoom as string
    
    await router.push({
      path: `/flows/${flowId}/work`,
      query
    })
  } catch (error) {
    console.error('Failed to save element:', error)
    alert('Failed to save element. Please try again.')
  }
}

const handleClose = async () => {
  // Check if user came from dashboard
  if (route.query.from === 'dashboard') {
    // Navigate back to the dashboard (InstancesOverview)
    await router.push('/flows')
    return
  }

  // Navigate back to flow work page with preserved viewport state
  const query: Record<string, string> = {}
  
  // Restore viewport state from query parameters if they exist
  if (route.query.x) query.x = route.query.x as string
  if (route.query.y) query.y = route.query.y as string
  if (route.query.zoom) query.zoom = route.query.zoom as string
  
  await router.push({
    path: `/flows/${flowId}/work`,
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
