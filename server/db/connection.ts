import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import postgres from 'postgres'
import Database from 'better-sqlite3'
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator'
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import { users, teams, flowTemplates, flows } from './schema'
import path from 'path'

// Database connection singleton
let dbInstance: any = null

export function getDatabase() {
  if (dbInstance) {
    return dbInstance
  }

  const pgConnectionString = process.env.PG_ConnectionString

  if (pgConnectionString) {
    // Use PostgreSQL
    const client = postgres(pgConnectionString)
    dbInstance = {
      db: drizzlePg(client, {
        schema: {
          users: users,
          teams: teams,
          flowTemplates: flowTemplates,
          flows: flows
        }
      }),
      client,
      type: 'pg' as const,
      schema: {
        users: users,
        teams: teams,
        flowTemplates: flowTemplates,
        flows: flows
      }
    }
  } else {
    // Use SQLite
    const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), '.data', 'flowy.db')
    
    // Ensure .data directory exists
    const fs = require('fs')
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const sqlite = new Database(dbPath)
    dbInstance = {
      db: drizzleSqlite(sqlite, {
        schema: {
          users: users,
          teams: teams,
          flowTemplates: flowTemplates,
          flows: flows
        }
      }),
      client: sqlite,
      type: 'sqlite' as const,
      schema: {
        users: users,
        teams: teams,
        flowTemplates: flowTemplates,
        flows: flows
      }
    }
  }

  return dbInstance
}

export async function initializeDatabase() {
  const { db, type } = getDatabase()

  try {
    if (type === 'pg') {
      // Run PostgreSQL migrations if needed
      await migratePg(db, { 
        migrationsFolder: path.join(process.cwd(), 'server/db/migrations/pg') 
      })
    } else {
      // Run SQLite migrations if needed
      await migrateSqlite(db, { 
        migrationsFolder: path.join(process.cwd(), 'server/db/migrations/sqlite') 
      })
    }
  } catch (error) {
    console.warn('Migration error (tables might already exist):', error)
  }

  return db
}

// Helper function to close database connections
export function closeDatabaseConnection() {
  if (dbInstance) {
    if (dbInstance.type === 'sqlite') {
      dbInstance.client.close()
    } else {
      dbInstance.client.end()
    }
    dbInstance = null
  }
}