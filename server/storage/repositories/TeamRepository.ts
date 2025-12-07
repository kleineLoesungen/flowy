import type { Team, NewTeam } from '../../db/schema'
import { BaseRepository } from './BaseRepository'
import { UserRepository } from './UserRepository'
import type { IStorage } from '../interfaces/IStorage'
import type { User } from '../../db/schema'

export class TeamRepository extends BaseRepository<Team> {
  constructor(storage: IStorage) {
    super(storage, 'teams')
  }

  /**
   * Find team by name
   */
  async findByName(name: string): Promise<Team | null> {
    return this.findOneWhere({ name })
  }

  /**
   * Find teams that include a specific user
   */
  async findTeamsWithUser(userId: string): Promise<Team[]> {
    const allTeams = await this.findAll()
    return allTeams.filter(team => team.userIds.includes(userId))
  }

  /**
   * Find teams by multiple user IDs (teams that contain any of the users)
   */
  async findTeamsWithAnyUser(userIds: string[]): Promise<Team[]> {
    const allTeams = await this.findAll()
    return allTeams.filter(team => 
      team.userIds.some(userId => userIds.includes(userId))
    )
  }

  /**
   * Find teams that contain all specified users
   */
  async findTeamsWithAllUsers(userIds: string[]): Promise<Team[]> {
    const allTeams = await this.findAll()
    return allTeams.filter(team => 
      userIds.every(userId => team.userIds.includes(userId))
    )
  }

  /**
   * Add user to team
   */
  async addUserToTeam(teamId: string, userId: string): Promise<Team> {
    const team = await this.findById(teamId)
    if (!team) {
      throw new Error(`Team with id ${teamId} not found`)
    }

    if (!team.userIds.includes(userId)) {
      const updatedUserIds = [...team.userIds, userId]
      return this.update(teamId, { userIds: updatedUserIds })
    }

    return team
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(teamId: string, userId: string): Promise<Team> {
    const team = await this.findById(teamId)
    if (!team) {
      throw new Error(`Team with id ${teamId} not found`)
    }

    const updatedUserIds = team.userIds.filter(id => id !== userId)
    return this.update(teamId, { userIds: updatedUserIds })
  }

  /**
   * Replace all users in team
   */
  async setTeamUsers(teamId: string, userIds: string[]): Promise<Team> {
    return this.update(teamId, { userIds })
  }

  /**
   * Get team with populated user details
   */
  async findByIdWithUsers(teamId: string): Promise<(Team & { users: User[] }) | null> {
    const team = await this.findById(teamId)
    if (!team) return null

    const userRepo = new UserRepository(this.storage)
    const users: User[] = []

    for (const userId of team.userIds) {
      const user = await userRepo.findById(userId)
      if (user) users.push(user)
    }

    return { ...team, users }
  }

  /**
   * Get all teams with populated user details
   */
  async findAllWithUsers(): Promise<(Team & { users: User[] })[]> {
    const teams = await this.findAll()
    const userRepo = new UserRepository(this.storage)
    const result: (Team & { users: User[] })[] = []

    for (const team of teams) {
      const users: User[] = []
      
      for (const userId of team.userIds) {
        const user = await userRepo.findById(userId)
        if (user) users.push(user)
      }
      
      result.push({ ...team, users })
    }

    return result
  }

  /**
   * Get team statistics
   */
  async getTeamStats(teamId: string): Promise<{
    memberCount: number
    activeMembers: User[]
    inactiveUserIds: string[]
  }> {
    const team = await this.findById(teamId)
    if (!team) {
      throw new Error(`Team with id ${teamId} not found`)
    }

    const userRepo = new UserRepository(this.storage)
    const activeMembers: User[] = []
    const inactiveUserIds: string[] = []

    for (const userId of team.userIds) {
      const user = await userRepo.findById(userId)
      if (user) {
        activeMembers.push(user)
      } else {
        inactiveUserIds.push(userId)
      }
    }

    return {
      memberCount: team.userIds.length,
      activeMembers,
      inactiveUserIds
    }
  }

  /**
   * Search teams by name
   */
  async searchByName(nameQuery: string): Promise<Team[]> {
    const allTeams = await this.findAll()
    return allTeams.filter(team => 
      team.name.toLowerCase().includes(nameQuery.toLowerCase())
    )
  }

  /**
   * Check if team name already exists
   */
  async nameExists(name: string): Promise<boolean> {
    const team = await this.findByName(name)
    return team !== null
  }

  /**
   * Create team with validation
   */
  async create(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    await this.validateData(data)
    return super.create(data)
  }

  /**
   * Update team with validation
   */
  async update(id: string, data: Partial<Team>): Promise<Team> {
    await this.validateDataForUpdate(id, data)
    return super.update(id, data)
  }

  /**
   * Validate team data for creation
   */
  protected async validateData(data: Partial<Team>): Promise<void> {
    if (data.name) {
      // Check name format
      if (data.name.trim().length < 2) {
        throw new Error('Team name must be at least 2 characters long')
      }

      // Check for duplicate name
      const existingTeam = await this.findByName(data.name.trim())
      if (existingTeam) {
        throw new Error('Team name already exists')
      }
    }

    if (data.userIds) {
      // Validate all user IDs exist
      const userRepo = new UserRepository(this.storage)
      for (const userId of data.userIds) {
        const userExists = await userRepo.exists(userId)
        if (!userExists) {
          throw new Error(`User with id ${userId} does not exist`)
        }
      }

      // Remove duplicates
      data.userIds = [...new Set(data.userIds)]
    }
  }

  /**
   * Validate team data for updates
   */
  protected async validateDataForUpdate(id: string, data: Partial<Team>): Promise<void> {
    if (data.name) {
      // Check name format
      if (data.name.trim().length < 2) {
        throw new Error('Team name must be at least 2 characters long')
      }

      // Check for duplicate name (excluding current team)
      const existingTeam = await this.findByName(data.name.trim())
      if (existingTeam && existingTeam.id !== id) {
        throw new Error('Team name already exists')
      }
    }

    if (data.userIds) {
      // Validate all user IDs exist
      const userRepo = new UserRepository(this.storage)
      for (const userId of data.userIds) {
        const userExists = await userRepo.exists(userId)
        if (!userExists) {
          throw new Error(`User with id ${userId} does not exist`)
        }
      }

      // Remove duplicates
      data.userIds = [...new Set(data.userIds)]
    }
  }

  /**
   * Clean up teams by removing non-existent users
   */
  async cleanupInactiveUsers(): Promise<void> {
    const teams = await this.findAll()
    const userRepo = new UserRepository(this.storage)

    for (const team of teams) {
      const validUserIds: string[] = []
      
      for (const userId of team.userIds) {
        const userExists = await userRepo.exists(userId)
        if (userExists) {
          validUserIds.push(userId)
        }
      }

      if (validUserIds.length !== team.userIds.length) {
        await this.update(team.id, { userIds: validUserIds })
      }
    }
  }

  /**
   * Get teams where user is the only member
   */
  async findSingleMemberTeams(): Promise<Team[]> {
    const teams = await this.findAll()
    return teams.filter(team => team.userIds.length === 1)
  }

  /**
   * Get teams with no members
   */
  async findEmptyTeams(): Promise<Team[]> {
    const teams = await this.findAll()
    return teams.filter(team => team.userIds.length === 0)
  }
}