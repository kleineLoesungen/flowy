import type { User } from "~~/server/db/schema"

const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const isLoading = ref(true)
const isAdmin = computed(() => user.value?.role === 'admin')

export const useUser = () => {
  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<{
        success: boolean
        data?: {
          user: User
          token: string
        }
        message: string
      }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (response.success && response.data?.user) {
        user.value = response.data.user
        isAuthenticated.value = true
        
        // Also set in localStorage for compatibility with existing code
        localStorage.setItem('user', response.data.user.id)
        
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

  const checkAuth = async () => {
    if (typeof window === 'undefined') return
    
    try {
      isLoading.value = true
      
      const response = await $fetch<{
        success: boolean
        data?: { user: User }
        user?: User | null
        message: string
      }>('/api/auth/me')

      // Handle both response formats (data.user or direct user)
      const userData = response.data?.user || response.user
      
      if (response.success && userData) {
        user.value = userData
        isAuthenticated.value = true
        
        // Sync with localStorage
        localStorage.setItem('user', userData.id)
      } else {
        user.value = null
        isAuthenticated.value = false
        localStorage.removeItem('user')
      }
    } catch (error: any) {
      // 401 Unauthorized is expected when user is not logged in
      if (error.statusCode === 401 || error.status === 401) {
        user.value = null
        isAuthenticated.value = false
        localStorage.removeItem('user')
      } else {
        // Log unexpected errors only
        console.error('Unexpected error during auth check:', error)
        user.value = null
        isAuthenticated.value = false
        localStorage.removeItem('user')
      }
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
    checkAuth,
    refresh
  }
}