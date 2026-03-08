import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only) - exclude admin and guest accounts
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, status, search } = req.query;
    
    let query = `
      SELECT 
        user_id, email, first_name, last_name, role, status,
        avatar_url, phone, bio, email_verified, admin_approved,
        created_at, last_login
      FROM users
      WHERE email NOT IN ('admin', 'guest')
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (role) {
      query += ` AND role = $${paramCount++}`;
      params.push(role);
    }
    
    if (status) {
      query += ` AND status = $${paramCount++}`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve user (admin only) - works for all user types
router.post('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users 
       SET admin_approved = TRUE, 
           admin_approved_at = CURRENT_TIMESTAMP,
           approved_by = $1
       WHERE user_id = $2
       RETURNING *`,
      [req.user.user_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject user (admin only) - sets admin_approved to false
router.post('/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET admin_approved = FALSE, 
           admin_approved_at = NULL,
           approved_by = NULL
       WHERE user_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // TODO: Optionally log rejection reason to system_logs table
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status (admin only)
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        user_id, email, first_name, last_name, role, status,
        avatar_url, phone, bio, social_link, email_verified, 
        admin_approved, created_at, last_login
      FROM users
      WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { first_name, last_name, phone, bio, social_link, avatar_url } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(phone);
    }

    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (social_link !== undefined) {
      updateFields.push(`social_link = $${paramCount++}`);
      values.push(social_link);
    }

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.user_id);

    const result = await pool.query(
      `UPDATE users 
       SET ${updateFields.join(', ')}
       WHERE user_id = $${paramCount}
       RETURNING user_id, email, first_name, last_name, role, status,
                 avatar_url, phone, bio, social_link, email_verified, 
                 admin_approved, created_at, last_login`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only) - soft delete by setting status to 'inactive'
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting admin and guest accounts
    const userCheck = await pool.query(
      'SELECT email, role FROM users WHERE user_id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.rows[0].email === 'admin' || userCheck.rows[0].email === 'guest') {
      return res.status(400).json({ error: 'Cannot delete admin or guest accounts' });
    }

    // Soft delete: set status to inactive instead of actually deleting
    // This preserves data integrity for enrollments, courses, etc.
    const result = await pool.query(
      `UPDATE users 
       SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING user_id, email, first_name, last_name, role, status`,
      [id]
    );

    res.json({ 
      message: 'User deleted successfully (status set to inactive)',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

