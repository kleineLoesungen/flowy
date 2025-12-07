import { DatabaseAdapter } from './DatabaseAdapter'
import { DatabaseFactory } from './DatabaseFactory'
import path from 'path'

export class DatabaseManager {
  private static instance: DatabaseManager | null = null
  private adapter: DatabaseAdapter | null = null
  private connected = false

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!this.instance) {
      this.instance = new DatabaseManager()
    }
    return this.instance
  }

  async initialize(): Promise<void> {
    if (this.connected) return

    const config = DatabaseFactory.createFromEnv()
    this.adapter = DatabaseFactory.createAdapter(config)
    
    await this.adapter.connect()
    this.connected = true

    // Run migrations
    const migrationsPath = path.join(process.cwd(), 'server/db/migrations', config.type)
    await this.adapter.migrate(migrationsPath)
  }

  getAdapter(): DatabaseAdapter {
    if (!this.adapter || !this.connected) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
    return this.adapter
  }

  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.disconnect()
      this.adapter = null
      this.connected = false
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