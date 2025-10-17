export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  try {
    // Clear the authentication cookie
    setCookie(event, 'auth-token', '', {
      httpOnly: true,
      secure: useRuntimeConfig().public.nodeEnv === 'production',
      sameSite: 'strict',
      expires: new Date(0) // Expire immediately
    })

    return {
      success: true,
      message: 'Logout successful'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to logout'
    })
  }
})