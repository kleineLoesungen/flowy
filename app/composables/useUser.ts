import type { User } from '../../types/User'

const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const isLoading = ref(true)
const isAdmin = computed(() => user.value?.role === 'admin')

export const useUser = () => {
  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<{
        success: boolean
        user?: User
        message: string
      }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (response.success && response.user) {
        user.value = response.user
        isAuthenticated.value = true
        
        // Also set in localStorage for compatibility with existing code
        localStorage.setItem('user', response.user.id)
        
        return { success: true, message: response.message }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error: any) {
      const message = error.data?.message || error.message || 'Login failed'
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      
      user.value = null
      isAuthenticated.value = false
      
      // Remove from localStorage
      localStorage.removeItem('user')
      
      return { success: true, message: 'Logged out successfully' }
    } catch (error: any) {
      // Even if the server request fails, clear local state
      user.value = null
      isAuthenticated.value = false
      localStorage.removeItem('user')
      
      return { success: false, message: 'Logout failed but local session cleared' }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await $fetch<{
        success: boolean
        message: string
      }>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      })

      return { success: response.success, message: response.message }
    } catch (error: any) {
      const message = error.data?.message || error.message || 'Failed to register user'
      return { success: false, message }
    }
  }

  const checkAuth = async () => {
    if (typeof window === 'undefined') return
    
    try {
      isLoading.value = true
      
      const response = await $fetch<{
        success: boolean
        user?: User | null
        message: string
      }>('/api/auth/me')

      if (response.success && response.user) {
        user.value = response.user
        isAuthenticated.value = true
        
        // Sync with localStorage
        localStorage.setItem('user', response.user.id)
      } else {
        user.value = null
        isAuthenticated.value = false
        
        // Clear localStorage if auth check fails
        localStorage.removeItem('user')
      }
    } catch (error) {
      user.value = null
      isAuthenticated.value = false
      localStorage.removeItem('user')
    } finally {
      isLoading.value = false
    }
  }

  const refresh = async () => {
    await checkAuth()
  }

  return {
    // State
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    isAdmin: readonly(isAdmin),
    
    // Methods
    login,
    logout,
    register,
    checkAuth,
    refresh
  }
}