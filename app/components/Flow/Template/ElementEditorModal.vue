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
              <label for="element-description">Description</label>
              <textarea 
                id="element-description"
                v-model="elementData.description"
                rows="3"
                placeholder="Enter element description"
                class="form-control"
              ></textarea>
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

            <!-- Duration (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <label for="element-duration">Expected Duration (Days)</label>
              <input 
                id="element-duration"
                v-model.number="elementData.durationDays"
                type="number" 
                min="1"
                placeholder="Enter expected duration in days"
                class="form-control"
              />
            </div>

            <!-- Owner (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <label for="element-owner">Owner</label>
              <div class="searchable-dropdown">
                <div 
                  class="dropdown-input" 
                  :class="{ 'open': ownerDropdownOpen }"
                  @click="toggleOwnerDropdown"
                >
                  <span v-if="selectedOwner" class="selected-value">
                    {{ selectedOwner.name || selectedOwner.email }}
                  </span>
                  <span v-else class="placeholder">Select owner...</span>
                  <svg class="dropdown-arrow" :class="{ 'rotated': ownerDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <div v-show="ownerDropdownOpen" class="dropdown-menu">
                  <div v-if="users.length > 10" class="search-input-wrapper">
                    <input 
                      v-model="ownerSearchQuery"
                      type="text"
                      placeholder="Search users..."
                      class="search-input"
                      @click.stop
                    />
                  </div>
                  <div class="dropdown-options">
                    <div 
                      class="dropdown-option"
                      :class="{ 'selected': elementData.ownerId === null }"
                      @click.stop="selectOwner(null)"
                    >
                      <span>No Owner</span>
                    </div>
                    <div 
                      v-for="user in filteredOwnerUsers" 
                      :key="user.id"
                      class="dropdown-option"
                      :class="{ 'selected': elementData.ownerId === user.id }"
                      @click.stop="selectOwner(user)"
                    >
                      <span>{{ user.name || user.email }}</span>
                    </div>
                    <div v-if="filteredOwnerUsers.length === 0 && ownerSearchQuery" class="no-results">
                      No users found
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Consulted Users (only for action elements) -->
            <div v-if="elementData.type === 'action'" class="form-group">
              <label>Consulted Users</label>
              <div class="searchable-multi-dropdown">
                <div 
                  class="dropdown-input multi" 
                  :class="{ 'open': consultedDropdownOpen }"
                  @click="toggleConsultedDropdown"
                >
                  <div class="selected-tags" v-if="selectedConsultedUsers.length > 0">
                    <span 
                      v-for="user in selectedConsultedUsers" 
                      :key="user.id"
                      class="tag"
                    >
                      {{ user.name || user.email }}
                      <button 
                        @click.stop="removeConsultedUser(user.id)"
                        class="tag-remove"
                      >×</button>
                    </span>
                  </div>
                  <span v-else class="placeholder">Select consulted users...</span>
                  <svg class="dropdown-arrow" :class="{ 'rotated': consultedDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                <div v-show="consultedDropdownOpen" class="dropdown-menu">
                  <div v-if="users.length > 10" class="search-input-wrapper">
                    <input 
                      v-model="consultedSearchQuery"
                      type="text"
                      placeholder="Search users..."
                      class="search-input"
                      @click.stop
                    />
                  </div>
                  <div class="dropdown-options">
                    <div 
                      v-for="user in filteredConsultedUsers" 
                      :key="user.id"
                      class="dropdown-option checkbox-option"
                      :class="{ 'selected': elementData.consultedUserIds?.includes(user.id) }"
                      @click.stop="toggleConsultedUser(user.id)"
                    >
                      <input 
                        type="checkbox" 
                        :checked="elementData.consultedUserIds?.includes(user.id) || false"
                        @click.stop
                      />
                      <span>{{ user.name || user.email }}</span>
                    </div>
                    <div v-if="filteredConsultedUsers.length === 0 && consultedSearchQuery" class="no-results">
                      No users found
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
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
</template>

<script setup lang="ts">
import type { ElementTemplate } from '../../../../types/ElementTemplate'

interface Props {
  element?: ElementTemplate | null
  isNewElement?: boolean
}

interface Emits {
  (e: 'save', element: ElementTemplate): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  element: null,
  isNewElement: false
})

const emit = defineEmits<Emits>()

// Initialize element data
const elementData = ref<ElementTemplate>({
  id: '',
  name: '',
  description: '',
  type: 'action',
  ownerId: null,
  consultedUserIds: [],
  durationDays: null
})

// Load users
const { data: usersData } = await useFetch('/api/users')

const users = computed(() => usersData.value?.data || [])

// Dropdown state
const ownerDropdownOpen = ref(false)
const consultedDropdownOpen = ref(false)
const typeDropdownOpen = ref(false)
const ownerSearchQuery = ref('')
const consultedSearchQuery = ref('')
const typeSearchQuery = ref('')

// Element type options
const elementTypes = ref([
  { value: 'action', label: 'Action' },
  { value: 'state', label: 'State' },
  { value: 'artefact', label: 'Artefact' }
])



// Computed properties for filtered users
const filteredOwnerUsers = computed(() => {
  // If 10 or fewer users, show all users (no search needed)
  if (users.value.length <= 10) return users.value
  
  // If more than 10 users, apply search filter
  if (!ownerSearchQuery.value) return users.value
  const query = ownerSearchQuery.value.toLowerCase()
  return users.value.filter(user => 
    (user.name && user.name.toLowerCase().includes(query)) ||
    (user.email && user.email.toLowerCase().includes(query))
  )
})

const filteredConsultedUsers = computed(() => {
  // If 10 or fewer users, show all users (no search needed)
  if (users.value.length <= 10) return users.value
  
  // If more than 10 users, apply search filter
  if (!consultedSearchQuery.value) return users.value
  const query = consultedSearchQuery.value.toLowerCase()
  return users.value.filter(user => 
    (user.name && user.name.toLowerCase().includes(query)) ||
    (user.email && user.email.toLowerCase().includes(query))
  )
})

const selectedOwner = computed(() => {
  if (!elementData.value.ownerId) return null
  return users.value.find(user => user.id === elementData.value.ownerId) || null
})

const selectedConsultedUsers = computed(() => {
  if (!elementData.value.consultedUserIds?.length) return []
  return users.value.filter(user => elementData.value.consultedUserIds.includes(user.id))
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



// Initialize element data when prop changes
watchEffect(() => {
  if (props.element) {
    const element = { 
      ...props.element,
      consultedUserIds: props.element.consultedUserIds || []
    }
    
    // Clear action-specific fields for non-action elements
    if (element.type !== 'action') {
      element.durationDays = null
      element.ownerId = null
      element.consultedUserIds = []
    }
    
    elementData.value = element
  } else if (props.isNewElement) {
    const newElement: ElementTemplate = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: '',
      description: '',
      type: 'action',
      ownerId: null,
      consultedUserIds: [],
      durationDays: null
    }
    elementData.value = newElement
  }
})

// Watch for element type changes to clear action-specific fields
watch(() => elementData.value.type, (newType, oldType) => {
  if (oldType === 'action' && newType !== 'action') {
    // Clear action-specific fields when switching away from action type
    elementData.value.durationDays = null
    elementData.value.ownerId = null
    elementData.value.consultedUserIds = []
  }
})

// Methods
const toggleOwnerDropdown = () => {
  ownerDropdownOpen.value = !ownerDropdownOpen.value
  if (ownerDropdownOpen.value) {
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
    ownerSearchQuery.value = ''
  }
}

const toggleConsultedDropdown = () => {
  consultedDropdownOpen.value = !consultedDropdownOpen.value
  if (consultedDropdownOpen.value) {
    ownerDropdownOpen.value = false
    typeDropdownOpen.value = false
    consultedSearchQuery.value = ''
  }
}

const toggleTypeDropdown = () => {
  typeDropdownOpen.value = !typeDropdownOpen.value
  if (typeDropdownOpen.value) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    typeSearchQuery.value = ''
  }
}



const selectOwner = (user: any) => {
  elementData.value.ownerId = user?.id || null
  ownerDropdownOpen.value = false
}

const selectElementType = (type: any) => {
  elementData.value.type = type.value
  typeDropdownOpen.value = false
}



const removeConsultedUser = (userId: string) => {
  toggleConsultedUser(userId)
}

const toggleConsultedUser = (userId: string) => {
  // Ensure consultedUserIds is initialized
  if (!elementData.value.consultedUserIds) {
    elementData.value.consultedUserIds = []
  }
  
  const index = elementData.value.consultedUserIds.indexOf(userId)
  if (index > -1) {
    elementData.value.consultedUserIds.splice(index, 1)
  } else {
    elementData.value.consultedUserIds.push(userId)
  }
}

const handleSave = () => {
  if (!elementData.value.name.trim()) {
    alert('Please enter an element name')
    return
  }

  const elementToSave = { ...elementData.value }
  
  // Clear action-specific fields for non-action elements
  if (elementToSave.type !== 'action') {
    elementToSave.durationDays = null
    elementToSave.ownerId = null
    elementToSave.consultedUserIds = []
  }

  emit('save', elementToSave)
}

const handleClose = () => {
  emit('close')
}

// Handle click inside modal to close dropdowns when clicking outside dropdown areas
const handleModalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.searchable-dropdown') && !target.closest('.searchable-multi-dropdown')) {
    ownerDropdownOpen.value = false
    consultedDropdownOpen.value = false
    typeDropdownOpen.value = false
  }
  // Stop event propagation to prevent modal from closing
  event.stopPropagation()
}

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (ownerDropdownOpen.value || consultedDropdownOpen.value || typeDropdownOpen.value) {
      ownerDropdownOpen.value = false
      consultedDropdownOpen.value = false
      typeDropdownOpen.value = false
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
  z-index: 2000;
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
  padding: 2rem;
}

.element-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.01) 100%);
  backdrop-filter: blur(10px);
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
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* Searchable Dropdown Styles */
.searchable-dropdown,
.searchable-multi-dropdown {
  position: relative;
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