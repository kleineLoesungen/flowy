export interface DatabaseAdapter {
  type: string
  connect(): Promise<void>
  disconnect(): Promise<void>
  query(sql: string, params?: any[]): Promise<any[]>
  run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number }>
  get(sql: string, params?: any[]): Promise<any>
  transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T>
  migrate(migrationsPath: string): Promise<void>
}

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres'
  connectionString?: string
  path?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  options?: Record<string, any>
}

export interface SchemaBuilder {
  createTable(name: string, callback: (table: TableBuilder) => void): string
  dropTable(name: string): string
  alterTable(name: string, callback: (table: TableBuilder) => void): string
}

export interface TableBuilder {
  primaryKey(column: string): TableBuilder
  text(column: string): ColumnBuilder
  integer(column: string): ColumnBuilder
  boolean(column: string): ColumnBuilder
  timestamp(column: string): ColumnBuilder
  json(column: string): ColumnBuilder
  foreignKey(column: string, references: { table: string; column: string }): TableBuilder
}

export interface ColumnBuilder {
  notNull(): ColumnBuilder
  default(value: any): ColumnBuilder
  unique(): ColumnBuilder
}