import { Pool, PoolClient } from 'pg'
import { DatabaseAdapter, DatabaseConfig } from '../core/DatabaseAdapter'
import { promises as fs } from 'fs'
import path from 'path'
import { postgresMigrations } from '../migrations/embeddedMigrations'

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
      
      // Create migrations tracking table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS drizzle_migrations (
          id SERIAL PRIMARY KEY,
          migration_name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `)
      
      console.log('🔍 Checking for pending database migrations...')
      
      // Get list of executed migrations
      const executedResult = await client.query(
        'SELECT migration_name FROM drizzle_migrations ORDER BY id'
      )
      const executedMigrations = new Set(executedResult.rows.map((row: any) => row.migration_name))
      
      // Try to load migrations from filesystem first, fall back to embedded migrations
      let migrations: Array<{name: string; sql: string}> = []
      
      try {
        const files = await fs.readdir(migrationsPath)
        const sqlFiles = files.filter(file => file.endsWith('.sql')).sort()
        
        // Load migrations from files
        for (const file of sqlFiles) {
          const filePath = path.join(migrationsPath, file)
          const sql = await fs.readFile(filePath, 'utf-8')
          migrations.push({ name: file, sql })
        }
        console.log('📁 Loaded migrations from filesystem')
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log('💡 Migration directory not found, using embedded migrations')
          migrations = postgresMigrations
        } else {
          throw error
        }
      }
      
      // Find pending migrations
      const pendingMigrations = migrations.filter(m => !executedMigrations.has(m.name))
      
      if (pendingMigrations.length === 0) {
        console.log('✅ Database schema is up to date (no pending migrations)')
        return
      }
      
      console.log(`📦 Found ${pendingMigrations.length} pending migration(s):`)
      pendingMigrations.forEach(m => console.log(`   - ${m.name}`))
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        console.log(`🔄 Running migration: ${migration.name}`)
        
        try {
          // Begin transaction for this migration
          await client.query('BEGIN')
          
          // Split by semicolon and execute each statement
          const statements = migration.sql.split(';').filter(stmt => stmt.trim())
          for (const statement of statements) {
            if (statement.trim()) {
              await client.query(statement.trim())
            }
          }
          
          // Record migration as executed
          await client.query(
            'INSERT INTO drizzle_migrations (migration_name) VALUES ($1)',
            [migration.name]
          )
          
          await client.query('COMMIT')
          console.log(`   ✅ Migration ${migration.name} completed successfully`)
        } catch (error: any) {
          await client.query('ROLLBACK')
          console.error(`   ❌ Migration ${migration.name} failed:`, error.message)
          throw new Error(`Migration ${migration.name} failed: ${error.message}`)
        }
      }
      
      console.log('✅ All migrations completed successfully')
    } catch (error: any) {
      console.error('❌ PostgreSQL migration error:', error.message)
      throw error
    } finally {
      client.release()
    }
  }
}