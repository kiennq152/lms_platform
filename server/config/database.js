import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased timeout
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${process.env.DB_NAME || 'lms_db'}`);
    
    // Test write operation
    try {
      const testWrite = await client.query(
        'CREATE TEMP TABLE IF NOT EXISTS db_test (id SERIAL, test_data TEXT, created_at TIMESTAMP DEFAULT NOW());'
      );
      const insertTest = await client.query(
        'INSERT INTO db_test (test_data) VALUES ($1) RETURNING *',
        ['connection_test_' + Date.now()]
      );
      const readTest = await client.query(
        'SELECT * FROM db_test WHERE id = $1',
        [insertTest.rows[0].id]
      );
      await client.query('DROP TABLE IF EXISTS db_test');
      
      if (readTest.rows.length > 0) {
        console.log('✅ Database write test passed - data can be saved');
      } else {
        console.warn('⚠️  Database write test failed - data may not be saved');
      }
    } catch (writeError) {
      console.warn('⚠️  Database write test error:', writeError.message);
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Make sure PostgreSQL is running and .env file is configured correctly');
    console.error('💡 Check database credentials in server/.env');
  }
}

// Test connection
pool.on('connect', () => {
  console.log('✅ New database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
  console.error('💡 Check if PostgreSQL is running and credentials are correct');
});

// Test connection on module load
testConnection();

export default pool;

