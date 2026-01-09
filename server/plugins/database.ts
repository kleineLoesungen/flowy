import { initializeDatabase } from '../db/core/DatabaseManager'

/**
 * Nitro plugin to initialize database on server startup
 * This ensures the database connection is established and migrations are run
 * before any API requests are handled
 */
export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 Starting Flowy server...')
  
  try {
    // Initialize database with automatic migration check and execution
    await initializeDatabase()
    console.log('🎉 Database initialized successfully - server is ready!')
    
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ CRITICAL: Failed to initialize database')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('')
    console.error('Error:', error.message)
    console.error('')
    console.error('Possible solutions:')
    console.error('  1. Verify PostgreSQL is running')
    console.error('  2. Check database credentials in .env file')
    console.error('  3. Ensure database exists and is accessible')
    console.error('  4. Check network connectivity to database server')
    console.error('')
    console.error('Stack trace:', error.stack)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Exit the process to prevent running with a broken database
    console.error('⚠️  Server will exit due to database initialization failure')
    process.exit(1)
  }
  
  // Clean up database connection on shutdown
  nitroApp.hooks.hook('close', async () => {
    console.log('👋 Shutting down server...')
    const { closeDatabaseConnection } = await import('../db/core/DatabaseManager')
    await closeDatabaseConnection()
  })
})
