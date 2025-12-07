// Main database exports for Flowy
export { DatabaseAdapter, DatabaseConfig } from './core/DatabaseAdapter'
export { DatabaseFactory } from './core/DatabaseFactory'
export { DatabaseManager, getDatabase, initializeDatabase, closeDatabaseConnection } from './core/DatabaseManager'
export { SQLiteAdapter } from './adapters/SQLiteAdapter'
export { PostgreSQLAdapter } from './adapters/PostgreSQLAdapter'