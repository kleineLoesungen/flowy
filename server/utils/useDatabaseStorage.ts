import { getDatabase, DatabaseConnection } from './database'
import type { User } from '../../types/User'
import type { Team } from '../../types/Team'
import type { Flow } from '../../types/Flow'
import type { FlowTemplate } from '../../types/FlowTemplate'

interface StorageInterface {
  getItem<T = any>(key: string): Promise<T | null>
  setItem<T = any>(key: string, value: T): Promise<void>
  removeItem(key: string): Promise<void>
  getKeys(prefix?: string): Promise<string[]>
}

class DatabaseStorage implements StorageInterface {
  private db: DatabaseConnection | null = null
  private initialized: boolean = false

  private async getDB(): Promise<DatabaseConnection> {
    if (!this.db && !this.initialized) {
      try {
        this.db = await getDatabase()
        this.initialized = true
      } catch (error) {
        this.initialized = true
        console.error('Failed to initialize database:', error)
        throw error
      }
    }
    if (!this.db) {
      throw new Error('Database not initialized')
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
    const tableMap: Record<string, string> = {
      users: 'users',
      teams: 'teams',
      templates: 'flow_templates',
      flows: 'flows'
    }
    return tableMap[table] || table
  }

  async getItem<T = any>(key: string): Promise<T | null> {
    const db = await this.getDB()
    const { table, id } = this.parseKey(key)
    const tableName = this.getTableName(table)

    try {
      if (id) {
        // Get single item by ID
        const row = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id])
        if (!row) return null
        return this.deserializeRow(row) as T
      } else {
        // Get all items from table
        const rows = await db.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`)
        return { data: rows.map(row => this.deserializeRow(row)) } as T
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

    try {
      if (id) {
        // Update or insert single item
        const serialized = this.serializeValue(value)
        const now = new Date().toISOString()
        
        const existing = await db.get(`SELECT id FROM ${tableName} WHERE id = ?`, [id])
        
        if (existing) {
          // Update existing record
          await this.updateRecord(db, tableName, id, serialized, now)
        } else {
          // Insert new record
          await this.insertRecord(db, tableName, id, serialized, now)
        }
      } else {
        // This shouldn't happen in normal usage, but handle gracefully
        throw new Error(`Cannot set item without ID: ${key}`)
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
        // Clear entire table (dangerous, but matches original behavior)
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
        // Handle prefix-based queries like 'flows:', 'users:', etc.
        const table = prefix.replace(':', '')
        const tableName = this.getTableName(table)
        const rows = await db.query(`SELECT id FROM ${tableName}`)
        return rows.map(row => `${table}:${row.id}`)
      } else {
        // Return all keys
        const tables = ['users', 'teams', 'flow_templates', 'flows']
        
        for (const table of tables) {
          const rows = await db.query(`SELECT id FROM ${table}`)
          const keyPrefix = table === 'flow_templates' ? 'templates' : table
          keys.push(...rows.map(row => `${keyPrefix}:${row.id}`))
        }
      }

      return keys
    } catch (error) {
      console.error('Error getting keys:', error)
      return []
    }
  }

  private serializeValue(value: any): Record<string, any> {
    if (typeof value === 'object' && value !== null) {
      const serialized: Record<string, any> = {}
      
      for (const [key, val] of Object.entries(value)) {
        if (key === 'elements' || key === 'userIds' || key === 'consultedTeamIds' || key === 'comments' || key === 'relations' || key === 'layout') {
          // Serialize arrays and objects as JSON strings
          serialized[this.toSnakeCase(key)] = JSON.stringify(val)
        } else {
          serialized[this.toSnakeCase(key)] = val
        }
      }
      
      return serialized
    }
    
    return { value: JSON.stringify(value) }
  }

  private deserializeRow(row: any): any {
    if (!row) return null

    const deserialized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(row)) {
      const camelKey = this.toCamelCase(key)
      
      if (key === 'elements' || key === 'user_ids' || key === 'consulted_team_ids' || key === 'comments' || key === 'relations' || key === 'layout') {
        // Deserialize JSON strings back to arrays/objects
        try {
          deserialized[camelKey] = value ? JSON.parse(value as string) : (key === 'layout' ? null : [])
        } catch {
          deserialized[camelKey] = key === 'layout' ? null : []
        }
      } else if (key === 'hidden') {
        // Convert boolean values
        deserialized[camelKey] = Boolean(value)
      } else if (key !== 'created_at' && key !== 'updated_at') {
        // Skip internal timestamps, keep everything else
        deserialized[camelKey] = value
      }
    }
    
    return deserialized
  }

  private ensureRequiredColumns(tableName: string, data: Record<string, any>): Record<string, any> {
    const enhancedData = { ...data }
    
    // Ensure required columns exist with defaults based on table
    switch (tableName) {
      case 'flow_templates':
        if (!enhancedData.hasOwnProperty('elements')) enhancedData.elements = '[]'
        if (!enhancedData.hasOwnProperty('relations')) enhancedData.relations = '[]'
        if (!enhancedData.hasOwnProperty('starting_element_id')) enhancedData.starting_element_id = null
        if (!enhancedData.hasOwnProperty('layout')) enhancedData.layout = null
        break
      case 'flows':
        if (!enhancedData.hasOwnProperty('elements')) enhancedData.elements = '[]'
        if (!enhancedData.hasOwnProperty('relations')) enhancedData.relations = '[]'
        if (!enhancedData.hasOwnProperty('starting_element_id')) enhancedData.starting_element_id = null
        if (!enhancedData.hasOwnProperty('layout')) enhancedData.layout = null
        if (!enhancedData.hasOwnProperty('template_id')) enhancedData.template_id = null
        if (!enhancedData.hasOwnProperty('started_at')) enhancedData.started_at = null
        if (!enhancedData.hasOwnProperty('expected_end_date')) enhancedData.expected_end_date = null
        if (!enhancedData.hasOwnProperty('completed_at')) enhancedData.completed_at = null
        if (!enhancedData.hasOwnProperty('hidden')) enhancedData.hidden = 0
        break
      case 'teams':
        if (!enhancedData.hasOwnProperty('user_ids')) enhancedData.user_ids = '[]'
        break
      case 'users':
        if (!enhancedData.hasOwnProperty('password_hash')) enhancedData.password_hash = null
        break
    }
    
    return enhancedData
  }

  private async insertRecord(db: DatabaseConnection, tableName: string, id: string, data: Record<string, any>, now: string): Promise<void> {
    // Filter to only valid columns and ensure required columns are present
    const validData = this.filterValidColumns(tableName, data)
    const enhancedData = this.ensureRequiredColumns(tableName, validData)
    
    // Convert any remaining array/object values to JSON strings for database storage
    const dbData: Record<string, any> = {}
    for (const [key, value] of Object.entries(enhancedData)) {
      if (key === 'elements' || key === 'relations' || key === 'layout' || key === 'user_ids' || key === 'consulted_team_ids') {
        // Ensure these fields are JSON strings
        if (typeof value === 'string') {
          dbData[key] = value // Already a string
        } else if (value === null || value === undefined) {
          dbData[key] = key === 'layout' ? null : '[]' // layout can be null, others default to empty array
        } else {
          dbData[key] = JSON.stringify(value) // Convert to JSON string
        }
      } else if (typeof value === 'boolean') {
        // Convert boolean to integer for SQLite
        dbData[key] = value ? 1 : 0
      } else {
        dbData[key] = value // Keep as-is for other fields
      }
    }
    
    const columns = ['id', ...Object.keys(dbData), 'created_at', 'updated_at']
    const values = [id, ...Object.values(dbData), now, now]
    const placeholders = columns.map(() => '?').join(', ')
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    await db.run(sql, values)
  }

  private filterValidColumns(tableName: string, data: Record<string, any>): Record<string, any> {
    const validData: Record<string, any> = {}
    
    // Define valid columns for each table (excluding id, created_at, updated_at)
    const validColumns: Record<string, string[]> = {
      flow_templates: ['name', 'description', 'elements', 'relations', 'starting_element_id', 'layout'],
      flows: ['name', 'description', 'template_id', 'elements', 'relations', 'starting_element_id', 'started_at', 'expected_end_date', 'completed_at', 'hidden', 'layout'],
      teams: ['name', 'user_ids'],
      users: ['name', 'email', 'password_hash', 'role']
    }
    
    const allowedColumns = validColumns[tableName] || []
    
    // Only include columns that exist in the database schema
    for (const [key, value] of Object.entries(data)) {
      if (allowedColumns.includes(key)) {
        validData[key] = value
      }
    }
    
    return validData
  }

  private async updateRecord(db: DatabaseConnection, tableName: string, id: string, data: Record<string, any>, now: string): Promise<void> {
    console.log(`[DEBUG] updateRecord called for ${tableName}:${id} with data:`, Object.keys(data))
    
    // Simplified approach: only update fields that we know are safe
    if (tableName === 'flow_templates') {
      // For flow templates, only update basic fields and ensure JSON fields are properly serialized
      const safeData: Record<string, any> = {} // Updated for better reliability
      
      if (data.name !== undefined) safeData.name = data.name
      if (data.description !== undefined) safeData.description = data.description
      if (data.elements !== undefined) safeData.elements = typeof data.elements === 'string' ? data.elements : JSON.stringify(data.elements)
      if (data.relations !== undefined) safeData.relations = typeof data.relations === 'string' ? data.relations : JSON.stringify(data.relations)
      if (data.starting_element_id !== undefined) safeData.starting_element_id = data.starting_element_id
      if (data.layout !== undefined) safeData.layout = data.layout === null ? null : (typeof data.layout === 'string' ? data.layout : JSON.stringify(data.layout))
      
      if (Object.keys(safeData).length === 0) {
        // Only update timestamp
        const sql = `UPDATE ${tableName} SET updated_at = ? WHERE id = ?`
        await db.run(sql, [now, id])
        return
      }
      
      const columns = Object.keys(safeData)
      const values = Object.values(safeData)
      const setClause = columns.map(col => `${col} = ?`).join(', ')
      
      const sql = `UPDATE ${tableName} SET ${setClause}, updated_at = ? WHERE id = ?`
      await db.run(sql, [...values, now, id])
    } else {
      // For other tables, use the general approach with proper type conversion
      const validData = this.filterValidColumns(tableName, data)
      
      // Convert boolean values to integers for SQLite
      const convertedData: Record<string, any> = {}
      for (const [key, value] of Object.entries(validData)) {
        if (typeof value === 'boolean') {
          convertedData[key] = value ? 1 : 0
        } else {
          convertedData[key] = value
        }
      }
      
      if (Object.keys(convertedData).length === 0) {
        const sql = `UPDATE ${tableName} SET updated_at = ? WHERE id = ?`
        await db.run(sql, [now, id])
        return
      }
      
      const columns = Object.keys(convertedData)
      const values = Object.values(convertedData)
      const setClause = columns.map(col => `${col} = ?`).join(', ')
      
      const sql = `UPDATE ${tableName} SET ${setClause}, updated_at = ? WHERE id = ?`
      await db.run(sql, [...values, now, id])
    }
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
  }
}

// Global storage instance
let storageInstance: DatabaseStorage | null = null

export function useDatabaseStorage(): StorageInterface {
  if (!storageInstance) {
    storageInstance = new DatabaseStorage()
  }
  return storageInstance
}

export type { StorageInterface }