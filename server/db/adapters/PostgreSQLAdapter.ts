import { Client } from 'pg'
import { DatabaseAdapter, DatabaseConfig } from '../core/DatabaseAdapter'
import { promises as fs } from 'fs'
import path from 'path'

export class PostgreSQLAdapter implements DatabaseAdapter {
  type = 'postgres'
  private client: Client | null = null
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    this.client = new Client({
      connectionString: this.config.connectionString,
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ...this.config.options
    })
    await this.client.connect()
    
    // Set schema if specified
    if (this.config.schema) {
      await this.client.query(`SET search_path TO ${this.config.schema}`)
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.client) throw new Error('Database not connected')
    const result = await this.client.query(sql, params)
    return result.rows
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number }> {
    if (!this.client) throw new Error('Database not connected')
    const result = await this.client.query(sql, params)
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: undefined // PostgreSQL doesn't have this concept
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.client) throw new Error('Database not connected')
    const result = await this.client.query(sql, params)
    return result.rows[0] || null
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    if (!this.client) throw new Error('Database not connected')
    
    await this.client.query('BEGIN')
    try {
      const result = await callback(this)
      await this.client.query('COMMIT')
      return result
    } catch (error) {
      await this.client.query('ROLLBACK')
      throw error
    }
  }

  async migrate(migrationsPath: string): Promise<void> {
    try {
      // Create schema if it doesn't exist
      if (this.config.schema) {
        try {
          await this.client!.query(`CREATE SCHEMA IF NOT EXISTS ${this.config.schema}`)
          await this.client!.query(`SET search_path TO ${this.config.schema}`)
          console.log(`✅ Schema "${this.config.schema}" created/verified`)
        } catch (schemaError) {
          console.warn(`Warning creating schema:`, schemaError.message)
        }
      }
      
      // Use drizzle migrations if available, fallback to SQL files
      const drizzleMigrationPath = path.join(migrationsPath, 'postgres')
      
      try {
        // Try to import and run drizzle migrations
        const { migrate } = await import('drizzle-orm/postgres-js/migrator')
        const { drizzle } = await import('drizzle-orm/postgres-js')
        const postgres = await import('postgres')
        
        if (this.client) {
          // Create postgres client for drizzle
          const pgClient = postgres.default(this.config.connectionString || '')
          const drizzleDb = drizzle(pgClient)
          await migrate(drizzleDb, { migrationsFolder: drizzleMigrationPath })
          await pgClient.end()
          console.log('✅ PostgreSQL Drizzle migrations completed')
          return
        }
      } catch (drizzleError) {
        console.warn('Drizzle migration failed, falling back to SQL files:', drizzleError.message)
      }
      
      // Fallback to SQL file execution - migrationsPath is already pointing to postgres folder
      const files = await fs.readdir(migrationsPath)
      const sqlFiles = files.filter(file => file.endsWith('.sql')).sort()
      
      for (const file of sqlFiles) {
        const filePath = path.join(migrationsPath, file)
        const sql = await fs.readFile(filePath, 'utf-8')
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim())
        for (const statement of statements) {
          if (statement.trim()) {
            await this.run(statement.trim())
          }
        }
      }
      console.log('✅ PostgreSQL SQL migrations completed')
    } catch (error) {
      console.warn('PostgreSQL migration error:', error)
    }
  }
}