import { initializeDatabase } from '../db/core/DatabaseManager'

/**
 * Nitro plugin to initialize database on server startup
 * This ensures the database connection is established and migrations are run
 * before any API requests are handled
 */
export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔌 Initializing database connection...')
  
  try {
    // initializeDatabase() will connect and run migrations automatically
    await initializeDatabase()
    
    console.log('✅ Database initialized successfully')
  } catch (error: any) {
    console.error('❌ Failed to initialize database:', error.message)
    console.error('Stack trace:', error.stack)
    
    // Don't crash the server, but log the error prominently
    console.error('⚠️  Server will continue but database operations will fail!')
  }
  
  // Clean up database connection on shutdown
  nitroApp.hooks.hook('close', async () => {
    console.log('🔌 Closing database connection...')
    const { closeDatabaseConnection } = await import('../db/core/DatabaseManager')
    await closeDatabaseConnection()
    console.log('✅ Database connection closed')
  })
})
