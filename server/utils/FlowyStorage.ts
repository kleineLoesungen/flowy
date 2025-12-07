import { getDatabase } from '../db/core/DatabaseManager'
import { DatabaseAdapter } from '../db/core/DatabaseAdapter'

interface StorageInterface {
  getItem<T = any>(key: string): Promise<T | null>
  setItem<T = any>(key: string, value: T): Promise<void>
  removeItem(key: string): Promise<void>
  getKeys(prefix?: string): Promise<string[]>
}

export class FlowyStorage implements StorageInterface {
  private db: DatabaseAdapter | null = null
  private tableMappings: Map<string, string>

  constructor() {
    this.tableMappings = new Map([
      ['users', 'users'],
      ['teams', 'teams'],
      ['templates', 'flow_templates'],
      ['flows', 'flows']
    ])
  }

  private async getDB(): Promise<DatabaseAdapter> {
    if (!this.db) {
      this.db = await getDatabase()
    }
    return this.db
  }

  private parseKey(key: string): { table: string; id?: string } {
    if (key.includes(':')) {
      const [table, id] = key.split(':', 2)
      return { table, id }
    }
    return { table: key }
  }

  private getTableName(table: string): string {
    return this.tableMappings.get(table) || table
  }

  async getItem<T = any>(key: string): Promise<T | null> {
    const db = await this.getDB()
    const { table, id } = this.parseKey(key)
    const tableName = this.getTableName(table)

    try {
      if (id) {
        const row = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id])
        if (!row) return null
        return this.deserializeRow(row) as T
      } else {
        const rows = await db.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`)
        return { data: rows.map((row: any) => this.deserializeRow(row)) } as T
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error)
      return null
    }
  }

  async setItem<T = any>(key: string, value: T): Promise<void> {
    const db = await this.getDB()
    const { table, id } = this.parseKey(key)
    const tableName = this.getTableName(table)

    if (!id) throw new Error(`Cannot set item without ID: ${key}`)

    try {
      const serialized = this.serializeValue(value)
      const now = new Date().toISOString()
      const existing = await db.get(`SELECT id FROM ${tableName} WHERE id = ?`, [id])
      
      if (existing) {
        await this.updateRecord(db, tableName, id, serialized, now)
      } else {
        await this.insertRecord(db, tableName, id, serialized, now)
      }
    } catch (error) {
      console.error(`Error setting item ${key}:`, error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.getDB()
    const { table, id } = this.parseKey(key)
    const tableName = this.getTableName(table)

    try {
      if (id) {
        await db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id])
      } else {
        await db.run(`DELETE FROM ${tableName}`)
      }
    } catch (error) {
      console.error(`Error removing item ${key}:`, error)
      throw error
    }
  }

  async getKeys(prefix?: string): Promise<string[]> {
    const db = await this.getDB()
    const keys: string[] = []

    try {
      if (prefix) {
        const table = prefix.replace(':', '')
        const tableName = this.getTableName(table)
        const rows = await db.query(`SELECT id FROM ${tableName}`)
        return rows.map((row: any) => `${table}:${row.id}`)
      } else {
        for (const [key, tableName] of this.tableMappings) {
          const rows = await db.query(`SELECT id FROM ${tableName}`)
          keys.push(...rows.map((row: any) => `${key}:${row.id}`))
        }
      }
      return keys
    } catch (error) {
      console.error('Error getting keys:', error)
      return []
    }
  }

  private serializeValue(value: any): Record<string, any> {
    if (typeof value !== 'object' || value === null) {
      return { data: JSON.stringify(value) }
    }

    const serialized: Record<string, any> = {}
    
    for (const [key, val] of Object.entries(value)) {
      // Convert camelCase to snake_case for database columns
      const dbKey = this.camelToSnakeCase(key)
      
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        serialized[dbKey] = JSON.stringify(val)
      } else {
        serialized[dbKey] = val
      }
    }
    
    return serialized
  }

  private deserializeRow(row: any): any {
    if (!row) return null

    const deserialized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(row)) {
      if (key === 'data') {
        try {
          return JSON.parse(value as string)
        } catch {
          return value
        }
      }
      
      // Convert snake_case back to camelCase
      const jsKey = this.snakeToCamelCase(key)
      
      // Try to parse JSON fields
      if (typeof value === 'string' && 
          (key.includes('_ids') || key === 'elements' || key === 'relations' || key === 'layout')) {
        try {
          deserialized[jsKey] = JSON.parse(value)
        } catch {
          deserialized[jsKey] = value
        }
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

  private async insertRecord(db: DatabaseAdapter, tableName: string, id: string, data: Record<string, any>, now: string): Promise<void> {
    const columns = ['id', ...Object.keys(data), 'created_at', 'updated_at']
    const placeholders = columns.map(() => '?').join(', ')
    const values = [id, ...Object.values(data), now, now]
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    await db.run(sql, values)
  }

  private async updateRecord(db: DatabaseAdapter, tableName: string, id: string, data: Record<string, any>, now: string): Promise<void> {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = [...Object.values(data), now, id]
    
    const sql = `UPDATE ${tableName} SET ${setClause}, updated_at = ? WHERE id = ?`
    await db.run(sql, values)
  }
}

// Global storage instance
let storageInstance: FlowyStorage | null = null

export function useDatabaseStorage(): StorageInterface {
  if (!storageInstance) {
    storageInstance = new FlowyStorage()
  }
  return storageInstance
}

export type { StorageInterface }