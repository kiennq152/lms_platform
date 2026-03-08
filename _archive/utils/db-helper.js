/**
 * Database Helper Utilities
 * Provides helper functions for database operations
 */

/**
 * Convert JavaScript Date to PostgreSQL timestamp
 */
export function toPostgresTimestamp(date) {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (typeof date === 'string') {
    return date;
  }
  return null;
}

/**
 * Convert data object, handling Date objects
 */
export function prepareDataForDB(data) {
  const prepared = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      prepared[key] = value.toISOString();
    } else if (value === null || value === undefined) {
      prepared[key] = null;
    } else {
      prepared[key] = value;
    }
  }
  return prepared;
}

/**
 * Verify database connection and test write
 */
export async function testDatabaseWrite(pool) {
  try {
    // Test write operation
    const testResult = await pool.query(
      'CREATE TEMP TABLE IF NOT EXISTS test_write (id SERIAL, test_data TEXT, created_at TIMESTAMP DEFAULT NOW());'
    );
    
    const insertResult = await pool.query(
      'INSERT INTO test_write (test_data) VALUES ($1) RETURNING *',
      ['test_' + Date.now()]
    );
    
    const readResult = await pool.query(
      'SELECT * FROM test_write WHERE id = $1',
      [insertResult.rows[0].id]
    );
    
    await pool.query('DROP TABLE IF EXISTS test_write');
    
    if (readResult.rows.length > 0) {
      console.log('✅ Database write test passed');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Database write test failed:', error.message);
    return false;
  }
}

