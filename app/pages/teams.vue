<template>
  <div class="teams-page">
    <!-- Header -->
    <div class="header">
      <h1>Team Management</h1>
      <button @click="showAddModal = true" class="btn btn-primary">
        + Add Team
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading teams...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>Error loading teams: {{ error.message }}</p>
      <button @click="refresh()" class="btn btn-secondary">Try Again</button>
    </div>

    <!-- Teams List -->
    <div v-else class="teams-container">
      <div v-if="teams.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h6v-4h3v4h4v-6H0v6h4zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-6c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM6 8c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2z"/>
          </svg>
        </div>
        <h3>No teams found</h3>
        <p>Get started by creating your first team.</p>
        <button @click="showAddModal = true" class="btn btn-primary">Add Team</button>
      </div>

      <div v-else class="teams-grid">
        <div v-for="team in teams" :key="team.id" class="team-card">
          <div class="team-header">
            <div class="team-icon">
              {{ team.name.charAt(0).toUpperCase() }}
            </div>
            <div class="team-info">
              <h3>{{ team.name }}</h3>
              <p>{{ team.users.length }} member{{ team.users.length === 1 ? '' : 's' }}</p>
            </div>
            <div class="team-actions">
              <button @click="editTeam(team)" class="btn-icon edit-btn" title="Edit Team">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button @click="confirmDelete(team)" class="btn-icon delete-btn" title="Delete Team">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="team-members">
            <h4>Members:</h4>
            <div v-if="team.users.length === 0" class="no-members">
              No members assigned
            </div>
            <div v-else class="members-list">
              <div v-for="user in team.users" :key="user.id" class="member-item">
                <div class="member-avatar">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div class="member-info">
                  <span class="member-name">{{ user.name }}</span>
                  <span class="member-email">{{ user.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <h3>{{ isEditing ? 'Edit Team' : 'Add New Team' }}</h3>
        
        <form @submit.prevent="saveTeam" class="team-form">
          <div class="form-group">
            <label for="team-name">Team Name</label>
            <input
              id="team-name"
              v-model="teamForm.name"
              type="text"
              required
              placeholder="Enter team name"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Team Members</label>
            <div class="members-selection">
              <div v-if="availableUsers.length === 0" class="no-users">
                No users available. <NuxtLink to="/users" class="link">Create users first</NuxtLink>.
              </div>
              <div v-else class="users-checkboxes">
                <label v-for="user in availableUsers" :key="user.id" class="user-checkbox">
                  <input
                    type="checkbox"
                    :value="user.id"
                    v-model="teamForm.userIds"
                  />
                  <div class="checkbox-content">
                    <div class="user-avatar-small">
                      {{ user.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="user-details">
                      <span class="user-name">{{ user.name }}</span>
                      <span class="user-email">{{ user.email }}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!teamForm.name">
              {{ isEditing ? 'Update Team' : 'Create Team' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
      <div class="modal delete-modal" @click.stop>
        <h3>Delete Team</h3>
        <p>Are you sure you want to delete "{{ teamToDelete?.name }}"?</p>
        <p class="warning-text">This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="closeModals" class="btn btn-secondary">Cancel</button>
          <button @click="deleteTeam" class="btn btn-danger">Delete Team</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Team } from '~~/server/db/schema'
import type { User } from '~~/server/db/schema'

// Page metadata
definePageMeta({
  middleware: 'admin'
})

// Set page title
useHead({
  title: 'flowy | Teams'
})

// Reactive state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedTeam = ref<Team | null>(null)
const teamToDelete = ref<Team | null>(null)

interface TeamFormData {
  name: string
  userIds: string[]
}

const teamForm = ref<TeamFormData>({
  name: '',
  userIds: []
})

// Computed properties
const isEditing = computed(() => showEditModal.value && selectedTeam.value)

// Fetch teams and users data
const { data: teamsData, pending, error, refresh } = await useFetch('/api/teams')
const { data: usersData } = await useFetch('/api/users')

const teams = computed(() => teamsData.value?.data || [])
const availableUsers = computed(() => usersData.value?.data || [])

// Methods
const editTeam = (team: Team) => {
  selectedTeam.value = team
  teamForm.value = {
    name: team.name,
    userIds: [...team.userIds]
  }
  showEditModal.value = true
}

const confirmDelete = (team: Team) => {
  teamToDelete.value = team
  showDeleteModal.value = true
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
  selectedTeam.value = null
  teamToDelete.value = null
  // Reset form
  teamForm.value = {
    name: '',
    userIds: []
  }
}

const saveTeam = async () => {
  try {
    if (isEditing.value && selectedTeam.value) {
      // Update existing team
      await $fetch(`/api/teams/${selectedTeam.value.id}`, {
        method: 'PUT',
        body: teamForm.value
      })
    } else {
      // Create new team
      await $fetch('/api/teams', {
        method: 'POST',
        body: teamForm.value
      })
    }

    await refresh()
    closeModals()
  } catch (error: any) {
    console.error('Error saving team:', error)
    alert(error.data?.message || 'Error saving team. Please try again.')
  }
}

const deleteTeam = async () => {
  if (!teamToDelete.value) return

  try {
    await $fetch(`/api/teams/${teamToDelete.value.id}`, {
      method: 'DELETE'
    })

    await refresh()
    closeModals()
  } catch (error: any) {
    console.error('Error deleting team:', error)
    alert(error.data?.message || 'Error deleting team. Please try again.')
  }
}
</script>

<style scoped>
.teams-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(102, 126, 234, 0.1);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 2px dashed rgba(102, 126, 234, 0.3);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.8;
  color: #667eea;
}

.empty-icon svg {
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.team-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
}

.team-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.team-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.team-info {
  flex: 1;
  min-width: 0;
}

.team-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
}

.team-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.team-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.team-members h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
}

.no-members {
  color: #64748b;
  font-style: italic;
  font-size: 0.9rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
}

.member-email {
  font-size: 0.75rem;
  color: #64748b;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon svg {
  transition: all 0.2s ease;
}

.edit-btn {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.edit-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.edit-btn:hover svg {
  transform: rotate(5deg);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

.delete-btn:hover svg {
  transform: scale(1.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  min-width: 500px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.team-form {
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
  color: #475569;
  font-size: 0.875rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 1);
}

.members-selection {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  max-height: 200px;
  overflow-y: auto;
}

.no-users {
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.link {
  color: #667eea;
  text-decoration: underline;
}

.users-checkboxes {
  padding: 0.5rem;
}

.user-checkbox {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-checkbox:hover {
  background: rgba(102, 126, 234, 0.05);
}

.user-checkbox input[type="checkbox"] {
  margin-right: 0.75rem;
  width: 16px;
  height: 16px;
}

.checkbox-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.delete-modal .warning-text {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .teams-page {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    min-width: 300px;
    margin: 1rem;
  }
}
</style>