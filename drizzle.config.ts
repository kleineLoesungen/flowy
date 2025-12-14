import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.NUXT_DB_HOST || 'localhost',
    port: parseInt(process.env.NUXT_DB_PORT || '5432'),
    database: process.env.NUXT_DB_NAME || 'flowy',
    user: process.env.NUXT_DB_USER || 'postgres',
    password: process.env.NUXT_DB_PASS || '',
    ssl: false,
  },
  verbose: true,
  strict: true,
})