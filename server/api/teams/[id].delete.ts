import { useTeamRepository } from "../../storage/StorageFactory"

/**
 * Response for team deletion
 */
interface DeleteTeamResponse {
  success: true
  message: string
}

/**
 * DELETE /api/teams/[id]
 * 
 * Delete a team
 */
export default defineEventHandler(async (event) => {
  const teamRepo = useTeamRepository()
  
  try {
    const teamId = getRouterParam(event, 'id')
    
    if (!teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Team ID is required'
      })
    }
    
    // Check if team exists
    const existingTeam = await teamRepo.findById(teamId)
    if (!existingTeam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Team not found'
      })
    }
    
    // Delete team using repository
    await teamRepo.delete(teamId)
    
    return {
      success: true,
      message: 'Team deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error deleting team:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error deleting team: ${error.message}`
    })
  }
})