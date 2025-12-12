import { Pool, PoolClient } from 'pg'
import { DatabaseAdapter, DatabaseConfig } from '../core/DatabaseAdapter'
import { promises as fs } from 'fs'
import path from 'path'

export class PostgreSQLAdapter implements DatabaseAdapter {
  type = 'postgres'
  private pool: Pool | null = null
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    const poolConfig: any = {
      connectionString: this.config.connectionString,
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      // Connection pool settings
      max: 20, // maximum pool size
      idleTimeoutMillis: 30000, // close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // return an error after 10 seconds if connection cannot be established
      ...this.config.options
    }
    
    // Set search_path if schema is specified
    if (this.config.schema) {
      poolConfig.options = `-c search_path=${this.config.schema},public`
    }
    
    this.pool = new Pool(poolConfig)
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err)
    })
    
    // Test connection
    const client = await this.pool.connect()
    try {
      await client.query('SELECT 1')
    } finally {
      client.release()
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.pool) throw new Error('Database not connected')
    const result = await this.pool.query(sql, params)
    return result.rows
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number }> {
    if (!this.pool) throw new Error('Database not connected')
    const result = await this.pool.query(sql, params)
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: undefined // PostgreSQL doesn't have this concept
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) throw new Error('Database not connected')
    const result = await this.pool.query(sql, params)
    return result.rows[0] || null
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    if (!this.pool) throw new Error('Database not connected')
    
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(this)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async migrate(migrationsPath: string): Promise<void> {
    if (!this.pool) throw new Error('Database not connected')
    
    // Use a single client for the entire migration to maintain search_path
    const client = await this.pool.connect()
    
    try {
      // Create schema if it doesn't exist
      if (this.config.schema) {
        try {
          await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.config.schema}`)
          await client.query(`SET search_path TO ${this.config.schema}`)
        } catch (schemaError: any) {
          console.warn(`Warning creating schema:`, schemaError.message)
        }
      }
      
      // Execute SQL migration files
      const files = await fs.readdir(migrationsPath)
      const sqlFiles = files.filter(file => file.endsWith('.sql')).sort()
      
      for (const file of sqlFiles) {
        const filePath = path.join(migrationsPath, file)
        const sql = await fs.readFile(filePath, 'utf-8')
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim())
        for (const statement of statements) {
          if (statement.trim()) {
            await client.query(statement.trim())
          }
        }
      }
    } catch (error: any) {
      console.error('PostgreSQL migration error:', error)
      throw error
    } finally {
      client.release()
    }
  }
}