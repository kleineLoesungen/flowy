<template>
  <div class="flow-templates-overview">
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
            <input v-model="textSearchQuery" type="text" placeholder="Search templates by name or description..."
              class="text-search-input" />
            <button v-if="textSearchQuery" @click="clearTextFilter" class="clear-search-btn" title="Clear search">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="button-filters">
          <!-- Note: Advanced filters (Teams, Users, Artefacts) are disabled in overview mode for performance.
               For detailed filtering, please access individual template pages. Only text search is available here. -->
          <!-- Teams Filter Button - Disabled in overview mode -->
          <div class="button-filter">
            <button class="filter-button" @click="toggleTeamsDropdown" :class="{ 'active': selectedTeams.length > 0 }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
              </svg>
              <span>Teams</span>
              <span v-if="selectedTeams.length > 0" class="count-badge">{{ selectedTeams.length }}</span>
              <svg class="chevron" :class="{ 'rotated': teamsDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-if="teamsDropdownOpen" class="dropdown-panel button-dropdown">
              <!-- Selected Teams Section -->
              <div v-if="selectedTeams.length > 0" class="selected-section">
                <div class="section-header">Selected Teams</div>
                <div class="selected-items">
                  <div v-for="team in selectedTeams" :key="team.id" class="selected-item">
                    <div class="item-content">
                      <div class="item-name">{{ team.name }}</div>
                      <div class="item-detail">{{ team.users?.length || 0 }} members</div>
                    </div>
                    <button @click="removeTeamFilter(team.id)" class="remove-btn">
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
                  <input v-model="teamsSearchQuery" type="text" placeholder="Search teams..." class="search-input"
                    @click.stop />
                </div>
              </div>

              <!-- Available Options -->
              <div class="options-container">
                <div v-for="team in filteredTeams" :key="team.id" class="option-item"
                  @click.stop="toggleTeamFilter(team.id)">
                  <div class="option-checkbox">
                    <input type="checkbox" :checked="selectedTeamIds.includes(team.id)" />
                  </div>
                  <div class="option-content">
                    <div class="option-name">{{ team.name }}</div>
                    <div class="option-detail">{{ team.users?.length || 0 }} members</div>
                  </div>
                </div>

                <div v-if="filteredTeams.length === 0" class="no-options">
                  <span v-if="teamsSearchQuery">No teams found for "{{ teamsSearchQuery }}"</span>
                  <span v-else>No teams available</span>
                </div>
              </div>
            </div>
          </div>

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
                    <input type="checkbox" :checked="selectedUserIds.includes(user.id)" />
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

          <!-- Artefacts Filter Button -->
          <div class="button-filter">
            <button class="filter-button" @click="toggleArtefactsDropdown" :class="{ 'active': selectedArtefacts.length > 0 }">
              <svg class="filter-label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                </path>
              </svg>
              <span>Artefacts</span>
              <span v-if="selectedArtefacts.length > 0" class="count-badge">{{ selectedArtefacts.length }}</span>
              <svg class="chevron" :class="{ 'rotated': artefactsDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-if="artefactsDropdownOpen" class="dropdown-panel button-dropdown">
              <!-- Selected Artefacts Section -->
              <div v-if="selectedArtefacts.length > 0" class="selected-section">
                <div class="section-header">Selected Artefacts</div>
                <div class="selected-items">
                  <div v-for="artefact in selectedArtefacts" :key="artefact" class="selected-item">
                    <div class="item-content">
                      <div class="item-name">{{ artefact }}</div>
                    </div>
                    <button @click="removeArtefactFilter(artefact)" class="remove-btn">
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
                  <input v-model="artefactsSearchQuery" type="text" placeholder="Search artefacts..."
                    class="search-input" @click.stop />
                </div>
              </div>

              <!-- Available Options -->
              <div class="options-container">
                <div v-for="artefact in filteredArtefacts" :key="artefact" class="option-item"
                  @click.stop="toggleArtefactFilter(artefact)">
                  <div class="option-checkbox">
                    <input type="checkbox" :checked="selectedArtefactNames.includes(artefact)" />
                  </div>
                  <div class="option-content">
                    <div class="option-name">{{ artefact }}</div>
                  </div>
                </div>

                <div v-if="filteredArtefacts.length === 0" class="no-options">
                  <span v-if="artefactsSearchQuery">No artefacts found for "{{ artefactsSearchQuery }}"</span>
                  <span v-else>No artefacts available</span>
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
        <h4>Templates</h4>
        <span class="results-count">
          {{ filteredTemplates.length }}
          <span class="count-label">{{ filteredTemplates.length === 1 ? 'template' : 'templates' }}</span>
          <span v-if="hasActiveFilters" class="filtered-indicator">
            of {{ templates.length }} total
          </span>
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredTemplates.length === 0" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">
          <svg v-if="hasActiveFilters" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
            </path>
          </svg>
        </div>
        <h3>{{ hasActiveFilters ? 'No matching templates' : 'No templates found' }}</h3>
        <p>
          <span v-if="hasActiveFilters">
            No templates match your current filter criteria.
            <button @click="clearAllFilters" class="link-btn">Clear filters</button> to see all templates.
          </span>
          <span v-else>
            Get started by creating your first flow template.
          </span>
        </p>
      </div>
    </div>

    <!-- Templates List -->
    <div v-else class="templates-list">
      <div class="list-header">
        <div class="col-header col-title">Template</div>
        <div class="col-header col-elements">Elements</div>
        <div class="col-header col-flows">Flows</div>
        <div class="col-header col-duration">Duration</div>
        <div class="col-header col-actions">Actions</div>
      </div>

      <div v-for="template in filteredTemplates" :key="template.id" class="template-row">
        <div class="col-title">
          <h3>{{ template.name }}</h3>
          <p class="description">{{ template.description || 'No description provided' }}</p>
        </div>

        <div class="col-elements">
          <span class="count">{{ template.elementCount }}</span>
          <span class="label">{{ template.elementCount === 1 ? 'element' : 'elements' }}</span>
        </div>

        <div class="col-flows">
          <button 
            class="flow-count-btn" 
            @click="openFlowsModal(template)"
            :disabled="(flowCountsByTemplate.get(template.id) || 0) === 0"
          >
            <span class="count">{{ flowCountsByTemplate.get(template.id) || 0 }}</span>
            <span class="label">{{ (flowCountsByTemplate.get(template.id) || 0) === 1 ? 'flow' : 'flows' }}</span>
          </button>
        </div>

        <div class="col-duration">
          <div class="duration-info">
            <span class="duration-main">
              {{ template.duration.display }}
            </span>
            <span class="label">
              {{ template.duration.label }}
            </span>
          </div>
        </div>
        <div class="col-actions">
          <NuxtLink :to="`/templates/${template.id}`" class="btn btn-primary">View</NuxtLink>
          <NuxtLink 
            v-if="canCreateFlow"
            :to="`/flows/add?templateId=${template.id}`" 
            class="btn btn-icon btn-success" 
            title="Create new flow from this template"
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </NuxtLink>
          <NuxtLink 
            v-if="canEdit"
            :to="`/templates/${template.id}/edit`" 
            class="btn btn-icon btn-secondary" 
            title="Edit template"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </NuxtLink>
          <button 
            v-if="canDelete" 
            @click="$emit('delete', template)" 
            class="btn btn-icon btn-danger" 
            title="Delete template"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Flows Modal -->
    <div v-if="showFlowsModal" class="modal-overlay" @click="closeFlowsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Flows from "{{ selectedTemplateForModal?.name }}"</h3>
          <button @click="closeFlowsModal" class="modal-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="loadingModalFlows" class="loading-flows">
            <div class="loading-spinner"></div>
            <p>Loading flows...</p>
          </div>
          
          <div v-else-if="selectedTemplateFlows.length === 0" class="empty-flows">
            <p>No flows have been created from this template yet.</p>
          </div>
          
          <div v-else class="flows-list">
            <div class="flows-list-header">
              <div class="flow-col-title">Flow Name</div>
              <div class="flow-col-timeframe">Timeframe</div>
              <div class="flow-col-action">Action</div>
            </div>
            
            <div v-for="flow in selectedTemplateFlows" :key="flow.id" class="flow-item">
              <div class="flow-col-title">
                <h4>{{ flow.name }}</h4>
                <p v-if="flow.description" class="flow-description">{{ flow.description }}</p>
              </div>
              
              <div class="flow-col-timeframe">
                <span class="timeframe-text">{{ formatTimeframe(flow) }}</span>
                <span v-if="flow.completedAt" class="status-badge completed">Completed</span>
                <span v-else-if="flow.startedAt" class="status-badge in-progress">In Progress</span>
                <span v-else class="status-badge not-started">Not Started</span>
              </div>
              
              <div class="flow-col-action">
                <NuxtLink 
                  :to="`/flows/${flow.id}/work`" 
                  class="btn btn-primary flow-link"
                  target="_blank"
                  title="Open flow in new tab"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  Open Flow
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FlowTemplate, FlowElement } from '~~/server/db/schema'

// Optimized template overview interface
interface TemplateOverview {
  id: string
  name: string
  description?: string
  elementCount: number
  flowCount: number
  duration: {
    range: {
      min: number
      max: number
    }
    display: string
    label: string
  }
}

// Flow overview interface
interface FlowOverview {
  id: string
  name: string
  description?: string
  templateId?: string
  startedAt?: string
  completedAt?: string
  expectedEndDate?: string
  hidden?: boolean
}

// Props
const props = defineProps<{
  templates: TemplateOverview[]
  canDelete?: boolean
  canEdit?: boolean
  canCreateFlow?: boolean
}>()

// Default props to true to maintain backwards compatibility
const canDelete = computed(() => props.canDelete ?? true)
const canEdit = computed(() => props.canEdit ?? true)
const canCreateFlow = computed(() => props.canCreateFlow ?? true)

// Emits
defineEmits<{
  delete: [template: TemplateOverview]
}>()

// Load users and teams data for filtering
const { data: usersData, error: usersError } = await useFetch('/api/users')
const { data: teamsData, error: teamsError } = await useFetch('/api/teams')
const users = computed(() => {
  if (usersError.value) {
    console.warn('Failed to load users:', usersError.value)
    return []
  }
  return usersData.value?.data || []
})
const teams = computed(() => {
  if (teamsError.value) {
    console.warn('Failed to load teams:', teamsError.value)
    return []
  }
  return teamsData.value?.data || []
})

// Filter state
const selectedTeamIds = ref<string[]>([])
const selectedUserIds = ref<string[]>([])
const selectedArtefactNames = ref<string[]>([])
const textSearchQuery = ref('')

// Dropdown state
const teamsDropdownOpen = ref(false)
const usersDropdownOpen = ref(false)
const artefactsDropdownOpen = ref(false)
const teamsSearchQuery = ref('')
const usersSearchQuery = ref('')
const artefactsSearchQuery = ref('')

// Computed properties
const selectedTeams = computed(() => {
  return teams.value.filter(team => selectedTeamIds.value.includes(team.id))
})

const selectedUsers = computed(() => {
  return users.value.filter(user => selectedUserIds.value.includes(user.id))
})

const selectedArtefacts = computed(() => selectedArtefactNames.value)

// Flow counts per template - use flowCount from template overview data
const flowCountsByTemplate = computed(() => {
  const counts = new Map<string, number>()
  
  props.templates.forEach(template => {
    counts.set(template.id, template.flowCount)
  })
  
  return counts
})

// Modal state
const showFlowsModal = ref(false)
const selectedTemplateForModal = ref<TemplateOverview | null>(null)
const modalFlows = ref<FlowOverview[]>([])
const loadingModalFlows = ref(false)

// Get flows for selected template - fetch when modal opens
const selectedTemplateFlows = computed(() => modalFlows.value)

const filteredTeams = computed(() => {
  if (!teamsSearchQuery.value) return teams.value
  const query = teamsSearchQuery.value.toLowerCase()
  return teams.value.filter(team =>
    team.name && team.name.toLowerCase().includes(query)
  )
})

const filteredUsers = computed(() => {
  if (!usersSearchQuery.value) return users.value
  const query = usersSearchQuery.value.toLowerCase()
  return users.value.filter(user =>
    (user.name && user.name.toLowerCase().includes(query)) ||
    (user.email && user.email.toLowerCase().includes(query))
  )
})

// Get all unique artefact names from templates
const allArtefacts = computed(() => {
  if (!fullTemplates.value || fullTemplates.value.length === 0) {
    return []
  }
  
  const artefacts = new Set<string>()
  
  fullTemplates.value.forEach((template: FlowTemplate) => {
    if (template.elements && Array.isArray(template.elements)) {
      template.elements.forEach((element: FlowElement) => {
        if (element && element.type === 'artefact' && element.name) {
          artefacts.add(element.name)
        }
      })
    }
  })
  
  return Array.from(artefacts).sort()
})

const filteredArtefacts = computed(() => {
  return allArtefacts.value
})

const hasActiveFilters = computed(() => {
  return textSearchQuery.value.trim() !== '' ||
         selectedTeamIds.value.length > 0 ||
         selectedUserIds.value.length > 0 ||
         selectedArtefactNames.value.length > 0
})

// Fetch full template data for advanced filtering
const { data: fullTemplatesData, error: templatesError } = await useFetch<{ data: FlowTemplate[] }>('/api/templates/all')
const fullTemplates = computed(() => {
  if (templatesError.value) {
    console.warn('Failed to load full templates:', templatesError.value)
    return []
  }
  return fullTemplatesData.value?.data || []
})

// Main filtering logic - now supports all filter types
const filteredTemplates = computed(() => {
  let filtered = props.templates

  // Text search filter
  if (textSearchQuery.value.trim()) {
    const query = textSearchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query))
    )
  }

  // Team filter - need to check template elements for team ownership
  if (selectedTeamIds.value.length > 0) {
    filtered = filtered.filter(template => {
      const fullTemplate = fullTemplates.value.find((ft: FlowTemplate) => ft.id === template.id)
      if (!fullTemplate || !fullTemplate.elements) return false
      
      return fullTemplate.elements.some((element: FlowElement) => 
        element.ownerTeamId && selectedTeamIds.value.includes(element.ownerTeamId)
      )
    })
  }

  // User filter - need to check template elements for user ownership through teams
  if (selectedUserIds.value.length > 0) {
    filtered = filtered.filter(template => {
      const fullTemplate = fullTemplates.value.find((ft: FlowTemplate) => ft.id === template.id)
      if (!fullTemplate || !fullTemplate.elements) return false
      
      return fullTemplate.elements.some((element: FlowElement) => {
        if (!element.ownerTeamId) return false
        const team = teams.value.find((t: any) => t.id === element.ownerTeamId)
        if (!team || !Array.isArray(team.users)) return false
        
        return team.users.some((user: any) => selectedUserIds.value.includes(user.id))
      })
    })
  }

  // Artefact filter - check template elements for artefact types
  if (selectedArtefactNames.value.length > 0) {
    filtered = filtered.filter(template => {
      const fullTemplate = fullTemplates.value.find((ft: FlowTemplate) => ft.id === template.id)
      if (!fullTemplate || !fullTemplate.elements) return false
      
      return fullTemplate.elements.some((element: FlowElement) => 
        element.type === 'artefact' && selectedArtefactNames.value.includes(element.name)
      )
    })
  }

  return filtered
})

// Methods
const toggleTeamsDropdown = () => {
  teamsDropdownOpen.value = !teamsDropdownOpen.value
  if (teamsDropdownOpen.value) {
    usersDropdownOpen.value = false
    artefactsDropdownOpen.value = false
    teamsSearchQuery.value = ''
  }
}

const toggleUsersDropdown = () => {
  usersDropdownOpen.value = !usersDropdownOpen.value
  if (usersDropdownOpen.value) {
    teamsDropdownOpen.value = false
    artefactsDropdownOpen.value = false
    usersSearchQuery.value = ''
  }
}

const toggleArtefactsDropdown = () => {
  artefactsDropdownOpen.value = !artefactsDropdownOpen.value
  if (artefactsDropdownOpen.value) {
    teamsDropdownOpen.value = false
    usersDropdownOpen.value = false
    artefactsSearchQuery.value = ''
  }
}

const toggleTeamFilter = (teamId: string) => {
  const index = selectedTeamIds.value.indexOf(teamId)
  if (index > -1) {
    selectedTeamIds.value.splice(index, 1)
  } else {
    selectedTeamIds.value.push(teamId)
  }
}

const removeTeamFilter = (teamId: string) => {
  const index = selectedTeamIds.value.indexOf(teamId)
  if (index > -1) {
    selectedTeamIds.value.splice(index, 1)
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

const toggleArtefactFilter = (artefactName: string) => {
  const index = selectedArtefactNames.value.indexOf(artefactName)
  if (index > -1) {
    selectedArtefactNames.value.splice(index, 1)
  } else {
    selectedArtefactNames.value.push(artefactName)
  }
}

const removeArtefactFilter = (artefactName: string) => {
  const index = selectedArtefactNames.value.indexOf(artefactName)
  if (index > -1) {
    selectedArtefactNames.value.splice(index, 1)
  }
}

const clearTextFilter = () => {
  textSearchQuery.value = ''
}

const clearAllFilters = () => {
  selectedTeamIds.value = []
  selectedUserIds.value = []
  selectedArtefactNames.value = []
  textSearchQuery.value = ''
}

const openFlowsModal = async (template: TemplateOverview) => {
  selectedTemplateForModal.value = template
  showFlowsModal.value = true
  loadingModalFlows.value = true
  modalFlows.value = []
  
  try {
    // Fetch all flows and filter for this template
    const { data } = await $fetch('/api/flows/all')
    
    // Filter flows for this template
    modalFlows.value = (data || []).filter((flow: FlowOverview) => flow.templateId === template.id)
  } catch (error) {
    console.error('Error fetching flows for template:', error)
    modalFlows.value = []
  } finally {
    loadingModalFlows.value = false
  }
}

const closeFlowsModal = () => {
  showFlowsModal.value = false
  selectedTemplateForModal.value = null
  modalFlows.value = []
}

// Format date for display
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format timeframe for display
const formatTimeframe = (flow: any) => {
  const start = flow.startedAt ? formatDate(flow.startedAt) : 'Not started'
  const end = flow.completedAt ? formatDate(flow.completedAt) : (flow.expectedEndDate ? formatDate(flow.expectedEndDate) : 'No end date')
  return `${start} - ${end}`
}

// Handle click outside dropdowns
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.button-filter')) {
    teamsDropdownOpen.value = false
    usersDropdownOpen.value = false
    artefactsDropdownOpen.value = false
  }
}

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    teamsDropdownOpen.value = false
    usersDropdownOpen.value = false
    artefactsDropdownOpen.value = false
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
.flow-templates-overview {
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Modern Filter Styles */
.filters-container {
  margin-bottom: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
  overflow: visible;
  /* Changed from hidden to visible */
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

.item-detail {
  font-size: 0.75rem;
  color: #6b7280;
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
  text-align: center;
  padding: 3rem 1rem;
  background: #fafafa;
  border-radius: 12px;
  border: 1px dashed #d1d5db;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  margin: 0 auto 1rem;
  width: 64px;
  height: 64px;
  color: #9ca3af;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.empty-content p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

.link-btn {
  background: none;
  border: none;
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

.link-btn:hover {
  color: #1d4ed8;
}

.templates-list {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 700;
  color: #475569;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.template-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
}

.template-row:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.template-row:last-child {
  border-bottom: none;
}

.col-title h3 {
  margin: 0 0 0.25rem 0;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.1rem;
  font-weight: 700;
}

.description {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
}

.col-elements,
.col-flows,
.col-duration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.count,
.duration-main {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
}

.duration-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.label {
  font-size: 0.75rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #cbd5e1 0%, #b0bec5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn-danger {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #0d9488 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
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

/* Ensure dropdowns are always visible */
.modern-dropdown {
  isolation: isolate;
  /* Create new stacking context */
}

/* Additional z-index layers to prevent conflicts */
.templates-list {
  position: relative;
  z-index: 1;
}

.filters-container {
  position: relative;
  z-index: 2;
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

  .list-header,
  .template-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .list-header {
    display: none;
  }

  .template-row {
    padding: 1rem;
  }

  .col-title,
  .col-elements,
  .col-flows,
  .col-duration,
  .col-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .col-elements::before {
    content: 'Elements:';
    font-weight: 600;
    color: #34495e;
  }

  .col-flows::before {
    content: 'Flows:';
    font-weight: 600;
    color: #34495e;
  }

  .col-duration::before {
    content: 'Duration:';
    font-weight: 600;
    color: #34495e;
  }

  .col-actions {
    justify-content: flex-start;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }
}

/* Flow Count Button */
.flow-count-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 100%;
}

.flow-count-btn:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.05);
}

.flow-count-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.flow-count-btn .count {
  font-size: 1.25rem;
  font-weight: 600;
  color: #3b82f6;
  line-height: 1;
}

.flow-count-btn:disabled .count {
  color: #9ca3af;
}

/* Modal Styles */
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
  max-width: 800px;
  max-height: 80vh;
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
  color: #334155;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.modal-close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.loading-flows {
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-flows {
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
}

.flows-list {
  display: flex;
  flex-direction: column;
}

.flows-list-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.flow-item {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.flow-item:hover {
  background: #f8fafc;
}

.flow-item:last-child {
  border-bottom: none;
}

.flow-col-title h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.flow-description {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.flow-col-timeframe {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeframe-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-self: flex-start;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.not-started {
  background: #f3f4f6;
  color: #374151;
}

.flow-col-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flow-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  text-decoration: none;
}

.flow-link svg {
  width: 16px;
  height: 16px;
}

/* Responsive Modal Styles */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 85vh;
    margin: 1rem;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-header h3 {
    font-size: 1.125rem;
  }

  .flows-list-header,
  .flow-item {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
  }

  .flows-list-header {
    display: none;
  }

  .flow-item {
    border-bottom: 1px solid #f1f5f9;
  }

  .flow-col-title,
  .flow-col-timeframe,
  .flow-col-action {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .flow-col-action {
    align-items: flex-start;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
  }

  .status-badge {
    align-self: flex-start;
  }
}
</style>