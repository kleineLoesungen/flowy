import { DatabaseAdapter } from './DatabaseAdapter'
import { DatabaseFactory } from './DatabaseFactory'
import { checkDatabaseHealth } from '../utils/healthCheck'
import path from 'path'

export class DatabaseManager {
  private static instance: DatabaseManager | null = null
  private adapter: DatabaseAdapter | null = null
  private connected = false
  private maxRetries = 3
  private retryDelayMs = 2000

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!this.instance) {
      this.instance = new DatabaseManager()
    }
    return this.instance
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async initialize(): Promise<void> {
    if (this.connected) return

    console.log('🔌 Initializing database connection...')
    
    const config = DatabaseFactory.createFromEnv()
    this.adapter = DatabaseFactory.createAdapter(config)
    
    // Retry connection with exponential backoff
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.adapter.connect()
        console.log('✅ Database connection established')
        this.connected = true
        break
      } catch (error: any) {
        lastError = error
        console.error(`❌ Database connection attempt ${attempt}/${this.maxRetries} failed:`, error.message)
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * attempt
          console.log(`⏳ Retrying in ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }
    
    if (!this.connected || !this.adapter) {
      throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${lastError?.message}`)
    }

    // Run migrations
    try {
      console.log('🔄 Running database migrations...')
      const migrationsPath = path.join(process.cwd(), 'server/db/migrations', config.type)
      await this.adapter.migrate(migrationsPath)
    } catch (error: any) {
      console.error('❌ Migration failed:', error.message)
      throw new Error(`Database migration failed: ${error.message}`)
    }
    
    // Verify database health
    try {
      console.log('🩺 Verifying database health...')
      const health = await checkDatabaseHealth(this.adapter)
      
      if (!health.connected) {
        throw new Error(`Database health check failed: ${health.error}`)
      }
      
      if (!health.tablesExist) {
        console.warn('⚠️  Some tables are missing:', health.missingTables.join(', '))
        throw new Error(`Database schema incomplete. Missing tables: ${health.missingTables.join(', ')}`)
      }
      
      console.log('✅ Database is healthy and ready')
    } catch (error: any) {
      console.error('❌ Database health check failed:', error.message)
      throw error
    }
  }

  getAdapter(): DatabaseAdapter {
    if (!this.adapter || !this.connected) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
    return this.adapter
  }

  async close(): Promise<void> {
    if (this.adapter) {
      console.log('🔌 Closing database connection...')
      await this.adapter.disconnect()
      this.adapter = null
      this.connected = false
      console.log('✅ Database connection closed')
    }
  }
}

// Convenience functions for backward compatibility
export async function getDatabase(): Promise<DatabaseAdapter> {
  const manager = DatabaseManager.getInstance()
  await manager.initialize()
  return manager.getAdapter()
}

export async function initializeDatabase(): Promise<DatabaseAdapter> {
  return await getDatabase()
}

export async function closeDatabaseConnection(): Promise<void> {
  const manager = DatabaseManager.getInstance()
  await manager.close()
}