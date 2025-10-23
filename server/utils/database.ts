import Database from 'better-sqlite3'
import { Client } from 'pg'

interface DatabaseConnection {
  type: 'sqlite' | 'postgres'
  query: (sql: string, params?: any[]) => Promise<any[]>
  run: (sql: string, params?: any[]) => Promise<{ changes: number; lastInsertRowid?: number }>
  get: (sql: string, params?: any[]) => Promise<any>
  close: () => Promise<void>
}

class SQLiteConnection implements DatabaseConnection {
  type: 'sqlite' = 'sqlite'
  private db: Database.Database

  constructor(path?: string) {
    const dbPath = path || process.cwd() + '/data/flowy.db'
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const stmt = this.db.prepare(sql)
    return stmt.all(...params)
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number }> {
    const stmt = this.db.prepare(sql)
    const result = stmt.run(...params)
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid as number
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const stmt = this.db.prepare(sql)
    return stmt.get(...params)
  }

  async close(): Promise<void> {
    this.db.close()
  }
}

class PostgreSQLConnection implements DatabaseConnection {
  type: 'postgres' = 'postgres'
  private client: Client

  constructor(connectionString: string) {
    this.client = new Client({ connectionString })
  }

  async connect(): Promise<void> {
    await this.client.connect()
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.client.query(sql, params)
    return result.rows
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number }> {
    const result = await this.client.query(sql, params)
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: undefined // PostgreSQL doesn't have this concept
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const result = await this.client.query(sql, params)
    return result.rows[0] || null
  }

  async close(): Promise<void> {
    await this.client.end()
  }
}

let dbInstance: DatabaseConnection | null = null

export async function getDatabase(): Promise<DatabaseConnection> {
  if (dbInstance) {
    return dbInstance
  }

  try {
    const pgConnectionString = process.env.PG_CONNECTION_STRING

    if (pgConnectionString) {
      console.log('Using PostgreSQL database')
      const pgConnection = new PostgreSQLConnection(pgConnectionString)
      await pgConnection.connect()
      dbInstance = pgConnection
    } else {
      console.log('Using SQLite database')
      dbInstance = new SQLiteConnection()
    }

    // Initialize database schema
    await initializeSchema(dbInstance)
    
    return dbInstance
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

async function initializeSchema(db: DatabaseConnection): Promise<void> {
  const tables = {
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT DEFAULT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `,
    teams: `
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_ids TEXT, -- JSON array of user IDs
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `,
    flow_templates: `
      CREATE TABLE IF NOT EXISTS flow_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        elements TEXT, -- JSON array of elements
        relations TEXT, -- JSON array of relations
        starting_element_id TEXT,
        layout TEXT, -- JSON object for element positions
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `,
    flows: `
      CREATE TABLE IF NOT EXISTS flows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        template_id TEXT,
        elements TEXT, -- JSON array of elements
        relations TEXT, -- JSON array of relations
        starting_element_id TEXT NOT NULL,
        started_at TEXT,
        expected_end_date TEXT,
        completed_at TEXT,
        hidden BOOLEAN DEFAULT 0,
        layout TEXT, -- JSON object for element positions
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `
  }

  // Adjust for PostgreSQL syntax
  if (db.type === 'postgres') {
    Object.keys(tables).forEach(key => {
      tables[key as keyof typeof tables] = tables[key as keyof typeof tables]
        .replace(/TEXT PRIMARY KEY/g, 'TEXT PRIMARY KEY')
        .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP')
        .replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE')
    })
  }

  // Create tables
  for (const [tableName, sql] of Object.entries(tables)) {
    try {
      await db.run(sql)
      console.log(`✓ Table '${tableName}' ready`)
    } catch (error) {
      console.error(`Failed to create table '${tableName}':`, error)
      throw error
    }
  }
}

export { DatabaseConnection }