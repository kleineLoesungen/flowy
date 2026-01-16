/**
 * Response data for logout
 */
interface LogoutResponse {
  success: true
  message: string
}

/**
 * POST /api/auth/logout
 * 
 * Logout user and clear authentication token
 */
export default defineEventHandler(async (event) => {
  try {
    // Clear the authentication cookie
    setCookie(event, 'auth-token', '', {
      httpOnly: true,
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