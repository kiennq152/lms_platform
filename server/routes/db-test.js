/**
 * Database Test Route
 * Endpoint to test database read/write operations
 */
import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Test database write (admin only)
router.post('/test-write', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create test table
    await client.query(`
      CREATE TEMP TABLE IF NOT EXISTS db_write_test (
        id SERIAL PRIMARY KEY,
        test_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Insert test data
    const insertResult = await client.query(
      'INSERT INTO db_write_test (test_data) VALUES ($1) RETURNING *',
      ['test_' + Date.now()]
    );
    
    // Read back the data
    const readResult = await client.query(
      'SELECT * FROM db_write_test WHERE id = $1',
      [insertResult.rows[0].id]
    );
    
    await client.query('COMMIT');
    
    if (readResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Database write test passed',
        inserted: insertResult.rows[0],
        read: readResult.rows[0],
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Database write test failed - data not found after insert',
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database write test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  } finally {
    client.release();
  }
});

// Check database connection
router.get('/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    return res.json({
      connected: true,
      currentTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1],
      database: process.env.DB_NAME || 'lms_db',
      host: process.env.DB_HOST || 'localhost',
    });
  } catch (error) {
    return res.status(500).json({
      connected: false,
      error: error.message,
    });
  }
});

export default router;

