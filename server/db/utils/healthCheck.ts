import { DatabaseAdapter } from '../core/DatabaseAdapter'

export interface DatabaseHealthCheck {
  connected: boolean
  tablesExist: boolean
  missingTables: string[]
  error?: string
}

/**
 * Verifies database connectivity and checks if required tables exist
 */
export async function checkDatabaseHealth(adapter: DatabaseAdapter): Promise<DatabaseHealthCheck> {
  const requiredTables = ['users', 'teams', 'flow_templates', 'flows']
  const missingTables: string[] = []
  
  try {
    // Test basic connectivity
    await adapter.query('SELECT 1')
    
    // Check if each required table exists using a schema-agnostic query
    // This checks in the current search_path, which respects the configured schema
    for (const table of requiredTables) {
      try {
        const result = await adapter.query(`
          SELECT to_regclass($1) as table_exists
        `, [table])
        
        // If to_regclass returns NULL, the table doesn't exist in the current search path
        if (!result[0]?.table_exists) {
          missingTables.push(table)
        }
      } catch (error) {
        // If query fails, assume table doesn't exist
        missingTables.push(table)
      }
    }
    
    return {
      connected: true,
      tablesExist: missingTables.length === 0,
      missingTables
    }
  } catch (error: any) {
    return {
      connected: false,
      tablesExist: false,
      missingTables: requiredTables,
      error: error.message
    }
  }
}

/**
 * Validates that the database is properly configured
 */
export async function validateDatabaseSetup(adapter: DatabaseAdapter): Promise<void> {
  const health = await checkDatabaseHealth(adapter)
  
  if (!health.connected) {
    throw new Error(`Database connection failed: ${health.error}`)
  }
  
  if (!health.tablesExist) {
    throw new Error(
      `Database schema incomplete. Missing tables: ${health.missingTables.join(', ')}. ` +
      'Please ensure migrations have been run.'
    )
  }
}
