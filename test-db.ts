import { DatabaseFactory } from './server/db/core/DatabaseFactory'

async function testDatabaseConnection() {
  console.log('Testing database connection...\n')
  
  try {
    const config = DatabaseFactory.createFromEnv()
    console.log('Database Config:', {
      type: config.type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      schema: config.schema,
      password: config.password ? '***' : undefined
    })
    
    const adapter = DatabaseFactory.createAdapter(config)
    console.log('\nConnecting to database...')
    await adapter.connect()
    console.log('✅ Connected successfully!')
    
    // Test a simple query
    console.log('\nTesting query...')
    const result = await adapter.query('SELECT current_database(), current_schema()')
    console.log('Query result:', result)
    
    await adapter.disconnect()
    console.log('\n✅ Database test completed successfully!')
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message)
    console.error('Error details:', error)
    process.exit(1)
  }
}

testDatabaseConnection()
