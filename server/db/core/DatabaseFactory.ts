import { DatabaseAdapter, DatabaseConfig } from './DatabaseAdapter'
import { SQLiteAdapter } from '../adapters/SQLiteAdapter'
import { PostgreSQLAdapter } from '../adapters/PostgreSQLAdapter'

export class DatabaseFactory {
  private static adapters = new Map<string, new (config: DatabaseConfig) => DatabaseAdapter>([
    ['sqlite', SQLiteAdapter],
    ['postgres', PostgreSQLAdapter],
    ['postgresql', PostgreSQLAdapter], // Alias for postgres
  ])

  static registerAdapter(type: string, adapterClass: new (config: DatabaseConfig) => DatabaseAdapter): void {
    this.adapters.set(type, adapterClass)
  }

  static createAdapter(config: DatabaseConfig): DatabaseAdapter {
    const AdapterClass = this.adapters.get(config.type)
    if (!AdapterClass) {
      throw new Error(`Unsupported database type: ${config.type}`)
    }
    return new AdapterClass(config)
  }

  static parseConnectionString(connectionString: string): DatabaseConfig {
    const url = new URL(connectionString)
    
    let type = url.protocol.slice(0, -1) as any
    // Handle postgresql:// protocol
    if (type === 'postgresql') {
      type = 'postgres'
    }
    
    return {
      type,
      host: url.hostname,
      port: url.port ? parseInt(url.port) : undefined,
      database: url.pathname.slice(1),
      username: url.username,
      password: url.password,
      connectionString
    }
  }

  static createFromEnv(): DatabaseConfig {
    // Check for specific database connection strings
    const pgConnectionString = process.env.PG_ConnectionString || process.env.PG_CONNECTION_STRING
    if (pgConnectionString) {
      return this.parseConnectionString(pgConnectionString)
    }
    
    if (process.env.DATABASE_URL) {
      return this.parseConnectionString(process.env.DATABASE_URL)
    }
    
    // Default to SQLite
    return {
      type: 'sqlite',
      path: process.env.SQLITE_DB_PATH || './data/flowy.db'
    }
  }
}