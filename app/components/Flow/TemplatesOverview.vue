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
        <div class="filter-card text-filter-card">
          <div class="filter-card-header">
            <label class="filter-label">
              <svg class="filter-label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Search Templates
            </label>
            <button v-if="textSearchQuery" @click="clearTextFilter" class="clear-filter-btn" title="Clear search">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="text-search-container">
            <div class="text-search-wrapper">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input v-model="textSearchQuery" type="text" placeholder="Search by name or description..."
                class="text-search-input" />
            </div>
          </div>
        </div>

        <!-- Teams Filter -->
        <div class="filter-card">
          <div class="filter-card-header">
            <label class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
              </svg>
              Teams
            </label>
            <span class="filter-count" v-if="selectedTeams.length > 0">{{ selectedTeams.length }}</span>
          </div>

          <div class="modern-dropdown" :class="{ 'is-open': teamsDropdownOpen }">
            <button class="dropdown-trigger" @click="toggleTeamsDropdown"
              :class="{ 'has-selections': selectedTeams.length > 0 }">
              <div class="trigger-content">
                <div v-if="selectedTeams.length === 0" class="placeholder">
                  Select teams...
                </div>
                <div v-else class="selected-preview">
                  <span class="selection-count">{{ selectedTeams.length }} selected</span>
                </div>
              </div>
              <svg class="chevron" :class="{ 'rotated': teamsDropdownOpen }" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-if="teamsDropdownOpen" class="dropdown-panel">
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

              <div class="options-container">
                <div v-for="team in filteredTeams" :key="team.id" class="option-item"
                  @click.stop="toggleTeamFilter(team.id)">
                  <div class="option-checkbox">
                    <input type="checkbox" :checked="selectedTeamIds.includes(team.id)" @click.stop />
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

          <!-- Selected Teams Tags -->
          <div v-if="selectedTeams.length > 0" class="selected-tags">
            <div v-for="team in selectedTeams" :key="team.id" class="tag team-tag">
              <span class="tag-text">{{ team.name }}</span>
              <button @click="removeTeamFilter(team.id)" class="tag-remove">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Users Filter -->
        <div class="filter-card">
          <div class="filter-card-header">
            <label class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
              </svg>
              Users
            </label>
            <span class="filter-count" v-if="selectedUsers.length > 0">{{ selectedUsers.length }}</span>
          </div>

          <div class="modern-dropdown" :class="{ 'is-open': usersDropdownOpen }">
            <button class="dropdown-trigger" @click="toggleUsersDropdown"
              :class="{ 'has-selections': selectedUsers.length > 0 }">
              <div class="trigger-content">
                <div v-if="selectedUsers.length === 0" class="placeholder">
                  Select users...
                </div>
                <div v-else class="selected-preview">
                  <span class="selection-count">{{ selectedUsers.length }} selected</span>
                </div>
              </div>
              <svg class="chevron" :class="{ 'rotated': usersDropdownOpen }" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-if="usersDropdownOpen" class="dropdown-panel">
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

          <!-- Selected Users Tags -->
          <div v-if="selectedUsers.length > 0" class="selected-tags">
            <div v-for="user in selectedUsers" :key="user.id" class="tag user-tag">
              <span class="tag-text">{{ user.name || user.email }}</span>
              <button @click="removeUserFilter(user.id)" class="tag-remove">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Artefacts Filter -->
        <div class="filter-card">
          <div class="filter-card-header">
            <label class="filter-label">
              <svg class="filter-label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                </path>
              </svg>
              Artefacts
            </label>
            <span class="filter-count" v-if="selectedArtefacts.length > 0">{{ selectedArtefacts.length }}</span>
          </div>

          <div class="modern-dropdown" :class="{ 'is-open': artefactsDropdownOpen }">
            <button class="dropdown-trigger" @click="toggleArtefactsDropdown"
              :class="{ 'has-selections': selectedArtefacts.length > 0 }">
              <div class="trigger-content">
                <div v-if="selectedArtefacts.length === 0" class="placeholder">
                  Select artefacts...
                </div>
                <div v-else class="selected-preview">
                  <span class="selection-count">{{ selectedArtefacts.length }} selected</span>
                </div>
              </div>
              <svg class="chevron" :class="{ 'rotated': artefactsDropdownOpen }" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div v-if="artefactsDropdownOpen" class="dropdown-panel">
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

              <div class="options-container">
                <div v-for="artefact in filteredArtefacts" :key="artefact" class="option-item"
                  @click.stop="toggleArtefactFilter(artefact)">
                  <div class="option-checkbox">
                    <input type="checkbox" :checked="selectedArtefactNames.includes(artefact)" @click.stop />
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

          <!-- Selected Artefacts Tags -->
          <div v-if="selectedArtefacts.length > 0" class="selected-tags">
            <div v-for="artefact in selectedArtefacts" :key="artefact" class="tag artefact-tag">
              <span class="tag-text">{{ artefact }}</span>
              <button @click="removeArtefactFilter(artefact)" class="tag-remove">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
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
        <div class="col-header col-duration">Duration</div>
        <div class="col-header col-actions">Actions</div>
      </div>

      <div v-for="template in filteredTemplates" :key="template.id" class="template-row">
        <div class="col-title">
          <h3>{{ template.name }}</h3>
          <p class="description">{{ template.description || 'No description provided' }}</p>
        </div>

        <div class="col-elements">
          <span class="count">{{ template.elements.length }}</span>
          <span class="label">{{ template.elements.length === 1 ? 'element' : 'elements' }}</span>
        </div>

        <div class="col-duration">
          <div class="duration-info">
            <span class="duration-main">
              {{ formatDurationRange(calculateFlowDuration(template)) }}
            </span>
            <span class="label">
              {{ getDurationLabel(calculateFlowDuration(template)) }}
            </span>
          </div>
        </div>

        <div class="col-actions">
          <NuxtLink :to="`/templates/${template.id}`" class="btn btn-primary">View</NuxtLink>
          <NuxtLink :to="`/templates/${template.id}/edit`" class="btn btn-secondary">Edit</NuxtLink>
          <button @click="$emit('delete', template)" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FlowTemplate } from '../../../types/FlowTemplate'
import type { User } from '../../../types/User'
import type { Team } from '../../../types/Team'
import {
  calculateTotalDuration,
  calculateFlowDuration,
  formatDurationRange,
  getDurationLabel
} from '../../../utils/flowDurationCalculator'

// Props
const props = defineProps<{
  templates: FlowTemplate[]
}>()

// Emits
defineEmits<{
  delete: [template: FlowTemplate]
}>()

// Load users and teams data
const { data: usersData } = await useFetch('/api/users')
const { data: teamsData } = await useFetch('/api/teams')
const users = computed(() => usersData.value?.data || [])
const teams = computed(() => teamsData.value?.data || [])

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
  const artefactNames = new Set<string>()
  props.templates.forEach(template => {
    template.elements.forEach(element => {
      if (element.type === 'artefact' && element.name) {
        artefactNames.add(element.name)
      }
    })
  })
  return Array.from(artefactNames).sort()
})

const filteredArtefacts = computed(() => {
  if (!artefactsSearchQuery.value) return allArtefacts.value
  const query = artefactsSearchQuery.value.toLowerCase()
  return allArtefacts.value.filter(artefact =>
    artefact.toLowerCase().includes(query)
  )
})

const hasActiveFilters = computed(() => {
  return selectedTeamIds.value.length > 0 ||
    selectedUserIds.value.length > 0 ||
    selectedArtefactNames.value.length > 0 ||
    textSearchQuery.value.trim() !== ''
})

// Main filtering logic
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

  // If no other filters are active, return text-filtered results
  if (selectedTeamIds.value.length === 0 &&
    selectedUserIds.value.length === 0 &&
    selectedArtefactNames.value.length === 0) {
    return filtered
  }

  return filtered.filter(template => {
    // Team filter (AND logic - template must have users from ALL selected teams)
    if (selectedTeamIds.value.length > 0) {
      const templateUserIds = new Set<string>()

      // Collect all user IDs from template elements
      template.elements.forEach(element => {
        if (element.ownerId) {
          templateUserIds.add(element.ownerId)
        }
        if (element.consultedUserIds) {
          element.consultedUserIds.forEach(userId => templateUserIds.add(userId))
        }
      })

      // Check if template contains users from ALL selected teams
      const hasAllTeams = selectedTeamIds.value.every(teamId => {
        const team = teams.value.find(t => t.id === teamId)
        if (!team || !team.users) return false

        // Check if template has at least one user from this team
        return team.users.some(user => templateUserIds.has(user.id))
      })

      if (!hasAllTeams) return false
    }

    // User filter (AND logic - template must have ALL selected users)
    if (selectedUserIds.value.length > 0) {
      const templateUserIds = new Set<string>()

      // Collect all user IDs from template elements
      template.elements.forEach(element => {
        if (element.ownerId) {
          templateUserIds.add(element.ownerId)
        }
        if (element.consultedUserIds) {
          element.consultedUserIds.forEach(userId => templateUserIds.add(userId))
        }
      })

      // Check if template contains ALL selected users
      const hasAllUsers = selectedUserIds.value.every(userId =>
        templateUserIds.has(userId)
      )

      if (!hasAllUsers) return false
    }

    // Artefact filter (AND logic - template must have ALL selected artefacts)
    if (selectedArtefactNames.value.length > 0) {
      const templateArtefacts = new Set<string>()

      // Collect all artefact names from template elements
      template.elements.forEach(element => {
        if (element.type === 'artefact' && element.name) {
          templateArtefacts.add(element.name)
        }
      })

      // Check if template contains ALL selected artefacts
      const hasAllArtefacts = selectedArtefactNames.value.every(artefactName =>
        templateArtefacts.has(artefactName)
      )

      if (!hasAllArtefacts) return false
    }

    return true
  })
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

// Handle click outside dropdowns
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.modern-dropdown')) {
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
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
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
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1rem;
  overflow: visible;
  /* Ensure dropdowns can extend beyond grid */
}

.filter-card {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem;
  transition: all 0.2s ease;
  overflow: visible;
  /* Ensure dropdowns aren't clipped */
}

.filter-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.text-filter-card {
  background: #f8fafc;
}

.clear-filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.15s ease;
  flex-shrink: 0;
}

.clear-filter-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.clear-filter-btn svg {
  width: 12px;
  height: 12px;
  color: #6b7280;
}

.text-search-container {
  margin-top: 0.5rem;
}

.text-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.text-search-wrapper .search-icon {
  position: absolute;
  left: 0.75rem;
  width: 16px;
  height: 16px;
  color: #9ca3af;
  z-index: 1;
}

.text-search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
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

.filter-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.filter-label-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.filter-count {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  min-width: 20px;
  text-align: center;
}

.modern-dropdown {
  position: relative;
  z-index: 1;
  /* Establish stacking context */
}

.modern-dropdown.is-open {
  z-index: 1001;
  /* Higher z-index when open */
}

.dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.dropdown-trigger:hover {
  border-color: #9ca3af;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dropdown-trigger.has-selections {
  border-color: #3b82f6;
  background: #eff6ff;
}

.trigger-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.placeholder {
  color: #9ca3af;
}

.selection-count {
  color: #1d4ed8;
  font-weight: 500;
}

.chevron {
  width: 16px;
  height: 16px;
  color: #6b7280;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.chevron.rotated {
  transform: rotate(180deg);
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
  /* Increased z-index significantly */
  max-height: 240px;
  overflow: hidden;
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

.selected-tags {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  max-width: 200px;
}

.team-tag {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.user-tag {
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.artefact-tag {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fed7aa;
}

.tag-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  flex-shrink: 0;
}

.tag-remove:hover {
  background: rgba(0, 0, 0, 0.2);
}

.tag-remove svg {
  width: 10px;
  height: 10px;
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
  grid-template-columns: 2fr 1fr 1fr 1fr;
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
  grid-template-columns: 2fr 1fr 1fr 1fr;
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
@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .filters-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
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
</style>