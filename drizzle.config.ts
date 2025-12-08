import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flowy',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    ssl: false,
  },
  verbose: true,
  strict: true,
})