export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client-side
  if (typeof window !== 'undefined') {
    const { checkAuth } = useUser()
    await checkAuth()
  }
})