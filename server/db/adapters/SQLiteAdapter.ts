import Database from 'better-sqlite3'
import { DatabaseAdapter, DatabaseConfig } from '../core/DatabaseAdapter'
import { promises as fs } from 'fs'
import path from 'path'

export class SQLiteAdapter implements DatabaseAdapter {
  type = 'sqlite'
  private db: Database.Database | null = null
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    const dbPath = this.config.path || this.config.connectionString || './data/flowy.db'
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath)
    try {
      await fs.mkdir(dbDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
    
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not connected')
    const stmt = this.db.prepare(sql)
    return stmt.all(...params)
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number }> {
    if (!this.db) throw new Error('Database not connected')
    const stmt = this.db.prepare(sql)
    const result = stmt.run(...params)
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid as number
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not connected')
    const stmt = this.db.prepare(sql)
    return stmt.get(...params)
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Database not connected')
    
    const transaction = this.db.transaction(async () => {
      return await callback(this)
    })
    
    return transaction()
  }

  async migrate(migrationsPath: string): Promise<void> {
    try {
      // Use drizzle migrations if available, fallback to SQL files
      const drizzleMigrationPath = path.join(migrationsPath, 'sqlite')
      
      try {
        // Try to import and run drizzle migrations
        const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
        const { drizzle } = await import('drizzle-orm/better-sqlite3')
        
        if (this.db) {
          const drizzleDb = drizzle(this.db)
          await migrate(drizzleDb, { migrationsFolder: drizzleMigrationPath })
          console.log('✅ SQLite Drizzle migrations completed')
          return
        }
      } catch (drizzleError) {
        console.warn('Drizzle migration failed, falling back to SQL files:', drizzleError)
      }
      
      // Fallback to SQL file execution
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
      console.log('✅ SQLite SQL migrations completed')
    } catch (error) {
      console.warn('SQLite migration error:', error)
    }
  }
}