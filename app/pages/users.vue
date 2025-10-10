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
        <div class="empty-icon">👤</div>
        <h3>No users found</h3>
        <p>Get started by adding your first user.</p>
        <button @click="showAddModal = true" class="btn btn-primary">Add User</button>
      </div>

      <div v-else class="users-grid">
        <div v-for="user in users" :key="user.id" class="user-card">
          <div class="user-avatar">
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p>{{ user.email }}</p>
          </div>
          <div class="user-actions">
            <button @click="editUser(user)" class="btn-icon edit-btn" title="Edit User">
              ✏️
            </button>
            <button @click="confirmDelete(user)" class="btn-icon delete-btn" title="Delete User">
              🗑️
            </button>
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
            <input
              id="user-name"
              v-model="userForm.name"
              type="text"
              required
              placeholder="Enter full name"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="user-email">Email Address</label>
            <input
              id="user-email"
              v-model="userForm.email"
              type="email"
              required
              placeholder="Enter email address"
              class="form-control"
            />
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
  </div>
</template>

<script setup lang="ts">
import type { User } from '../../types/User'

// Page metadata
definePageMeta({
  title: 'User Management'
})

// Reactive state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)

const userForm = ref<Omit<User, 'id'>>({
  name: '',
  email: ''
})

// Computed properties
const isEditing = computed(() => showEditModal.value && selectedUser.value)

// Fetch users data
const { data: usersData, pending, error, refresh } = await useFetch('/api/users')
const users = computed(() => usersData.value?.data || [])

// Methods
const editUser = (user: User) => {
  selectedUser.value = user
  userForm.value = {
    name: user.name,
    email: user.email
  }
  showEditModal.value = true
}

const confirmDelete = (user: User) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
  selectedUser.value = null
  userToDelete.value = null
  // Reset form
  userForm.value = {
    name: '',
    email: ''
  }
}

const saveUser = async () => {
  try {
    if (isEditing.value && selectedUser.value) {
      // Update existing user
      await $fetch(`/api/users/${selectedUser.value.id}`, {
        method: 'PUT',
        body: userForm.value
      })
    } else {
      // Create new user
      await $fetch('/api/users', {
        method: 'POST',
        body: userForm.value
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
  font-size: 2.5rem;
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
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
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

.edit-btn {
  background: rgba(102, 126, 234, 0.1);
}

.edit-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
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
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    min-width: 300px;
    margin: 1rem;
  }
}
</style>