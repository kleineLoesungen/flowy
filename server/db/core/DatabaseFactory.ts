import { DatabaseAdapter, DatabaseConfig } from './DatabaseAdapter'
import { PostgreSQLAdapter } from '../adapters/PostgreSQLAdapter'

export class DatabaseFactory {
  private static adapters = new Map<string, new (config: DatabaseConfig) => DatabaseAdapter>([
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
    // Prefer Nuxt runtimeConfig when available, fall back to process.env
    let runtime: any = {}
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useRuntimeConfig } = require('#imports') as any
      runtime = useRuntimeConfig() || {}
    } catch (e) {
      runtime = {}
    }

    // Check for specific database connection strings (prefer NUXT_ variant)
    const pgConnectionString = runtime.PG_ConnectionString || runtime.PG_CONNECTION_STRING || runtime.NUXT_DATABASE_URL || runtime.NUXT_DATABASEURL || process.env.NUXT_DATABASE_URL || process.env.PG_ConnectionString || process.env.PG_CONNECTION_STRING
    if (pgConnectionString) {
      return this.parseConnectionString(pgConnectionString)
    }

    // Accept multiple possible runtime keys for DATABASE_URL (NUXT_ preferred)
    const runtimeDatabaseUrl = runtime.NUXT_DATABASE_URL || runtime.NUXT_DATABASEURL || runtime.DATABASE_URL || runtime.databaseUrl
    const envDatabaseUrl = process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL
    if (runtimeDatabaseUrl || envDatabaseUrl) {
      return this.parseConnectionString(runtimeDatabaseUrl || envDatabaseUrl)
    }

    // Check for individual PostgreSQL environment variables (prefer NUXT_ variants)
    const dbHost = runtime.dbHost || runtime.NUXT_DB_HOST || process.env.NUXT_DB_HOST
    const dbPort = runtime.dbPort || runtime.NUXT_DB_PORT || process.env.NUXT_DB_PORT
    const dbName = runtime.dbName || runtime.NUXT_DB_NAME || process.env.NUXT_DB_NAME
    const dbUser = runtime.dbUser || runtime.NUXT_DB_USER || process.env.NUXT_DB_USER
    const dbPass = runtime.dbPass || runtime.NUXT_DB_PASS || process.env.NUXT_DB_PASS
    const dbSchema = runtime.dbSchema || runtime.NUXT_DB_SCHEMA || process.env.NUXT_DB_SCHEMA
    
    if (dbHost && dbName && dbUser) {
      return {
        type: 'postgres',
        host: dbHost,
        port: dbPort ? parseInt(dbPort) : 5432,
        database: dbName,
        username: dbUser,
        password: dbPass,
        schema: dbSchema,
        options: dbSchema ? { searchPath: dbSchema } : undefined
      }
    }
    
    // PostgreSQL is required
    throw new Error('PostgreSQL configuration required. Please set DB_HOST, DB_NAME, and DB_USER environment variables or provide a DATABASE_URL.')
  }
}