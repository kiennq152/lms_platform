import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all settings (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM settings ORDER BY setting_key'
    );

    // Convert to key-value object
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single setting (public for some settings, admin for others)
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // Public settings (no auth required)
    const publicSettings = ['site_name', 'site_email', 'maintenance_mode'];

    if (!publicSettings.includes(key) && !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query(
      'SELECT * FROM settings WHERE setting_key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ setting: result.rows[0] });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update setting (admin only)
router.put('/:key', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Check if setting exists
    const existing = await pool.query(
      'SELECT setting_key FROM settings WHERE setting_key = $1',
      [key]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE settings 
         SET setting_value = $1, 
             description = COALESCE($2, description),
             updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = $3
         RETURNING *`,
        [value, description, key]
      );
    } else {
      // Create new
      result = await pool.query(
        `INSERT INTO settings (setting_key, setting_value, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [key, value, description || null]
      );
    }

    res.json({ setting: result.rows[0] });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update settings (admin only)
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const updated = [];
    for (const [key, value] of Object.entries(settings)) {
      const existing = await pool.query(
        'SELECT setting_key FROM settings WHERE setting_key = $1',
        [key]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE settings 
           SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = $2`,
          [value, key]
        );
      } else {
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value)
           VALUES ($1, $2)`,
          [key, value]
        );
      }
      updated.push(key);
    }

    res.json({ 
      message: `Updated ${updated.length} settings`,
      updated: updated
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


