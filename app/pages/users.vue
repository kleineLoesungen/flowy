<template>
  <div class="users-page">
    <!-- Header -->
    <div class="header">
      <h1>User Management</h1>
      <button @click="showAddModal = true" class="btn btn-primary">
        + Add User
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>Error loading users: {{ error.message }}</p>
      <button @click="refresh()" class="btn btn-secondary">Try Again</button>
    </div>

    <!-- Users List -->
    <div v-else class="users-container">
      <div v-if="users.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h3>No users found</h3>
        <p>Get started by adding your first user.</p>
        <button @click="showAddModal = true" class="btn btn-primary">Add User</button>
      </div>

      <div v-else class="users-container-grouped">
        <!-- Admin Users Section -->
        <div v-if="adminUsers.length > 0" class="role-group">
          <div class="role-header">
            <div class="role-title">
              <svg class="role-icon admin-icon" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3>Admins</h3>
              <span class="role-count">{{ adminUsers.length }}</span>
            </div>
          </div>
          <div class="users-grid">
            <div v-for="user in adminUsers" :key="user.id" class="user-card">
              <div class="user-avatar admin-avatar">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="user-info">
                <h3>
                  {{ user.name }}
                  <span v-if="isCurrentUser(user)" class="current-user-badge">You</span>
                </h3>
                <p>{{ user.email }}</p>
              </div>
              <div class="user-actions">
                <button @click="showUserAssignments(user)" class="btn-icon assignments-btn"
                  :title="`Assignments: ${getUserAssignmentCounts(user).templates} Templates, ${getUserAssignmentCounts(user).flows} Flows`">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path
                      d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                  </svg>
                  <span class="assignment-count">{{ getUserAssignmentCounts(user).templates +
                    getUserAssignmentCounts(user).flows }}</span>
                </button>
                <button @click="editUser(user)" class="btn-icon edit-btn" title="Edit User">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button v-if="!isCurrentUser(user)" @click="confirmDelete(user)" class="btn-icon delete-btn"
                  title="Delete User">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div v-else class="btn-icon delete-disabled" title="You cannot delete your own account">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Member Users Section -->
        <div v-if="memberUsers.length > 0" class="role-group">
          <div class="role-header">
            <div class="role-title">
              <svg class="role-icon member-icon" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3>Members</h3>
              <span class="role-count">{{ memberUsers.length }}</span>
            </div>
          </div>
          <div class="users-grid">
            <div v-for="user in memberUsers" :key="user.id" class="user-card">
              <div class="user-avatar member-avatar">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="user-info">
                <h3>
                  {{ user.name }}
                  <span v-if="isCurrentUser(user)" class="current-user-badge">You</span>
                </h3>
                <p>{{ user.email }}</p>
              </div>
              <div class="user-actions">
                <button @click="showUserAssignments(user)" class="btn-icon assignments-btn"
                  :title="`Assignments: ${getUserAssignmentCounts(user).templates} Templates, ${getUserAssignmentCounts(user).flows} Flows`">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path
                      d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                  </svg>
                  <span class="assignment-count">{{ getUserAssignmentCounts(user).templates +
                    getUserAssignmentCounts(user).flows }}</span>
                </button>
                <button @click="editUser(user)" class="btn-icon edit-btn" title="Edit User">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button v-if="!isCurrentUser(user)" @click="confirmDelete(user)" class="btn-icon delete-btn"
                  title="Delete User">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
                <div v-else class="btn-icon delete-disabled" title="You cannot delete your own account">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
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
        <h3>{{ isEditing ? 'Edit User' : 'Add New User' }}</h3>

        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-group">
            <label for="user-name">Full Name</label>
            <input id="user-name" v-model="userForm.name" type="text" required placeholder="Enter full name"
              class="form-control" />
          </div>

          <div class="form-group">
            <label for="user-email">Email Address</label>
            <input id="user-email" v-model="userForm.email" type="email" required placeholder="Enter email address"
              class="form-control" />
          </div>

          <div v-if="isEditing" class="form-group">
            <label for="user-role">Role</label>
            <select id="user-role" v-model="userForm.role" class="form-control" required>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <!-- Password Reset Section (Edit Only) -->
          <div v-if="isEditing" class="password-reset-section">
            <h4>Password Reset</h4>
            <p class="password-reset-description">
              Generate a new password for this user. The password will be shown only once.
            </p>

            <div v-if="!showGeneratedPassword" class="generate-password-section">
              <button type="button" @click="generatePassword" class="btn btn-warning">
                Generate New Password
              </button>
            </div>

            <div v-if="showGeneratedPassword" class="generated-password-section">
              <label>Generated Password (Save this - it won't be shown again)</label>
              <div class="password-display">
                <input :value="generatedPassword" type="text" readonly class="form-control password-input" />
                <button type="button" @click="copyPassword" class="btn btn-copy" :class="{ 'copied': passwordCopied }">
                  {{ passwordCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!userForm.name || !userForm.email">
              {{ isEditing ? 'Update User' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
      <div class="modal delete-modal" @click.stop>
        <h3>Delete User</h3>
        <p>Are you sure you want to delete "{{ userToDelete?.name }}"?</p>
        <p class="warning-text">This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="closeModals" class="btn btn-secondary">Cancel</button>
          <button @click="deleteUser" class="btn btn-danger">Delete User</button>
        </div>
      </div>
    </div>

    <!-- User Assignments Modal -->
    <div v-if="showAssignmentsModal" class="modal-overlay" @click="closeModals">
      <div class="modal assignments-modal" @click.stop>
        <h3>Assignments for {{ selectedUserForAssignments?.name }}</h3>

        <div v-if="assignmentsLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading assignments...</p>
        </div>

        <div v-else class="assignments-content">
          <!-- Templates Section -->
          <div v-if="userTemplates.length > 0" class="assignment-group">
            <h4>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" class="section-icon">
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Templates ({{ userTemplates.length }})
            </h4>
            <div class="assignments-list">
              <div v-for="template in userTemplates" :key="template.id" class="assignment-item">
                <div class="assignment-info">
                  <div class="assignment-header">
                    <h5>{{ template.name }}</h5>
                    <a :href="`/templates/${template.id}`" target="_blank" class="assignment-link" title="Open template in new tab">
                      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M7 17L17 7"/>
                        <path d="M7 7h10v10"/>
                      </svg>
                    </a>
                  </div>
                  <p>{{ template.description || 'No description' }}</p>
                  <div class="elements-info">
                    <span v-for="element in getUserElementsInTemplate(template)" :key="element.id" class="element-tag">
                      {{ element.name }}
                      <small v-if="element.ownerId === selectedUserForAssignments?.id">(Owner)</small>
                      <small
                        v-else-if="element.consultedUserIds?.includes(selectedUserForAssignments?.id)">(Consulted)</small>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Flows Section -->
          <div v-if="userFlows.length > 0" class="assignment-group">
            <h4>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" class="section-icon">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Flows ({{ userFlows.length }})
            </h4>
            <div class="assignments-list">
              <div v-for="flow in userFlows" :key="flow.id" class="assignment-item">
                <div class="assignment-info">
                  <div class="assignment-header">
                    <h5>{{ flow.name }}</h5>
                    <a :href="`/flows/${flow.id}/work`" target="_blank" class="assignment-link" title="Open flow in new tab">
                      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M7 17L17 7"/>
                        <path d="M7 7h10v10"/>
                      </svg>
                    </a>
                  </div>
                  <p>{{ flow.description || 'No description' }}</p>
                  <div class="elements-info">
                    <span v-for="element in getUserElementsInFlow(flow)" :key="element.id" class="element-tag">
                      {{ element.name }}
                      <small v-if="element.ownerId === selectedUserForAssignments?.id">(Owner)</small>
                      <small
                        v-else-if="element.consultedUserIds?.includes(selectedUserForAssignments?.id)">(Consulted)</small>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Assignments -->
          <div v-if="userTemplates.length === 0 && userFlows.length === 0" class="no-assignments">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24" class="empty-icon">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4>No Assignments</h4>
            <p>{{ selectedUserForAssignments?.name }} is not assigned to any templates or flows.</p>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeModals" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '../../types/User'
import { useUser } from '~/composables/useUser'

// Page metadata
definePageMeta({
  title: 'User Management',
  middleware: 'admin'
})

// Get current authenticated user
const { user: currentUser, isAuthenticated } = useUser()

// Reactive state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showAssignmentsModal = ref(false)
const selectedUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)
const selectedUserForAssignments = ref<User | null>(null)
const assignmentsLoading = ref(false)

const userForm = ref<Omit<User, 'id'> & { password?: string }>({
  name: '',
  email: '',
  role: 'member',
  password: undefined
})

const generatedPassword = ref('')
const showGeneratedPassword = ref(false)
const passwordCopied = ref(false)

// Computed properties
const isEditing = computed(() => showEditModal.value && selectedUser.value)

// Fetch users data
const { data: usersData, pending, error, refresh } = await useFetch('/api/users')
const users = computed(() => usersData.value?.data || [])

// Group users by role
const adminUsers = computed(() => users.value.filter(user => user.role === 'admin'))
const memberUsers = computed(() => users.value.filter(user => user.role === 'member'))

// Fetch templates and flows for assignments
const { data: templatesData } = await useFetch('/api/templates')
const { data: flowsData } = await useFetch('/api/flows')

const allTemplates = computed(() => templatesData.value?.data || [])
const allFlows = computed(() => flowsData.value?.data || [])

// Filter templates and flows for selected user
const userTemplates = computed(() => {
  if (!selectedUserForAssignments.value) return []
  const userId = selectedUserForAssignments.value.id
  return allTemplates.value.filter(template =>
    template.elements?.some(element =>
      element.ownerId === userId ||
      element.consultedUserIds?.includes(userId)
    )
  )
})

const userFlows = computed(() => {
  if (!selectedUserForAssignments.value) return []
  const userId = selectedUserForAssignments.value.id
  return allFlows.value.filter(flow =>
    flow.elements?.some(element =>
      element.ownerId === userId ||
      element.consultedUserIds?.includes(userId)
    )
  )
})

// Password generation utility
const generateSecurePassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''

  // Ensure at least one of each character type
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'

  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest with random characters
  for (let i = 4; i < 12; i++) {
    password += characters[Math.floor(Math.random() * characters.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

const generatePassword = () => {
  generatedPassword.value = generateSecurePassword()
  userForm.value.password = generatedPassword.value
  showGeneratedPassword.value = true
  passwordCopied.value = false
}

const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(generatedPassword.value)
    passwordCopied.value = true
    setTimeout(() => {
      passwordCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy password:', err)
  }
}

// Methods
const isCurrentUser = (user: User) => {
  return isAuthenticated.value && currentUser.value && currentUser.value.id === user.id
}

const editUser = (user: User) => {
  selectedUser.value = user
  userForm.value = {
    name: user.name,
    email: user.email,
    role: user.role,
    password: undefined
  }
  showEditModal.value = true
  // Reset password generation state
  generatedPassword.value = ''
  showGeneratedPassword.value = false
  passwordCopied.value = false
}

const confirmDelete = (user: User) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const showUserAssignments = async (user: User) => {
  selectedUserForAssignments.value = user
  showAssignmentsModal.value = true
}

const getUserElementsInTemplate = (template: any) => {
  if (!selectedUserForAssignments.value) return []
  const userId = selectedUserForAssignments.value.id
  return template.elements?.filter((element: any) =>
    element.ownerId === userId ||
    element.consultedUserIds?.includes(userId)
  ) || []
}

const getUserElementsInFlow = (flow: any) => {
  if (!selectedUserForAssignments.value) return []
  const userId = selectedUserForAssignments.value.id
  return flow.elements?.filter((element: any) =>
    element.ownerId === userId ||
    element.consultedUserIds?.includes(userId)
  ) || []
}

const getUserAssignmentCounts = (user: any) => {
  const userId = user.id

  const templatesCount = allTemplates.value?.filter((template: any) =>
    template.elements?.some((element: any) =>
      element.ownerId === userId || element.consultedUserIds?.includes(userId)
    )
  ).length || 0

  const flowsCount = allFlows.value?.filter((flow: any) =>
    flow.elements?.some((element: any) =>
      element.ownerId === userId || element.consultedUserIds?.includes(userId)
    )
  ).length || 0

  return {
    templates: templatesCount,
    flows: flowsCount
  }
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
  showAssignmentsModal.value = false
  selectedUser.value = null
  userToDelete.value = null
  selectedUserForAssignments.value = null
  // Reset form
  userForm.value = {
    name: '',
    email: '',
    role: 'member',
    password: undefined
  }
  // Reset password generation state
  generatedPassword.value = ''
  showGeneratedPassword.value = false
  passwordCopied.value = false
}

const saveUser = async () => {
  try {
    const bodyData = {
      name: userForm.value.name,
      email: userForm.value.email,
      role: userForm.value.role,
      ...(userForm.value.password && { password: userForm.value.password })
    }

    if (isEditing.value && selectedUser.value) {
      // Update existing user
      await $fetch(`/api/users/${selectedUser.value.id}`, {
        method: 'PUT',
        body: bodyData
      })
    } else {
      // Create new user
      await $fetch('/api/users', {
        method: 'POST',
        body: bodyData
      })
    }

    await refresh()
    closeModals()
  } catch (error: any) {
    console.error('Error saving user:', error)
    alert(error.data?.message || 'Error saving user. Please try again.')
  }
}

const deleteUser = async () => {
  if (!userToDelete.value) return

  // Additional frontend check (backend also validates this)
  if (isCurrentUser(userToDelete.value)) {
    alert('You cannot delete your own account. Please ask another admin to delete it for you.')
    return
  }

  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, {
      method: 'DELETE'
    })

    await refresh()
    closeModals()
  } catch (error: any) {
    console.error('Error deleting user:', error)
    alert(error.data?.message || 'Error deleting user. Please try again.')
  }
}
</script>

<style scoped>
.users-page {
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

.loading-state,
.error-state {
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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

.users-container-grouped {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.role-group {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.05);
}

.role-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.role-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
}

.role-icon {
  flex-shrink: 0;
}

.admin-icon {
  color: #f59e0b;
}

.member-icon {
  color: #667eea;
}

.role-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.role-count {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.admin-avatar {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.member-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
}

.user-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.current-user-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
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

.delete-disabled {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
  cursor: not-allowed;
}

.delete-disabled svg {
  opacity: 0.5;
}

.assignments-btn {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.assignments-btn:hover {
  background: rgba(16, 185, 129, 0.2);
  transform: scale(1.05);
}

.assignments-btn:hover svg {
  transform: rotate(5deg);
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
  min-width: 400px;
  max-width: 500px;
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-form {
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

/* Password Reset Section */
.password-reset-section {
  border-top: 1px solid rgba(102, 126, 234, 0.2);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.password-reset-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
}

.password-reset-description {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.generate-password-section {
  margin-bottom: 1rem;
}

.generated-password-section {
  margin-top: 1rem;
}

.generated-password-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #dc2626;
  font-size: 0.875rem;
}

.password-display {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.password-input {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  background: rgba(255, 248, 225, 0.9);
  border-color: rgba(245, 158, 11, 0.3);
}

.btn-copy {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  white-space: nowrap;
}

.btn-copy:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-copy.copied {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-warning:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .users-page {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .users-container-grouped {
    gap: 1.5rem;
  }

  .role-group {
    padding: 1rem;
    border-radius: 16px;
  }

  .role-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .role-title h3 {
    font-size: 1.1rem;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .modal {
    min-width: 300px;
    margin: 1rem;
  }

  .password-display {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-copy {
    margin-top: 0.5rem;
  }
}

/* Assignment Count Badge */
.assignment-count {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  border: 1px solid white;
}

.assignment-count:empty {
  display: none;
}

.btn-icon.assignments-btn {
  position: relative;
}

/* Assignments Modal Styles */
.assignments-modal {
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

.assignments-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.assignment-group {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.assignment-group h4 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.section-icon {
  color: #667eea;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assignment-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 1rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.assignment-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.assignment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.assignment-info h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.assignment-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.assignment-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.assignment-link:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #5a6fd8;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
  border-color: rgba(102, 126, 234, 0.3);
}

.assignment-link:hover::before {
  opacity: 1;
}

.assignment-link svg {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  position: relative;
}

.assignment-link:hover svg {
  transform: translate(2px, -2px) scale(1.1);
}

.assignment-info p {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.elements-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.element-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.element-tag small {
  opacity: 0.8;
  font-weight: 400;
}

.assignment-role {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.owner {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.role-badge.consulted {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.no-assignments {
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.no-assignments .empty-icon {
  margin-bottom: 1rem;
  opacity: 0.6;
}

.no-assignments h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.no-assignments p {
  margin: 0;
  font-size: 0.9rem;
}
</style>