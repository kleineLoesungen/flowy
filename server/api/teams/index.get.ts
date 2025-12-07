import type { User } from '../../db/schema'
import { useTeamRepository } from "../../storage/StorageFactory"

/**
 * User data in team responses (without sensitive data)
 */
interface TeamUser {
  id: string
  name: string
  email: string
  role: 'member' | 'admin'
  createdAt: string
  updatedAt: string
}

/**
 * Team data with populated user information
 */
interface TeamResponse {
  id: string
  name: string
  userIds: string[]
  users: TeamUser[]
  createdAt: string
  updatedAt: string
}

/**
 * Response for teams list
 */
interface TeamsListResponse {
  success: true
  data: TeamResponse[]
}

/**
 * GET /api/teams
 * 
 * Get list of all teams with populated user data
 */
export default defineEventHandler(async (event) => {
  const teamRepo = useTeamRepository()
try {
    // Get all teams with populated users
    const teamsWithUsers = await teamRepo.findAllWithUsers()

    // Clean up users to remove password hashes
    const teams = teamsWithUsers.map(team => ({    
      ...team,
      users: team.users.map((user: User) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    }))
    // Sort teams by name
    teams.sort((a, b) => a.name.localeCompare(b.name))

    return {
      success: true,
      data: teams
    }
  } catch (error: any) {
    console.error('Teams API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch teams',
      data: { message: error.message, stack: error.stack }
    })
  }
})