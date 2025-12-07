import { UniversalStorage } from './implementations/UniversalStorage'
import { UserRepository } from './repositories/UserRepository'
import { TeamRepository } from './repositories/TeamRepository'
import { FlowRepository } from './repositories/FlowRepository'
import { TemplateRepository } from './repositories/TemplateRepository'
import type { IStorageWithTransactions } from './interfaces/IStorage'

/**
 * Dependency Injection Container for Storage Layer
 * Manages singleton instances of storage and repositories
 */
export class StorageContainer {
  private static instance: StorageContainer | null = null
  private storage: UniversalStorage | null = null
  private userRepository: UserRepository | null = null
  private teamRepository: TeamRepository | null = null
  private flowRepository: FlowRepository | null = null
  private templateRepository: TemplateRepository | null = null

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of StorageContainer
   */
  static getInstance(): StorageContainer {
    if (!StorageContainer.instance) {
      StorageContainer.instance = new StorageContainer()
    }
    return StorageContainer.instance
  }

  /**
   * Reset container (useful for testing)
   */
  static reset(): void {
    StorageContainer.instance = null
  }

  /**
   * Get storage instance
   */
  getStorage(): IStorageWithTransactions {
    if (!this.storage) {
      this.storage = new UniversalStorage()
    }
    return this.storage
  }

  /**
   * Get user repository instance
   */
  getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository(this.getStorage())
    }
    return this.userRepository
  }

  /**
   * Get team repository instance
   */
  getTeamRepository(): TeamRepository {
    if (!this.teamRepository) {
      this.teamRepository = new TeamRepository(this.getStorage())
    }
    return this.teamRepository
  }

  /**
   * Get flow repository instance
   */
  getFlowRepository(): FlowRepository {
    if (!this.flowRepository) {
      this.flowRepository = new FlowRepository(this.getStorage())
    }
    return this.flowRepository
  }

  /**
   * Get template repository instance
   */
  getTemplateRepository(): TemplateRepository {
    if (!this.templateRepository) {
      this.templateRepository = new TemplateRepository(this.getStorage())
    }
    return this.templateRepository
  }

  /**
   * Get all repositories
   */
  getAllRepositories() {
    return {
      users: this.getUserRepository(),
      teams: this.getTeamRepository(),
      flows: this.getFlowRepository(),
      templates: this.getTemplateRepository()
    }
  }

  /**
   * Execute operations within a transaction
   */
  async withTransaction<T>(
    callback: (repositories: {
      users: UserRepository
      teams: TeamRepository
      flows: FlowRepository
      templates: TemplateRepository
      storage: IStorageWithTransactions
    }) => Promise<T>
  ): Promise<T> {
    const storage = this.getStorage()
    return storage.withTransaction(async (tx) => {
      // Create repository instances that use the transaction
      const transactionRepositories = {
        users: new UserRepository(storage),
        teams: new TeamRepository(storage),
        flows: new FlowRepository(storage),
        templates: new TemplateRepository(storage),
        storage: storage
      }

      return callback(transactionRepositories)
    })
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.storage) {
      // Close database connections if needed
      // The UniversalStorage implementation should handle cleanup
    }
    
    // Reset all repository instances
    this.storage = null
    this.userRepository = null
    this.teamRepository = null
    this.flowRepository = null
    this.templateRepository = null
  }
}

/**
 * Utility function for easy access to storage container
 */
export function useStorage(): StorageContainer {
  return StorageContainer.getInstance()
}

/**
 * Utility function to get storage instance directly
 */
export function useStorageInstance(): IStorageWithTransactions {
  return useStorage().getStorage()
}

/**
 * Utility function to get user repository directly
 */
export function useUserRepository(): UserRepository {
  return useStorage().getUserRepository()
}

/**
 * Utility function to get team repository directly
 */
export function useTeamRepository(): TeamRepository {
  return useStorage().getTeamRepository()
}

/**
 * Utility function to get flow repository directly
 */
export function useFlowRepository(): FlowRepository {
  return useStorage().getFlowRepository()
}

/**
 * Utility function to get template repository directly
 */
export function useTemplateRepository(): TemplateRepository {
  return useStorage().getTemplateRepository()
}

/**
 * Storage factory for creating custom storage instances
 */
export class StorageFactory {
  /**
   * Create a new storage instance with custom configuration
   */
  static createStorage(): IStorageWithTransactions {
    return new UniversalStorage()
  }

  /**
   * Create repository instances with custom storage
   */
  static createRepositories(storage: IStorageWithTransactions) {
    return {
      users: new UserRepository(storage),
      teams: new TeamRepository(storage),
      flows: new FlowRepository(storage),
      templates: new TemplateRepository(storage)
    }
  }

  /**
   * Create a complete storage setup for testing
   */
  static createTestStorage() {
    const storage = new UniversalStorage()
    const repositories = StorageFactory.createRepositories(storage)
    
    return {
      storage,
      ...repositories,
      async cleanup() {
        // Clear all data for clean tests
        await storage.clear('users')
        await storage.clear('teams')
        await storage.clear('flows')
        await storage.clear('templates')
      }
    }
  }
}

/**
 * Global storage instance for backward compatibility with existing code
 * @deprecated Use useStorage() instead
 */
let globalStorageInstance: StorageContainer | null = null

export function useDatabaseStorage(): IStorageWithTransactions {
  if (!globalStorageInstance) {
    globalStorageInstance = StorageContainer.getInstance()
  }
  return globalStorageInstance.getStorage()
}