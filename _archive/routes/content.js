import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get content library (instructor only)
router.get('/', authenticate, authorize('instructor'), async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT 
        cl.*,
        c.title as course_title
      FROM content_library cl
      LEFT JOIN courses c ON cl.course_id = c.course_id
      WHERE cl.instructor_id = $1
    `;
    
    const params = [req.user.user_id];
    
    if (type) {
      query += ` AND cl.content_type = $2`;
      params.push(type);
    }
    
    query += ` ORDER BY cl.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ content: result.rows });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add content to library
router.post('/', authenticate, authorize('instructor'), async (req, res) => {
  try {
    const { title, content_type, content_data, course_id } = req.body;

    const result = await pool.query(
      `INSERT INTO content_library (instructor_id, title, content_type, content_data, course_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.user_id, title, content_type, JSON.stringify(content_data), course_id || null]
    );

    res.status(201).json({ content: result.rows[0] });
  } catch (error) {
    console.error('Add content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete content
router.delete('/:id', authenticate, authorize('instructor'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const contentCheck = await pool.query(
      'SELECT content_id FROM content_library WHERE content_id = $1 AND instructor_id = $2',
      [id, req.user.user_id]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    await pool.query('DELETE FROM content_library WHERE content_id = $1', [id]);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


