<template>
  <div class="element-editor-modal">
    <!-- Modal Overlay -->
    <div class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
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
              <select 
                id="element-type"
                v-model="elementData.type"
                class="form-control"
              >
                <option value="action">Action</option>
                <option value="state">State</option>
                <option value="artefact">Artefact</option>
              </select>
            </div>

            <!-- Duration (only for actions) -->
            <div class="form-group" v-if="elementData.type === 'action'">
              <label for="element-duration">Duration (Days)</label>
              <input 
                id="element-duration"
                v-model.number="elementData.durationDays"
                type="number"
                min="0"
                step="0.5"
                placeholder="Enter duration in days"
                class="form-control"
              />
            </div>

            <!-- Owner -->
            <div class="form-group">
              <label for="element-owner">Owner</label>
              <select 
                id="element-owner"
                v-model="elementData.ownerId"
                class="form-control"
              >
                <option :value="null">No Owner</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name || user.email || `User ${user.id}` }}
                </option>
                <option v-if="users.length === 0" disabled>Loading users...</option>
              </select>
            </div>

            <!-- Team -->
            <div class="form-group">
              <label for="element-team">Team</label>
              <select 
                id="element-team"
                v-model="elementData.teamId"
                class="form-control"
              >
                <option :value="null">No Team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ team.name || `Team ${team.id}` }}
                </option>
                <option v-if="teams.length === 0" disabled>Loading teams...</option>
              </select>
            </div>

            <!-- Consulted Users -->
            <div class="form-group">
              <label>Consulted Users</label>
              <div class="consulted-users-checkboxes">
                <label 
                  v-for="user in users" 
                  :key="user.id"
                  class="checkbox-label"
                >
                  <input 
                    type="checkbox" 
                    :value="user.id"
                    :checked="elementData.consultedUserIds?.includes(user.id) || false"
                    @change="toggleConsultedUser(user.id)"
                  />
                  <span>{{ user.name || user.email }}</span>
                </label>
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
// Types will be inferred from the API responses

interface Props {
  element?: any | null
  isNewElement?: boolean
}

interface Emits {
  (e: 'save', element: any): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  element: null,
  isNewElement: false
})

const emit = defineEmits<Emits>()

// Initialize element data
const elementData = ref({
  id: '',
  name: '',
  description: '',
  type: 'action',
  durationDays: 1,
  ownerId: null,
  teamId: null,
  consultedUserIds: [] as string[]
})

// Load users and teams
const { data: usersData } = await useFetch('/api/users')
const { data: teamsData } = await useFetch('/api/teams')

const users = computed(() => usersData.value?.data || [])
const teams = computed(() => teamsData.value?.data || [])

// Initialize element data when prop changes
watchEffect(() => {
  if (props.element) {
    elementData.value = { 
      ...props.element,
      consultedUserIds: props.element.consultedUserIds || []
    }
  } else if (props.isNewElement) {
    elementData.value = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: '',
      description: '',
      type: 'action',
      durationDays: 1,
      ownerId: null,
      teamId: null,
      consultedUserIds: []
    }
  }
})

// Methods
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

  emit('save', { ...elementData.value })
}

const handleClose = () => {
  emit('close')
}

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f1f5f9;
  color: #374151;
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
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
  transform: translateY(-1px);
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
}
</style>