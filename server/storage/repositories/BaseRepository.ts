import type { IStorage, IRepository } from '../interfaces/IStorage'

/**
 * Base repository class providing common CRUD operations for all entities
 * @template T The entity type this repository handles
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  constructor(
    protected storage: IStorage,
    protected entityName: string
  ) {}

  /**
   * Create a new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return this.storage.create<T>(this.entityName, data)
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.storage.findById<T>(this.entityName, id)
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<T[]> {
    return this.storage.findAll<T>(this.entityName)
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.storage.update<T>(this.entityName, id, data)
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    return this.storage.delete(this.entityName, id)
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: string): Promise<boolean> {
    return this.storage.exists(this.entityName, id)
  }

  /**
   * Count total entities
   */
  async count(): Promise<number> {
    return this.storage.count(this.entityName)
  }

  /**
   * Find entities matching conditions
   */
  async findWhere(conditions: Record<string, any>): Promise<T[]> {
    return this.storage.findWhere<T>(this.entityName, conditions)
  }

  /**
   * Find first entity matching conditions
   */
  async findOneWhere(conditions: Record<string, any>): Promise<T | null> {
    const results = await this.findWhere(conditions)
    return results.length > 0 ? results[0] : null
  }

  /**
   * Count entities matching conditions
   */
  async countWhere(conditions: Record<string, any>): Promise<number> {
    return this.storage.count(this.entityName, conditions)
  }

  /**
   * Check if any entity matches conditions
   */
  async existsWhere(conditions: Record<string, any>): Promise<boolean> {
    const count = await this.countWhere(conditions)
    return count > 0
  }

  /**
   * Clear all entities (use with caution)
   */
  async clear(): Promise<void> {
    return this.storage.clear(this.entityName)
  }

  /**
   * Validate data before operations (override in subclasses)
   */
  protected async validateData(data: Partial<T>): Promise<void> {
    // Default implementation does nothing
    // Override in specific repositories for validation
  }

  /**
   * Transform data after retrieval (override in subclasses)
   */
  protected transformEntity(entity: T): T {
    // Default implementation returns entity as-is
    // Override in specific repositories for transformation
    return entity
  }

  /**
   * Create multiple entities in a transaction
   */
  async createMany(dataList: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T[]> {
    const results: T[] = []
    
    for (const data of dataList) {
      const entity = await this.create(data)
      results.push(entity)
    }
    
    return results
  }

  /**
   * Update multiple entities by ID
   */
  async updateMany(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    const results: T[] = []
    
    for (const update of updates) {
      const entity = await this.update(update.id, update.data)
      results.push(entity)
    }
    
    return results
  }

  /**
   * Delete multiple entities by ID
   */
  async deleteMany(ids: string[]): Promise<number> {
    let deletedCount = 0
    
    for (const id of ids) {
      const deleted = await this.delete(id)
      if (deleted) deletedCount++
    }
    
    return deletedCount
  }
}