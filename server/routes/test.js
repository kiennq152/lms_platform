import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Test database connection
router.get('/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    res.json({
      status: 'connected',
      database: {
        time: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(',')[0]
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: error.message
    });
  }
});

// Test API endpoint
router.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working',
    timestamp: Date.now()
  });
});

export default router;


