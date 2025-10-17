<template>
  <div class="flows-overview">
    <!-- Modern Filters Section -->
    <div class="filters-container">
      <div class="filters-header">
        <div class="filter-title">
          <h3>
            <svg class="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z">
              </path>
            </svg>
            Filters
          </h3>
        </div>
        <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-all-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          Clear All
        </button>
      </div>

      <div class="filters-grid">
        <!-- Text Search Filter -->
        <div class="text-search-section">
          <div class="text-search-wrapper">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input v-model="textSearchQuery" type="text" placeholder="Search flows by name or description..."
              class="text-search-input" />
            <button v-if="textSearchQuery" @click="clearTextFilter" class="clear-search-btn" title="Clear search">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="button-filters">
          <!-- Users Filter Button -->
          <div class="button-filter">
            <button class="filter-button" @click="toggleUsersDropdown" :class="{ 'active': selectedUsers.length > 0 }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
              </svg>
              <span>Users</span>
              <span v-if="selectedUsers.length > 0" class="count-badge">{{ selectedUsers.length }}</span>
              <svg class="chevron" :class="{ 'rotated': usersDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-if="usersDropdownOpen" class="dropdown-panel button-dropdown">
              <!-- Selected Users Section -->
              <div v-if="selectedUsers.length > 0" class="selected-section">
                <div class="section-header">Selected Users</div>
                <div class="selected-items">
                  <div v-for="user in selectedUsers" :key="user.id" class="selected-item">
                    <div class="item-content">
                      <div class="item-name">{{ user.name || 'No Name' }}</div>
                      <div class="item-detail">{{ user.email }}</div>
                    </div>
                    <button @click="removeUserFilter(user.id)" class="remove-btn">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Search Section -->
              <div class="search-container">
                <div class="search-input-wrapper">
                  <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <input v-model="usersSearchQuery" type="text" placeholder="Search users..." class="search-input"
                    @click.stop />
                </div>
              </div>

              <!-- Available Options -->
              <div class="options-container">
                <div v-for="user in filteredUsers" :key="user.id" class="option-item"
                  @click.stop="toggleUserFilter(user.id)">
                  <div class="option-checkbox">
                    <input type="checkbox" :checked="selectedUserIds.includes(user.id)" @click.stop />
                  </div>
                  <div class="option-content">
                    <div class="option-name">{{ user.name || 'No Name' }}</div>
                    <div class="option-detail">{{ user.email }}</div>
                  </div>
                </div>

                <div v-if="filteredUsers.length === 0" class="no-options">
                  <span v-if="usersSearchQuery">No users found for "{{ usersSearchQuery }}"</span>
                  <span v-else>No users available</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Filter Button -->
          <div class="button-filter">
            <button class="filter-button" @click="toggleStatusDropdown" :class="{ 'active': selectedStatuses.length > 0 }">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Status</span>
              <span v-if="selectedStatuses.length > 0" class="count-badge">{{ selectedStatuses.length }}</span>
              <svg class="chevron" :class="{ 'rotated': statusDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-if="statusDropdownOpen" class="dropdown-panel button-dropdown">
              <!-- Selected Statuses Section -->
              <div v-if="selectedStatuses.length > 0" class="selected-section">
                <div class="section-header">Selected Statuses</div>
                <div class="selected-items">
                  <div v-for="status in selectedStatuses" :key="status" class="selected-item">
                    <div class="item-content">
                      <div class="item-name">
                        <span class="status-badge" :class="`status-${status}`">{{ getStatusLabel(status) }}</span>
                      </div>
                    </div>
                    <button @click="removeStatusFilter(status)" class="remove-btn">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Available Options -->
              <div class="options-container">
                <div v-for="status in availableStatuses" :key="status.value" class="option-item"
                  @click.stop="toggleStatusFilter(status.value)">
                  <div class="option-checkbox">
                    <input type="checkbox" :checked="selectedStatuses.includes(status.value)" @click.stop />
                  </div>
                  <div class="option-content">
                    <div class="option-name">
                      <span class="status-badge" :class="`status-${status.value}`">{{ status.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div class="results-header">
      <div class="results-info">
        <h4>Flows</h4>
        <span class="results-count">
          {{ filteredFlows.length }}
          <span class="count-label">{{ filteredFlows.length === 1 ? 'flow' : 'flows' }}</span>
          <span v-if="hasActiveFilters" class="filtered-indicator">
            of {{ flows.length }} total
          </span>
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredFlows.length === 0" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">
          <svg v-if="hasActiveFilters" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
            </path>
          </svg>
        </div>
        <h3>{{ hasActiveFilters ? 'No matching flows' : 'No flows found' }}</h3>
        <p>
          <span v-if="hasActiveFilters">
            No flows match your current filter criteria.
            <button @click="clearAllFilters" class="link-btn">Clear filters</button> to see all flows.
          </span>
          <span v-else>
            Get started by creating your first flow instance from a template.
          </span>
        </p>
      </div>
    </div>

    <!-- Flows List -->
    <div v-else class="flows-list">
      <div class="list-header">
        <div class="col-header col-title">Flow</div>
        <div class="col-header col-dates">Dates</div>
        <div class="col-header col-progress">Progress</div>
        <div class="col-header col-actions">Actions</div>
      </div>

      <div v-for="flow in filteredFlows" :key="flow.id" class="flow-row">
        <div class="col-title">
          <h3>{{ flow.name }}</h3>
          <p class="description">{{ flow.description || 'No description provided' }}</p>
        </div>

        <div class="col-dates">
          <div class="dates-info">
            <div v-if="flow.startedAt" class="date-item">
              <span class="date-label">Started:</span>
              <span class="date-value">{{ formatDate(flow.startedAt) }}</span>
            </div>
            <div v-if="flow.expectedEndDate" class="date-item">
              <span class="date-label">Expected:</span>
              <span class="date-value">{{ formatDate(flow.expectedEndDate) }}</span>
            </div>
            <div v-if="flow.completedAt" class="date-item">
              <span class="date-label">Completed:</span>
              <span class="date-value">{{ formatDate(flow.completedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="col-progress">
          <div class="progress-info">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${getFlowProgress(flow)}%` }"></div>
            </div>
            <span class="progress-text">{{ getFlowProgress(flow) }}%</span>
          </div>
        </div>

        <div class="col-actions">
          <NuxtLink :to="`/flows/${flow.id}/work`" class="btn btn-primary">Work</NuxtLink>
          <button @click="$emit('delete', flow)" class="btn btn-icon btn-danger" title="Delete flow">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create New Flow Actions -->
    <div class="flow-actions">
      <button @click="$emit('create')" class="btn btn-primary create-flow-btn">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span>Flow</span>
      </button>
    </div>


  </div>
</template>

<script setup lang="ts">
import type { Flow } from '../../../types/Flow'
import type { FlowTemplate } from '../../../types/FlowTemplate'

// Props
const props = defineProps<{
  flows: Flow[]
}>()

// Emits
const emit = defineEmits<{
  delete: [flow: Flow]
  create: []
}>()

// Load templates to get template names
const { data: templatesData } = await useFetch('/api/templates')
const templates = computed(() => templatesData.value?.data || [])

// Load users data for filtering
const { data: usersData } = await useFetch('/api/users')
const users = computed(() => usersData.value?.data || [])

// Filter state
const textSearchQuery = ref('')
const selectedStatuses = ref<string[]>([])
const selectedUserIds = ref<string[]>([])

// Dropdown state
const statusDropdownOpen = ref(false)
const usersDropdownOpen = ref(false)
const usersSearchQuery = ref('')



// Available status options
const availableStatuses = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' }
]

// Computed properties
const selectedUsers = computed(() => {
  return users.value.filter(user => selectedUserIds.value.includes(user.id))
})

const filteredUsers = computed(() => {
  if (!usersSearchQuery.value) return users.value
  const query = usersSearchQuery.value.toLowerCase()
  return users.value.filter(user =>
    (user.name && user.name.toLowerCase().includes(query)) ||
    (user.email && user.email.toLowerCase().includes(query))
  )
})

const hasActiveFilters = computed(() => 
  textSearchQuery.value.trim() !== '' || 
  selectedStatuses.value.length > 0 ||
  selectedUserIds.value.length > 0
)

const filteredFlows = computed(() => {
  let filtered = [...props.flows]

  // Text search filter
  if (textSearchQuery.value.trim()) {
    const query = textSearchQuery.value.toLowerCase()
    filtered = filtered.filter(flow => 
      flow.name.toLowerCase().includes(query) ||
      (flow.description && flow.description.toLowerCase().includes(query)) ||
      getTemplateName(flow.templateId).toLowerCase().includes(query)
    )
  }

  // Status filter
  if (selectedStatuses.value.length > 0) {
    filtered = filtered.filter(flow => 
      selectedStatuses.value.includes(getFlowStatus(flow))
    )
  }

  // User filter (AND logic - flow must have ALL selected users)
  if (selectedUserIds.value.length > 0) {
    filtered = filtered.filter(flow => {
      const flowUserIds = new Set<string>()

      // Collect all user IDs from flow elements
      flow.elements.forEach(element => {
        if (element.ownerId) {
          flowUserIds.add(element.ownerId)
        }
        if (element.consultedUserIds) {
          element.consultedUserIds.forEach(userId => flowUserIds.add(userId))
        }
      })

      // Check if flow contains ALL selected users
      return selectedUserIds.value.every(userId => flowUserIds.has(userId))
    })
  }

  return filtered
})

// Methods
const getTemplateName = (templateId: string): string => {
  const template = templates.value.find(t => t.id === templateId)
  return template?.name || 'Unknown Template'
}

const getFlowStatus = (flow: Flow): string => {
  if (flow.completedAt) return 'completed'
  if (!flow.startedAt) return 'not-started'
  
  // Check if overdue
  if (flow.expectedEndDate && new Date(flow.expectedEndDate) < new Date()) {
    return 'overdue'
  }
  
  return 'in-progress'
}

const getStatusLabel = (status: string): string => {
  const statusItem = availableStatuses.find(s => s.value === status)
  return statusItem?.label || status
}

const getFlowProgress = (flow: Flow): number => {
  if (flow.completedAt) return 100
  if (!flow.startedAt) return 0
  
  // Only count action elements for progress (state and artefact are more status-oriented)
  const totalElements = flow.elements.filter(el => el.type === 'action').length
  
  if (totalElements === 0) return 0
  
  // Count completed action elements
  const completedElements = flow.elements.filter(el => 
    el.type === 'action' && el.status === 'completed'
  ).length
  
  return Math.round((completedElements / totalElements) * 100)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}

const toggleUsersDropdown = () => {
  usersDropdownOpen.value = !usersDropdownOpen.value
  if (usersDropdownOpen.value) {
    statusDropdownOpen.value = false
    usersSearchQuery.value = ''
  }
}

const toggleStatusDropdown = () => {
  statusDropdownOpen.value = !statusDropdownOpen.value
  if (statusDropdownOpen.value) {
    usersDropdownOpen.value = false
  }
}

const toggleUserFilter = (userId: string) => {
  const index = selectedUserIds.value.indexOf(userId)
  if (index > -1) {
    selectedUserIds.value.splice(index, 1)
  } else {
    selectedUserIds.value.push(userId)
  }
}

const removeUserFilter = (userId: string) => {
  const index = selectedUserIds.value.indexOf(userId)
  if (index > -1) {
    selectedUserIds.value.splice(index, 1)
  }
}

const toggleStatusFilter = (status: string) => {
  const index = selectedStatuses.value.indexOf(status)
  if (index > -1) {
    selectedStatuses.value.splice(index, 1)
  } else {
    selectedStatuses.value.push(status)
  }
}

const removeStatusFilter = (status: string) => {
  const index = selectedStatuses.value.indexOf(status)
  if (index > -1) {
    selectedStatuses.value.splice(index, 1)
  }
}

const clearTextFilter = () => {
  textSearchQuery.value = ''
}

const clearAllFilters = () => {
  textSearchQuery.value = ''
  selectedStatuses.value = []
  selectedUserIds.value = []
}



// Handle click outside dropdowns
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.button-filter')) {
    statusDropdownOpen.value = false
    usersDropdownOpen.value = false
  }
}

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    statusDropdownOpen.value = false
    usersDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.flows-overview {
  width: 100%;
}

/* Modern Filter Styles */
.filters-container {
  margin-bottom: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  overflow: visible;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.filter-title h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
}

.filter-icon {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.clear-all-btn svg {
  width: 16px;
  height: 16px;
}

.filters-grid {
  padding: 1rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  overflow: visible;
}

.text-search-section {
  flex: 1;
  min-width: 300px;
}

.button-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.button-filter {
  position: relative;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-button:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.filter-button.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
}

.filter-button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.count-badge {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.filter-button.active .count-badge {
  background: #1d4ed8;
}

.chevron {
  width: 14px;
  height: 14px;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.text-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.text-search-wrapper .search-icon {
  position: absolute;
  left: 0.75rem;
  width: 18px;
  height: 18px;
  color: #9ca3af;
  z-index: 1;
}

.text-search-input {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 2.75rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.text-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.text-search-input::placeholder {
  color: #9ca3af;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.clear-search-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.clear-search-btn svg {
  width: 12px;
  height: 12px;
}

.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  max-height: 320px;
  overflow: hidden;
}

.button-dropdown {
  min-width: 280px;
  max-height: 400px;
}

.selected-section {
  border-bottom: 1px solid #f3f4f6;
  background: #f8fafc;
}

.section-header {
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
}

.selected-items {
  max-height: 120px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.15s ease;
}

.selected-item:hover {
  background: #f1f5f9;
}

.selected-item:last-child {
  border-bottom: none;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  color: #dc2626;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #b91c1c;
}

.remove-btn svg {
  width: 14px;
  height: 14px;
}

.search-container {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #fafafa;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.options-container {
  max-height: 160px;
  overflow-y: auto;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f9fafb;
  transition: background-color 0.15s ease;
}

.option-item:hover {
  background: #f8fafc;
}

.option-item:last-child {
  border-bottom: none;
}

.option-checkbox {
  position: relative;
  display: flex;
  align-items: center;
}

.option-checkbox input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.option-content {
  flex: 1;
  min-width: 0;
}

.option-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-detail {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-options {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-not-started {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-in-progress {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-overdue {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
}



.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.results-info h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.results-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.count-label {
  font-weight: 500;
}

.filtered-indicator {
  color: #3b82f6;
  font-weight: 500;
}

.empty-state {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  color: #667eea;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
}

.empty-content h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-content p {
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
}

.link-btn:hover {
  color: #5a67d8;
}

.flows-list {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.08);
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 180px 120px 140px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(102, 126, 234, 0.05);
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.flow-row {
  display: grid;
  grid-template-columns: 2fr 180px 120px 140px;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(102, 126, 234, 0.05);
  align-items: center;
  transition: all 0.3s ease;
}

.flow-row:hover {
  background: rgba(102, 126, 234, 0.03);
}

.flow-row:last-child {
  border-bottom: none;
}

.col-title h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.col-title .description {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-name {
  font-size: 0.9rem;
  color: #667eea;
  font-weight: 500;
}

.dates-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-item {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
}

.date-label {
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 0.1rem;
}

.date-value {
  color: #374151;
  font-weight: 600;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.progress-bar {
  width: 60px;
  height: 8px;
  background: rgba(107, 114, 128, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.btn-secondary:hover {
  background: rgba(107, 114, 128, 0.2);
  transform: translateY(-1px);
}

.btn-danger {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.2);
}

.btn-danger:hover {
  background: rgba(248, 113, 113, 0.2);
  transform: translateY(-1px);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

/* Create Flow Actions */
.flow-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  padding: 0 0.5rem;
}

.create-flow-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.create-flow-btn .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.create-flow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(102, 126, 234, 0.3), 0 4px 6px -2px rgba(102, 126, 234, 0.2);
}



/* Responsive Design */
@media (max-width: 1024px) {
  .filters-grid {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .text-search-section {
    min-width: auto;
  }

  .button-filters {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .editor-modal-overlay {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .filters-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .filters-grid {
    padding: 0.75rem 1rem;
  }

  .button-dropdown {
    min-width: 260px;
  }

  .flow-actions {
    justify-content: center;
  }

  .editor-modal-overlay {
    padding: 0.5rem;
  }

  .editor-modal-container {
    border-radius: 12px;
  }
}
</style>