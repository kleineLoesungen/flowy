import type { IStorageWithTransactions, ITransaction } from '../interfaces/IStorage'
import type { DatabaseAdapter, DatabaseConfig } from '../../db/core/DatabaseAdapter'
import { DatabaseFactory } from '../../db/core/DatabaseFactory'

export class UniversalStorage implements IStorageWithTransactions {
  private db: DatabaseAdapter | null = null
  private tableMappings = new Map([
    ['users', 'users'],
    ['teams', 'teams'],
    ['flows', 'flows'],
    ['templates', 'flow_templates']
  ])

  private async getDB(): Promise<DatabaseAdapter> {
    if (!this.db) {
      // Create database config based on environment
      const config: DatabaseConfig = this.createDatabaseConfig()
      this.db = DatabaseFactory.createAdapter(config)
      await this.db.connect()
    }
    return this.db!
  }

  private createDatabaseConfig(): DatabaseConfig {
    // Check for PostgreSQL connection string
    const pgConnectionString = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL
    
    if (pgConnectionString && pgConnectionString.startsWith('postgres')) {
      return DatabaseFactory.parseConnectionString(pgConnectionString)
    }
    
    // Default to SQLite
    return {
      type: 'sqlite',
      path: './data/flowy.db'
    }
  }

  async create<T>(entity: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const db = await this.getDB()
    const tableName = this.getTableName(entity)
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const fullData = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    }
    
    const serialized = this.serializeValue(fullData)
    const columns = Object.keys(serialized)
    const placeholders = columns.map(() => '?').join(', ')
    const values = Object.values(serialized)
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    await db.run(sql, values)
    
    return fullData as T
  }

  async findById<T>(entity: string, id: string): Promise<T | null> {
    const db = await this.getDB()
    const tableName = this.getTableName(entity)
    
    const row = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id])
    return row ? this.deserializeRow(row) : null
  }

  async findMany<T>(entity: string, filters?: Record<string, any>): Promise<T[]> {
    const db = await this.getDB()
    const tableName = this.getTableName(entity)
    
    let sql = `SELECT * FROM ${tableName}`
    const params: any[] = []
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters).map(([key, value]) => {
        const dbKey = this.camelToSnakeCase(key)
        params.push(value)
        return `${dbKey} = ?`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    
    const rows = await db.query(sql, params)
    return rows.map((row: any) => this.deserializeRow(row))
  }

  async findWhere<T>(entity: string, conditions: Record<string, any>): Promise<T[]> {
    return this.findMany<T>(entity, conditions)
  }

  async findAll<T>(entity: string): Promise<T[]> {
    return this.findMany<T>(entity)
  }

  async update<T>(entity: string, id: string, data: Partial<T>): Promise<T> {
    const db = await this.getDB()
    const tableName = this.getTableName(entity)
    
    const existing = await this.findById<T>(entity, id)
    if (!existing) {
      throw new Error(`${entity} with id ${id} not found`)
    }
    
    const updatedData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    const serialized = this.serializeValue(updatedData)
    const updates = Object.entries(serialized)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `${key} = ?`)
      .join(', ')
    
    const values = Object.entries(serialized)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value)
    
    values.push(id)
    
    const sql = `UPDATE ${tableName} SET ${updates} WHERE id = ?`
    await db.run(sql, values)
    
    return updatedData
  }

  async delete(entity: string, id: string): Promise<boolean> {
    const db = await this.getDB()
    const tableName = this.getTableName(entity)
    
    const result = await db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id])
    return result.changes > 0
  }

  async count(entity: string, conditions?: Record<string, any>): Promise<number> {
    const db = await this.getDB()
    const tableName = this.getTableName(entity)
    
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`
    const params: any[] = []
    
    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = Object.entries(conditions).map(([key, value]) => {
        const dbKey = this.camelToSnakeCase(key)
        params.push(value)
        return `${dbKey} = ?`
      }).join(' AND ')
      sql += ` WHERE ${whereClause}`
    }
    
    const result = await db.get(sql, params)
    return result.count
  }

  async exists(entity: string, id: string): Promise<boolean> {
    const item = await this.findById(entity, id)
    return item !== null
  }

  async clear(entity: string): Promise<void> {
    const db = await this.getDB()
    const tableName = this.getTableName(entity)
    await db.run(`DELETE FROM ${tableName}`)
  }

  async transaction(): Promise<ITransaction> {
    const db = await this.getDB()
    await db.run('BEGIN TRANSACTION')
    return new Transaction(db, this)
  }

  async withTransaction<T>(callback: (tx: ITransaction) => Promise<T>): Promise<T> {
    const tx = await this.transaction()
    try {
      const result = await callback(tx)
      await tx.commit()
      return result
    } catch (error) {
      await tx.rollback()
      throw error
    }
  }

  private getTableName(entity: string): string {
    return this.tableMappings.get(entity) || entity
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  private serializeValue(value: any): Record<string, any> {
    if (typeof value !== 'object' || value === null) {
      return { data: JSON.stringify(value) }
    }

    const serialized: Record<string, any> = {}
    
    for (const [key, val] of Object.entries(value)) {
      // Convert camelCase to snake_case for database columns
      const dbKey = this.camelToSnakeCase(key)
      
      // Handle undefined values - convert to null for SQLite
      if (val === undefined) {
        serialized[dbKey] = null
      } else if (typeof val === 'boolean') {
        // Convert boolean to integer for SQLite (0 or 1)
        serialized[dbKey] = val ? 1 : 0
      } else if (Array.isArray(val) || (typeof val === 'object' && val !== null && !(val instanceof Date))) {
        serialized[dbKey] = JSON.stringify(val)
      } else if (val instanceof Date) {
        serialized[dbKey] = val.toISOString()
      } else {
        serialized[dbKey] = val
      }
    }
    
    return serialized
  }

  private deserializeRow(row: any): any {
    if (!row) return null

    // Handle simple data wrapper format
    if (row.data && Object.keys(row).length === 1) {
      try {
        return JSON.parse(row.data)
      } catch {
        return row.data
      }
    }

    const deserialized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(row)) {
      // Convert snake_case to camelCase for JavaScript objects
      const jsKey = this.snakeToCamelCase(key)
      
      // Parse JSON fields back to objects/arrays
      if (typeof value === 'string' && 
          (key.includes('_ids') || key === 'elements' || key === 'relations' || 
           key === 'layout' || key === 'user_ids' || key === 'consulted_team_ids' || 
           key === 'comments')) {
        try {
          deserialized[jsKey] = JSON.parse(value)
        } catch {
          deserialized[jsKey] = value
        }
      } else if (key === 'hidden' && typeof value === 'number') {
        // Convert SQLite integer back to boolean
        deserialized[jsKey] = value === 1
      } else {
        deserialized[jsKey] = value
      }
    }
    
    return deserialized
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }

  private snakeToCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}

class Transaction implements ITransaction {
  constructor(
    private db: DatabaseAdapter,
    private storage: UniversalStorage
  ) {}

  async create<T>(entity: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return this.storage.create<T>(entity, data)
  }

  async update<T>(entity: string, id: string, data: Partial<T>): Promise<T> {
    return this.storage.update<T>(entity, id, data)
  }

  async delete(entity: string, id: string): Promise<boolean> {
    return this.storage.delete(entity, id)
  }

  async commit(): Promise<void> {
    await this.db.run('COMMIT')
  }

  async rollback(): Promise<void> {
    await this.db.run('ROLLBACK')
  }
}