<template>
  <div class="app-layout">
    <!-- Navigation Header -->
    <nav class="nav-header">
      <div class="nav-brand">
        <NuxtLink to="/templates" class="brand-link">
          <h1>flowy</h1>
        </NuxtLink>
      </div>

      <div class="nav-links">
        <NuxtLink to="/flows" class="nav-link">
          Flows
        </NuxtLink>
        <NuxtLink to="/templates" class="nav-link">
          Templates
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated && user && user.role === 'admin'" to="/users" class="nav-link">
          Users
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated && user && user.role === 'admin'" to="/teams" class="nav-link">
          Teams
        </NuxtLink>

        <!-- Authentication -->
        <div class="user-selector" @click.stop>
          <button @click="toggleUserDropdown" class="user-btn" :class="{ 'has-user': isAuthenticated }">
            <span v-if="isAuthenticated && user" class="user-initial">
              {{ getUserInitial(user) }}
            </span>
            <svg v-else class="user-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          <div v-show="userDropdownOpen" class="user-dropdown">
            <div v-if="isAuthenticated && user" class="authenticated-section">
              <div class="dropdown-header">{{ user.name || user.email }}</div>
              <div class="dropdown-options">
                <div class="dropdown-option" @click="showChangePassword">
                  <svg class="option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Change Password</span>
                </div>
                <div class="dropdown-option" @click="handleLogout">
                  <svg class="option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </div>
              </div>
            </div>
            <div v-else class="unauthenticated-section">
              <div class="dropdown-header">Authentication</div>
              <div class="dropdown-options">
                <div class="dropdown-option" @click="showLogin">
                  <svg class="option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p class="footer-text">
        Made with 
        <span class="tech-item">
          <svg class="tech-icon claude-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Claude Sonnet/Copilot
        </span>
        • Thanks to 
        <span class="tech-item">
          <svg class="tech-icon nuxt-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2z"/>
          </svg>
          Nuxt
        </span>
        • 
        <span class="tech-item">
          <svg class="tech-icon vueflow-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 4l4 8 4-8h6L12 20 2 4h6z"/>
          </svg>
          Vue Flow
        </span>
      </p>
    </footer>

    <!-- Login Modal -->
    <div v-if="showLoginModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Login</h3>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input id="login-email" v-model="loginForm.email" type="email" required placeholder="Enter your email"
              :disabled="isSubmitting" />
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input id="login-password" v-model="loginForm.password" type="password" required
              placeholder="Enter your password" :disabled="isSubmitting" />
          </div>
          <div v-if="loginError" class="error-message">{{ loginError }}</div>
          <div v-if="loginSuccess" class="success-message">{{ loginSuccess }}</div>
          <div class="form-actions">
            <button type="button" @click="closeModal" :disabled="isSubmitting">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="primary">
              {{ isSubmitting ? 'Logging in...' : 'Login' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Change Password</h3>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        <form @submit.prevent="handleChangePassword" class="auth-form">
          <div class="form-group">
            <label for="current-password">Current Password</label>
            <input id="current-password" v-model="changePasswordForm.currentPassword" type="password" required
              placeholder="Enter your current password" :disabled="isSubmitting" />
          </div>
          <div class="form-group">
            <label for="new-password">New Password</label>
            <input id="new-password" v-model="changePasswordForm.newPassword" type="password" required
              placeholder="Enter new password (min. 6 chars)" :disabled="isSubmitting" />
          </div>
          <div class="form-group">
            <label for="confirm-new-password">Confirm New Password</label>
            <input id="confirm-new-password" v-model="changePasswordForm.confirmNewPassword" type="password" required
              placeholder="Confirm new password" :disabled="isSubmitting" />
          </div>
          <div v-if="changePasswordError" class="error-message">{{ changePasswordError }}</div>
          <div class="form-actions">
            <button type="button" @click="closeModal" :disabled="isSubmitting">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="primary">
              {{ isSubmitting ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import the composable directly
import { useUser } from '~/composables/useUser'

// Authentication state  
const { user, isAuthenticated, isLoading, login, logout, checkAuth } = useUser()

// UI state
const userDropdownOpen = ref(false)
const showLoginModal = ref(false)
const showChangePasswordModal = ref(false)
const loginForm = reactive({ email: '', password: '' })
const changePasswordForm = reactive({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
const loginError = ref('')
const loginSuccess = ref('')
const changePasswordError = ref('')
const isSubmitting = ref(false)

// Load users for password setup (only when needed)
const { data: usersData } = await useFetch('/api/users')
const users = computed(() => usersData.value?.data || [])

// Check authentication on mount
onMounted(async () => {
  await checkAuth()
})

// Methods
const toggleUserDropdown = () => {
  userDropdownOpen.value = !userDropdownOpen.value
}

const getUserInitial = (user: any) => {
  if (!user) return ''
  if (user.name) {
    return user.name.charAt(0).toUpperCase()
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  return 'U'
}

const showLogin = () => {
  showLoginModal.value = true
  loginForm.email = ''
  loginForm.password = ''
  loginError.value = ''
  loginSuccess.value = ''
  userDropdownOpen.value = false
}

const showChangePassword = () => {
  if (!isAuthenticated.value || !user.value) {
    alert('Please log in first to change your password.')
    return
  }

  showChangePasswordModal.value = true
  changePasswordForm.currentPassword = ''
  changePasswordForm.newPassword = ''
  changePasswordForm.confirmNewPassword = ''
  changePasswordError.value = ''
  userDropdownOpen.value = false
}

const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    loginError.value = 'Email and password are required'
    return
  }

  isSubmitting.value = true
  loginError.value = ''
  loginSuccess.value = ''

  try {
    const result = await login(loginForm.email, loginForm.password)

    if (result && result.success) {
      // Show success message briefly before redirecting
      loginSuccess.value = 'Login successful!'
      loginError.value = ''
      
      // Close modal and redirect to home page
      setTimeout(() => {
        showLoginModal.value = false
        loginForm.email = ''
        loginForm.password = ''
        loginSuccess.value = ''
        
        // Redirect to start page
        navigateTo('/')
      }, 800)
    } else {
      // Error: show error message but keep modal open
      loginError.value = result?.message || 'Login failed'
      loginSuccess.value = ''
    }
  } catch (error: any) {
    console.error('Login error:', error)
    loginError.value = error.message || 'Login failed'
    loginSuccess.value = ''
  }

  isSubmitting.value = false
}

const handleChangePassword = async () => {
  if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmNewPassword) {
    changePasswordError.value = 'All fields are required'
    return
  }

  if (changePasswordForm.newPassword !== changePasswordForm.confirmNewPassword) {
    changePasswordError.value = 'New passwords do not match'
    return
  }

  if (changePasswordForm.newPassword.length < 6) {
    changePasswordError.value = 'New password must be at least 6 characters long'
    return
  }

  isSubmitting.value = true
  changePasswordError.value = ''

  try {
    const response = await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword
      }
    }) as { success: boolean; message?: string }

    if (response.success) {
      showChangePasswordModal.value = false
      changePasswordForm.currentPassword = ''
      changePasswordForm.newPassword = ''
      changePasswordForm.confirmNewPassword = ''
      // Show success message
      alert('Password changed successfully!')
    } else {
      changePasswordError.value = response.message || 'Failed to change password'
    }
  } catch (error: any) {
    const errorMessage = error.data?.message || error.message || 'Failed to change password'

    if (error.status === 401) {
      changePasswordError.value = 'Your session has expired. Please log in again.'
      // Auto-logout on auth failure
      setTimeout(() => {
        handleLogout()
        showChangePasswordModal.value = false
      }, 2000)
    } else {
      changePasswordError.value = errorMessage
    }
  }

  isSubmitting.value = false
}

const handleLogout = async () => {
  await logout()
  userDropdownOpen.value = false
  // Redirect to start page after logout
  navigateTo('/')
}

const closeModal = () => {
  showLoginModal.value = false
  showChangePasswordModal.value = false
  loginError.value = ''
  loginSuccess.value = ''
  changePasswordError.value = ''
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-selector')) {
    userDropdownOpen.value = false
  }
  if (!target.closest('.modal-content')) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.nav-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand .brand-link {
  text-decoration: none;
  color: inherit;
}

.nav-brand h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.nav-icon {
  font-size: 1.1rem;
}

.main-content {
  padding: 0;
}

/* Footer Styles */
.footer {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  text-align: center;
  margin-top: auto;
}

.footer p {
  margin: 0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 400;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tech-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.tech-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.claude-icon {
  color: #f97316;
}

.nuxt-icon {
  color: #00dc82;
}

.vueflow-icon {
  color: #3b82f6;
}

/* User Selector Styles */
.user-selector {
  position: relative;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
}

.user-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.user-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.user-btn.has-user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-btn.has-user:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.user-icon {
  width: 16px;
  height: 16px;
}

.user-initial {
  font-size: 0.9rem;
  font-weight: 600;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.dropdown-header {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dropdown-options {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #374151;
}

.dropdown-option:hover {
  background: #f3f4f6;
}

.dropdown-option.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  font-weight: 500;
}

.option-icon {
  width: 20px;
  height: 20px;
  color: #9ca3af;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}

.no-users {
  padding: 0.75rem 1rem;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
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
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s ease;
}

.close-button:hover {
  color: #374151;
}

.auth-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.success-message {
  color: #10b981;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 6px;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
}

.form-actions button:hover {
  background: #f9fafb;
}

.form-actions button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.form-actions button.primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.25rem 1rem;
    font-size: 0.875rem;
  }

  .user-selector {
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .user-dropdown {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .modal-content {
    width: 95%;
  }

  .form-actions {
    flex-direction: column;
  }

  .footer-text {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>