import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get system logs (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { level, type, start_date, end_date, search, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT 
        log_id,
        level,
        type,
        message,
        user_id,
        ip_address,
        user_agent,
        created_at
      FROM system_logs
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (level) {
      query += ` AND level = $${paramCount++}`;
      params.push(level);
    }

    if (type) {
      query += ` AND type = $${paramCount++}`;
      params.push(type);
    }

    if (start_date) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(end_date);
    }

    if (search) {
      query += ` AND message ILIKE $${paramCount++}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '');
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total) || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create system log (internal use, can be called by any authenticated user for their actions)
router.post('/', authenticate, async (req, res) => {
  try {
    const { level = 'info', type, message, metadata } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await pool.query(
      `INSERT INTO system_logs (
        level, type, message, user_id, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        level,
        type || 'user_action',
        message,
        req.user.user_id,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    res.status(201).json({ log: result.rows[0] });
  } catch (error) {
    console.error('Create system log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete old logs (admin only)
router.delete('/cleanup', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const result = await pool.query(
      `DELETE FROM system_logs 
       WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${parseInt(days)} days'
       RETURNING log_id`,
      []
    );

    res.json({ 
      message: `Deleted ${result.rows.length} log entries older than ${days} days`,
      deletedCount: result.rows.length
    });
  } catch (error) {
    console.error('Cleanup system logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


