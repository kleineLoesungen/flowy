export default defineNuxtRouteMiddleware((to, from) => {
    const { user } = useUser()
    
    if (!user.value || user.value.role !== 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Admin access required'
        })
    }
})