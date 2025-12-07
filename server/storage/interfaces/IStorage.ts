/**
 * Core storage interface providing database-agnostic CRUD operations
 */
export interface IStorage {
  // Basic CRUD operations
  create<T>(entity: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  findById<T>(entity: string, id: string): Promise<T | null>
  findMany<T>(entity: string, filters?: Record<string, any>): Promise<T[]>
  update<T>(entity: string, id: string, data: Partial<T>): Promise<T>
  delete(entity: string, id: string): Promise<boolean>
  
  // Advanced query operations
  findWhere<T>(entity: string, conditions: Record<string, any>): Promise<T[]>
  count(entity: string, conditions?: Record<string, any>): Promise<number>
  exists(entity: string, id: string): Promise<boolean>
  
  // Utility operations
  clear(entity: string): Promise<void>
  findAll<T>(entity: string): Promise<T[]>
}

/**
 * Transaction interface for database operations requiring atomicity
 */
export interface ITransaction {
  create<T>(entity: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update<T>(entity: string, id: string, data: Partial<T>): Promise<T>
  delete(entity: string, id: string): Promise<boolean>
  commit(): Promise<void>
  rollback(): Promise<void>
}

/**
 * Extended storage interface with transaction support
 */
export interface IStorageWithTransactions extends IStorage {
  transaction(): Promise<ITransaction>
  withTransaction<T>(callback: (tx: ITransaction) => Promise<T>): Promise<T>
}

/**
 * Repository interface for entity-specific operations
 */
export interface IRepository<T> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<boolean>
  exists(id: string): Promise<boolean>
  count(): Promise<number>
}

/**
 * Query options for advanced searches
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  order?: 'ASC' | 'DESC'
  select?: string[]
}

/**
 * Pagination result wrapper
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}