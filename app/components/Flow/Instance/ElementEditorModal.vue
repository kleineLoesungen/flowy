<template>
  <div class="element-editor-modal">
    <!-- Modal Overlay -->
    <div class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click="handleModalClick">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>{{ isNewElement ? 'Add Element' : 'Edit Element' }}</h2>
          <button @click="handleClose" class="close-button">
            <span class="close-icon">×</span>
          </button>
        </div>

        <!-- Element Form -->
        <div class="modal-body">
          <form @submit.prevent="handleSave" class="element-form">
            <!-- Element Name -->
            <div class="form-group">
              <label for="element-name">Element Name</label>
              <input 
                id="element-name"
                v-model="elementData.name"
                type="text" 
                required
                placeholder="Enter element name"
                class="form-control"
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="element-description">{{ elementData.type === 'artefact' ? 'Content' : 'Description' }}</label>
              <UIMarkdownEditor 
                v-model="elementData.description"
                :rows="elementData.type === 'artefact' ? 15 : 5"
                :placeholder="elementData.type === 'artefact' ? 'Enter artefact content using markdown...' : 'Enter element description using markdown...'"
              />
            </div>

            <!-- Element Type -->
            <div class="form-group">
              <label for="element-type">Element Type</label>
              <div class="searchable-dropdown">
                <div 
                  class="dropdown-input" 
                  :class="{ 'open': typeDropdownOpen }"
                  @click="toggleTypeDropdown"
                >
                  <span v-if="selectedElementType" class="selected-value">
                    {{ selectedElementType.label }}
                  </span>
                  <span v-else class="placeholder">Select element type...</span>
                  <svg class="dropdown-arrow" :class="{ 'rotated': typeDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <div v-show="typeDropdownOpen" class="dropdown-menu">
                  <div v-if="elementTypes.length > 10" class="search-input-wrapper">
                    <input 
                      v-model="typeSearchQuery"
                      type="text"
                      placeholder="Search types..."
                      class="search-input"
                      @click.stop
                    />
                  </div>
                  <div class="dropdown-options">
                    <div 
                      v-for="type in filteredElementTypes" 
                      :key="type.value"
                      class="dropdown-option"
                      :class="{ 'selected': elementData.type === type.value }"
                      @click.stop="selectElementType(type)"
                    >
                      <span>{{ type.label }}</span>
                    </div>
                    <div v-if="filteredElementTypes.length === 0 && typeSearchQuery" class="no-results">
                      No types found
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Status (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <label for="element-status">Status</label>
              <div class="searchable-dropdown">
                <div 
                  class="dropdown-input" 
                  :class="{ 'open': statusDropdownOpen }"
                  @click="toggleStatusDropdown"
                >
                  <span v-if="selectedElementStatus" class="selected-value">
                    {{ selectedElementStatus.label }}
                  </span>
                  <span v-else class="placeholder">Select status...</span>
                  <svg class="dropdown-arrow" :class="{ 'rotated': statusDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <div v-show="statusDropdownOpen" class="dropdown-menu">
                  <div class="dropdown-options">
                    <div 
                      v-for="status in elementStatuses" 
                      :key="status.value"
                      class="dropdown-option"
                      :class="{ 'selected': elementData.status === status.value }"
                      @click.stop="selectElementStatus(status)"
                    >
                      <span>{{ status.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Completed At (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <label for="element-completed-at">Completed At</label>
              <input 
                id="element-completed-at"
                v-model="completedAtLocal"
                type="date" 
                placeholder="Enter completion date"
                class="form-control"
              />
            </div>

            <!-- Expected End Date (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <label for="element-expected-end">Expected End Date</label>
              <input 
                id="element-expected-end"
                v-model="expectedEndLocal"
                type="date" 
                placeholder="Enter expected end date"
                class="form-control"
              />
            </div>



            <!-- Owner Team (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <div class="form-label-with-helper">
                <label for="element-owner-team">Owner Team</label>
                <button 
                  @click="openTeamAssignmentDialog('owner')"
                  type="button"
                  class="helper-btn"
                  title="Open team assignment helper"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 01 9.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </button>
              </div>
              <div v-if="ownerTeamChanged" class="owner-team-hint">
                <svg class="hint-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="hint-text">Note: If you remove your team's ownership, you may lose editing access to this element.</span>
              </div>
              <div class="searchable-dropdown">
                <div 
                  class="dropdown-input" 
                  :class="{ 'open': ownerDropdownOpen }"
                  @click="toggleOwnerDropdown"
                >
                  <span v-if="selectedOwnerTeam" class="selected-value">
                    {{ selectedOwnerTeam.name }}
                  </span>
                  <span v-else class="placeholder">Select owner team...</span>
                  <svg class="dropdown-arrow" :class="{ 'rotated': ownerDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <div v-show="ownerDropdownOpen" class="dropdown-menu">
                  <div v-if="teams.length > 10" class="search-input-wrapper">
                    <input 
                      v-model="ownerSearchQuery"
                      type="text"
                      placeholder="Search teams..."
                      class="search-input"
                      @click.stop
                    />
                  </div>
                  <div class="dropdown-options">
                    <div 
                      class="dropdown-option"
                      :class="{ 'selected': elementData.ownerTeamId === null }"
                      @click.stop="selectOwnerTeam(null)"
                    >
                      <span>No Owner Team</span>
                    </div>
                    <div 
                      v-for="team in filteredOwnerTeams" 
                      :key="team.id"
                      class="dropdown-option"
                      :class="{ 'selected': elementData.ownerTeamId === team.id }"
                      @click.stop="selectOwnerTeam(team)"
                    >
                      <span>{{ team.name }}</span>
                    </div>
                    <div v-if="filteredOwnerTeams.length === 0 && ownerSearchQuery" class="no-results">
                      No teams found
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Consulted Teams (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <div class="form-label-with-helper">
                <label>Consulted Teams</label>
                <button 
                  @click="openTeamAssignmentDialog('consulted')"
                  type="button"
                  class="helper-btn"
                  title="Open team assignment helper"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 01 9.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </button>
              </div>
              <div class="searchable-multi-dropdown">
                <div 
                  class="dropdown-input multi" 
                  :class="{ 'open': consultedDropdownOpen }"
                  @click="toggleConsultedDropdown"
                >
                  <div class="selected-tags" v-if="selectedConsultedTeams.length > 0">
                    <span 
                      v-for="team in selectedConsultedTeams" 
                      :key="team.id"
                      class="tag"
                    >
                      {{ team.name }}
                      <button 
                        @click.stop="removeConsultedTeam(team.id)"
                        class="tag-remove"
                      >×</button>
                    </span>
                  </div>
                  <span v-else class="placeholder">Select consulted teams...</span>
                  <svg class="dropdown-arrow" :class="{ 'rotated': consultedDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <div v-show="consultedDropdownOpen" class="dropdown-menu">
                  <div v-if="teams.length > 10" class="search-input-wrapper">
                    <input 
                      v-model="consultedSearchQuery"
                      type="text"
                      placeholder="Search teams..."
                      class="search-input"
                      @click.stop
                    />
                  </div>
                  <div class="dropdown-options">
                    <div 
                      v-for="team in filteredConsultedTeams" 
                      :key="team.id"
                      class="dropdown-option checkbox-option"
                      :class="{ 'selected': elementData.consultedTeamIds?.includes(team.id) }"
                      @click.stop="toggleConsultedTeam(team.id)"
                    >
                      <input 
                        type="checkbox" 
                        :checked="elementData.consultedTeamIds?.includes(team.id) || false"
                        @click.stop
                      />
                      <span>{{ team.name }}</span>
                    </div>
                    <div v-if="filteredConsultedTeams.length === 0 && consultedSearchQuery" class="no-results">
                      No teams found
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <div class="footer-left">
            <!-- Left side can be used for additional actions if needed -->
          </div>
          <div class="footer-right">
            <button @click="handleClose" type="button" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="handleSave" type="button" class="btn btn-primary">
              {{ isNewElement ? 'Create Element' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Assignment Dialog -->
    <TeamAssignmentDialog
      v-if="teamAssignmentDialogOpen"
      :mode="teamAssignmentMode"
      :current-owner-team-id="elementData.ownerTeamId"
      :current-consulted-team-ids="elementData.consultedTeamIds"
      :title="teamAssignmentMode === 'owner' ? 'Assign Owner Team' : 'Assign Consulted Teams'"
      @apply="handleTeamAssignment"
      @close="closeTeamAssignmentDialog"
    />
  </div>
</template>

<script setup lang="ts">
import type { Element } from '../../../../types/Element'
import TeamAssignmentDialog from '../TeamAssignmentDialog.vue'

interface Props {
  element?: Element | null
  isNewElement?: boolean
}

interface Emits {
  (e: 'save', element: Element): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  element: null,
  isNewElement: false
})

const emit = defineEmits<Emits>()

// Initialize element data
const elementData = ref<Element>({
  id: '',
  name: '',
  description: '',
  type: 'action',
  ownerTeamId: null,
  consultedTeamIds: [],
  completedAt: null,
  expectedEndedAt: null,
  status: 'pending',
  comments: []
})

// Track original owner team for comparison
const originalOwnerTeamId = ref<string | null>(null)

// Load teams
const { data: teamsData } = await useFetch('/api/teams')

const teams = computed(() => teamsData.value?.data || [])

// Dropdown state
const ownerDropdownOpen = ref(false)
const consultedDropdownOpen = ref(false)
const typeDropdownOpen = ref(false)
const statusDropdownOpen = ref(false)
const ownerSearchQuery = ref('')
const consultedSearchQuery = ref('')
const typeSearchQuery = ref('')

// Team assignment dialog state
const teamAssignmentDialogOpen = ref(false)
const teamAssignmentMode = ref<'owner' | 'consulted'>('owner')

// Element type options
const elementTypes = ref([
  { value: 'action', label: 'Action' },
  { value: 'state', label: 'State' },
  { value: 'artefact', label: 'Artefact' }
])

// Element status options
const elementStatuses = ref([
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'aborted', label: 'Aborted' }
])



// Computed properties for filtered teams
const filteredOwnerTeams = computed(() => {
  // If 10 or fewer teams, show all teams (no search needed)
  if (teams.value.length <= 10) return teams.value
  
  // If more than 10 teams, apply search filter
  if (!ownerSearchQuery.value) return teams.value
  const query = ownerSearchQuery.value.toLowerCase()
  return teams.value.filter(team => 
    team.name && team.name.toLowerCase().includes(query)
  )
})

const filteredConsultedTeams = computed(() => {
  // If 10 or fewer teams, show all teams (no search needed)
  if (teams.value.length <= 10) return teams.value
  
  // If more than 10 teams, apply search filter
  if (!consultedSearchQuery.value) return teams.value
  const query = consultedSearchQuery.value.toLowerCase()
  return teams.value.filter(team => 
    team.name && team.name.toLowerCase().includes(query)
  )
})

const selectedOwnerTeam = computed(() => {
  if (!elementData.value.ownerTeamId) return null
  return teams.value.find(team => team.id === elementData.value.ownerTeamId) || null
})

const selectedConsultedTeams = computed(() => {
  if (!elementData.value.consultedTeamIds?.length) return []
  return teams.value.filter(team => elementData.value.consultedTeamIds.includes(team.id))
})

const filteredElementTypes = computed(() => {
  // If 10 or fewer types, show all types (no search needed)
  if (elementTypes.value.length <= 10) return elementTypes.value
  
  // If more than 10 types, apply search filter
  if (!typeSearchQuery.value) return elementTypes.value
  const query = typeSearchQuery.value.toLowerCase()
  return elementTypes.value.filter(type => 
    type.label.toLowerCase().includes(query) ||
    type.value.toLowerCase().includes(query)
  )
})

const selectedElementType = computed(() => {
  if (!elementData.value.type) return null
  return elementTypes.value.find(type => type.value === elementData.value.type) || null
})

const selectedElementStatus = computed(() => {
  if (!elementData.value.status) return null
  return elementStatuses.value.find(status => status.value === elementData.value.status) || null
})

// Check if owner team has been changed
const ownerTeamChanged = computed(() => {
  return elementData.value.ownerTeamId !== originalOwnerTeamId.value
})

// Date conversion helpers for date inputs (day accuracy only)
const completedAtLocal = computed({
  get() {
    if (!elementData.value.completedAt) return ''
    // Convert ISO string to date format (YYYY-MM-DD)
    return new Date(elementData.value.completedAt).toISOString().slice(0, 10)
  },
  set(value: string) {
    if (value) {
      // Set to start of day in UTC to maintain consistency
      elementData.value.completedAt = new Date(value + 'T00:00:00.000Z').toISOString()
    } else {
      elementData.value.completedAt = null
    }
  }
})

const expectedEndLocal = computed({
  get() {
    if (!elementData.value.expectedEndedAt) return ''
    // Convert ISO string to date format (YYYY-MM-DD)
    return new Date(elementData.value.expectedEndedAt).toISOString().slice(0, 10)
  },
  set(value: string) {
    if (value) {
      // Set to start of day in UTC to maintain consistency
      elementData.value.expectedEndedAt = new Date(value + 'T00:00:00.000Z').toISOString()
    } else {
      elementData.value.expectedEndedAt = null
    }
  }
})



// Initialize element data when prop changes
watchEffect(() => {
  if (props.element) {
    const element = { 
      ...props.element,
      consultedTeamIds: props.element.consultedTeamIds || []
    }
    
    elementData.value = element
    // Store original owner team ID for comparison
    originalOwnerTeamId.value = element.ownerTeamId
  } else if (props.isNewElement) {
    const newElement: Element = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: '',
      description: '',
      type: 'action',
      ownerTeamId: null,
      consultedTeamIds: [],
      completedAt: null,
      expectedEndedAt: null,
      status: 'pending',
      comments: []
    }
    elementData.value = newElement
    // For new elements, original owner is null
    originalOwnerTeamId.value = null
  }
})

// Watch for element type changes to clear action-specific fields
watch(() => elementData.value.type, (newType, oldType) => {
  if (newType !== 'action') {
    // Clear action-specific fields for state and artefact elements
    elementData.value.ownerTeamId = null
    elementData.value.consultedTeamIds = []
    elementData.value.completedAt = null
    elementData.value.expectedEndedAt = null
    elementData.value.status = 'pending' // Reset to default
  } else {
    // Ensure action elements have a valid status
    if (!elementData.value.status) {
      elementData.value.status = 'pending'
    }
  }
})

// Methods
const toggleOwnerDropdown = () => {
  ownerDropdownOpen.value = !ownerDropdownOpen.value
  if (ownerDropdownOpen.value) {
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
    statusDropdownOpen.value = false
    ownerSearchQuery.value = ''
  }
}

const toggleConsultedDropdown = () => {
  consultedDropdownOpen.value = !consultedDropdownOpen.value
  if (consultedDropdownOpen.value) {
    ownerDropdownOpen.value = false
    typeDropdownOpen.value = false
    statusDropdownOpen.value = false
    consultedSearchQuery.value = ''
  }
}

const toggleTypeDropdown = () => {
  typeDropdownOpen.value = !typeDropdownOpen.value
  if (typeDropdownOpen.value) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    statusDropdownOpen.value = false
    typeSearchQuery.value = ''
  }
}

const toggleStatusDropdown = () => {
  statusDropdownOpen.value = !statusDropdownOpen.value
  if (statusDropdownOpen.value) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
  }
}



const selectOwnerTeam = (team: any) => {
  elementData.value.ownerTeamId = team?.id || null
  ownerDropdownOpen.value = false
}

const selectElementType = (type: any) => {
  elementData.value.type = type.value
  typeDropdownOpen.value = false
}

const selectElementStatus = (status: any) => {
  elementData.value.status = status.value
  statusDropdownOpen.value = false
}



const removeConsultedTeam = (teamId: string) => {
  toggleConsultedTeam(teamId)
}

const toggleConsultedTeam = (teamId: string) => {
  // Ensure consultedTeamIds is initialized
  if (!elementData.value.consultedTeamIds) {
    elementData.value.consultedTeamIds = []
  }
  
  const index = elementData.value.consultedTeamIds.indexOf(teamId)
  if (index > -1) {
    elementData.value.consultedTeamIds.splice(index, 1)
  } else {
    elementData.value.consultedTeamIds.push(teamId)
  }
}

const handleSave = () => {
  if (!elementData.value.name.trim()) {
    alert('Please enter an element name')
    return
  }

  const elementToSave = { ...elementData.value }
  
  // Clear action-specific fields for state and artefact elements according to type definition
  if (elementToSave.type !== 'action') {
    elementToSave.ownerTeamId = null
    elementToSave.consultedTeamIds = []
    elementToSave.completedAt = null
    elementToSave.expectedEndedAt = null
    // Keep status as 'pending' for workflow tracking
  }

  emit('save', elementToSave)
}

const handleClose = () => {
  emit('close')
}

// Team assignment dialog methods
const openTeamAssignmentDialog = (mode: 'owner' | 'consulted') => {
  teamAssignmentMode.value = mode
  teamAssignmentDialogOpen.value = true
  // Close other dropdowns
  ownerDropdownOpen.value = false
  consultedDropdownOpen.value = false
  typeDropdownOpen.value = false
  statusDropdownOpen.value = false
}

const closeTeamAssignmentDialog = () => {
  teamAssignmentDialogOpen.value = false
}

const handleTeamAssignment = (data: { ownerTeamId?: string | null, consultedTeamIds?: string[] }) => {
  if (data.ownerTeamId !== undefined) {
    elementData.value.ownerTeamId = data.ownerTeamId
  }
  if (data.consultedTeamIds !== undefined) {
    elementData.value.consultedTeamIds = data.consultedTeamIds
  }
  closeTeamAssignmentDialog()
}

// Handle click inside modal to close dropdowns when clicking outside dropdown areas
const handleModalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.searchable-dropdown') && !target.closest('.searchable-multi-dropdown')) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
    statusDropdownOpen.value = false
  }
  // Stop event propagation to prevent modal from closing
  event.stopPropagation()
}

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (ownerDropdownOpen.value || consultedDropdownOpen.value || typeDropdownOpen.value || statusDropdownOpen.value) {
      ownerDropdownOpen.value = false
      consultedDropdownOpen.value = false
      typeDropdownOpen.value = false
      statusDropdownOpen.value = false
    } else {
      handleClose()
    }
  }
}

// Scroll lock functionality
const lockScroll = () => {
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = '0px' // Prevent layout shift from scrollbar
}

const unlockScroll = () => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  lockScroll()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  unlockScroll()
})
</script>

<style scoped>
.element-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10001;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.modal-content {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 32px 64px rgba(102, 126, 234, 0.15),
    0 16px 32px rgba(102, 126, 234, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%);
  backdrop-filter: blur(10px);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.close-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: scale(1.1);
}

.close-icon {
  font-size: 18px;
  line-height: 1;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.element-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control::placeholder {
  color: #9ca3af;
}

.consulted-users-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background: #f3f4f6;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.01) 100%);
  backdrop-filter: blur(10px);
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.7);
  color: #374151;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn-reset {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  backdrop-filter: blur(10px);
}

.btn-reset:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
}

.btn-primary:disabled {
  background: rgba(156, 163, 175, 0.5);
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary:disabled:hover {
  background: rgba(156, 163, 175, 0.5);
  transform: none;
  box-shadow: none;
}

/* Form Label with Helper Button */
.form-label-with-helper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.helper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.helper-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: scale(1.05);
}

.helper-btn svg {
  width: 14px;
  height: 14px;
}

/* Searchable Dropdown Styles */
.searchable-dropdown,
.searchable-multi-dropdown {
  position: relative;
}

/* Owner Team Hint Styles */
.owner-team-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.hint-icon {
  width: 16px;
  height: 16px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 1px;
}

.hint-text {
  color: #92400e;
  font-size: 0.85rem;
  line-height: 1.4;
}

.dropdown-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-height: 45px;
}

.dropdown-input:hover {
  border-color: #9ca3af;
}

.dropdown-input.open {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dropdown-input.multi {
  min-height: auto;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.placeholder {
  color: #9ca3af;
}

.selected-value {
  color: #374151;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  font-size: 1rem;
  line-height: 1;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dropdown-arrow {
  width: 20px;
  height: 20px;
  color: #6b7280;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
  max-height: 300px;
  overflow: hidden;
}

.search-input-wrapper {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #667eea;
}

.dropdown-options {
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 0.5rem;
}

.dropdown-option:hover {
  background: #f3f4f6;
}

.dropdown-option.selected {
  background: #eff6ff;
  color: #1d4ed8;
}

.checkbox-option input[type="checkbox"] {
  margin: 0;
  pointer-events: none;
}

.no-results {
  padding: 0.75rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }

  .dropdown-menu {
    max-height: 250px;
  }

  .dropdown-options {
    max-height: 150px;
  }
}
</style>