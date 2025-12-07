import type { User, NewUser } from '../../db/schema'
import { BaseRepository } from './BaseRepository'
import type { IStorage } from '../interfaces/IStorage'

export class UserRepository extends BaseRepository<User> {
  constructor(storage: IStorage) {
    super(storage, 'users')
  }

  /**
   * Find user by email (case insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.storage.findWhere<User>('users', { email: email.toLowerCase() })
    return users.length > 0 ? users[0] : null
  }

  /**
   * Find all admin users
   */
  async findAdmins(): Promise<User[]> {
    return this.storage.findWhere<User>('users', { role: 'admin' })
  }

  /**
   * Count admin users
   */
  async countAdmins(): Promise<number> {
    return this.storage.count('users', { role: 'admin' })
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return user !== null
  }

  /**
   * Find users by role
   */
  async findByRole(role: 'member' | 'admin'): Promise<User[]> {
    return this.storage.findWhere<User>('users', { role })
  }

  /**
   * Find users by partial name match (for search)
   */
  async searchByName(nameQuery: string): Promise<User[]> {
    const allUsers = await this.findAll()
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(nameQuery.toLowerCase())
    )
  }

  /**
   * Create user with email normalization
   */
  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const normalizedData = {
      ...data,
      email: data.email.toLowerCase()
    }
    
    await this.validateData(normalizedData)
    return super.create(normalizedData)
  }

  /**
   * Update user with email normalization
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    if (data.email) {
      data.email = data.email.toLowerCase()
    }
    
    await this.validateDataForUpdate(id, data)
    return super.update(id, data)
  }

  /**
   * Validate user data (for create operations)
   */
  protected async validateData(data: Partial<User>): Promise<void> {
    if (data.email) {
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format')
      }

      // Check for duplicate email (only if creating)
      const existingUser = await this.findByEmail(data.email)
      if (existingUser) {
        throw new Error('Email already exists')
      }
    }

    if (data.role && !['member', 'admin'].includes(data.role)) {
      throw new Error('Invalid role. Must be "member" or "admin"')
    }
  }

  /**
   * Validate user data (for update operations)
   */
  protected async validateDataForUpdate(id: string, data: Partial<User>): Promise<void> {
    if (data.email) {
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format')
      }

      // Check for duplicate email (exclude current user)
      const existingUser = await this.findByEmail(data.email)
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already exists')
      }
    }

    if (data.role && !['member', 'admin'].includes(data.role)) {
      throw new Error('Invalid role. Must be "member" or "admin"')
    }
  }

  /**
   * Get users without password hash (for public responses)
   */
  async findAllPublic(): Promise<(Omit<User, 'passwordHash'> & { hasPassword: boolean })[]> {
    const users = await this.findAll()
    return users.map(user => this.removePasswordHash(user))
  }

  /**
   * Get user by ID without password hash
   */
  async findByIdPublic(id: string): Promise<(Omit<User, 'passwordHash'> & { hasPassword: boolean }) | null> {
    const user = await this.findById(id)
    return user ? this.removePasswordHash(user) : null
  }

  /**
   * Remove password hash from user object
   */
  private removePasswordHash(user: User): Omit<User, 'passwordHash'> & { hasPassword: boolean } {
    const { passwordHash, ...userWithoutPassword } = user
    return { ...userWithoutPassword, hasPassword: !!passwordHash }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(id: string): Promise<boolean> {
    const user = await this.findById(id)
    return user?.role === 'admin'
  }

  /**
   * Promote user to admin
   */
  async promoteToAdmin(id: string): Promise<User> {
    return this.update(id, { role: 'admin' })
  }

  /**
   * Demote user to member (only if not the last admin)
   */
  async demoteToMember(id: string): Promise<User> {
    const adminCount = await this.countAdmins()
    const user = await this.findById(id)
    
    if (user?.role === 'admin' && adminCount <= 1) {
      throw new Error('Cannot demote the last admin user')
    }
    
    return this.update(id, { role: 'member' })
  }
}