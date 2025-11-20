import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all forum topics
router.get('/topics', async (req, res) => {
  try {
    const { course_id, search, sort = 'newest', filter } = req.query;
    
    let query = `
      SELECT 
        t.topic_id,
        t.course_id,
        t.author_id,
        t.title,
        t.content,
        t.is_pinned,
        t.is_locked,
        t.view_count,
        t.reply_count,
        t.created_at,
        t.updated_at,
        u.first_name || ' ' || u.last_name as author_name,
        u.avatar_url as author_avatar,
        c.title as course_title,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM forum_replies r 
            WHERE r.topic_id = t.topic_id AND r.is_solution = TRUE
          ) THEN TRUE
          ELSE FALSE
        END as has_solution
      FROM forum_topics t
      JOIN users u ON t.author_id = u.user_id
      LEFT JOIN courses c ON t.course_id = c.course_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (course_id) {
      query += ` AND t.course_id = $${paramCount++}`;
      params.push(course_id);
    }
    
    if (search) {
      query += ` AND (t.title ILIKE $${paramCount} OR t.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (filter === 'unanswered') {
      query += ` AND t.reply_count = 0`;
    } else if (filter === 'solved') {
      query += ` AND EXISTS (
        SELECT 1 FROM forum_replies r 
        WHERE r.topic_id = t.topic_id AND r.is_solution = TRUE
      )`;
    } else if (filter === 'my_posts') {
      // This requires authentication, handled separately
    }
    
    // Sorting
    if (sort === 'newest') {
      query += ` ORDER BY t.is_pinned DESC, t.created_at DESC`;
    } else if (sort === 'popular') {
      query += ` ORDER BY t.is_pinned DESC, t.reply_count DESC, t.view_count DESC`;
    } else if (sort === 'most_replied') {
      query += ` ORDER BY t.is_pinned DESC, t.reply_count DESC`;
    }
    
    const result = await pool.query(query, params);
    res.json({ topics: result.rows });
  } catch (error) {
    console.error('Get forum topics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my posts (requires auth)
router.get('/topics/my-posts', authenticate, async (req, res) => {
  try {
    const { sort = 'newest' } = req.query;
    
    let query = `
      SELECT 
        t.topic_id,
        t.course_id,
        t.author_id,
        t.title,
        t.content,
        t.is_pinned,
        t.is_locked,
        t.view_count,
        t.reply_count,
        t.created_at,
        t.updated_at,
        u.first_name || ' ' || u.last_name as author_name,
        u.avatar_url as author_avatar,
        c.title as course_title,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM forum_replies r 
            WHERE r.topic_id = t.topic_id AND r.is_solution = TRUE
          ) THEN TRUE
          ELSE FALSE
        END as has_solution
      FROM forum_topics t
      JOIN users u ON t.author_id = u.user_id
      LEFT JOIN courses c ON t.course_id = c.course_id
      WHERE t.author_id = $1
    `;
    
    if (sort === 'newest') {
      query += ` ORDER BY t.created_at DESC`;
    } else if (sort === 'popular') {
      query += ` ORDER BY t.reply_count DESC, t.view_count DESC`;
    }
    
    const result = await pool.query(query, [req.user.user_id]);
    res.json({ topics: result.rows });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single topic with replies
router.get('/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get topic
    const topicResult = await pool.query(
      `SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.avatar_url as author_avatar,
        c.title as course_title
      FROM forum_topics t
      JOIN users u ON t.author_id = u.user_id
      LEFT JOIN courses c ON t.course_id = c.course_id
      WHERE t.topic_id = $1`,
      [id]
    );
    
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Increment view count
    await pool.query(
      `UPDATE forum_topics SET view_count = view_count + 1 WHERE topic_id = $1`,
      [id]
    );
    
    // Get replies
    const repliesResult = await pool.query(
      `SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.avatar_url as author_avatar
      FROM forum_replies r
      JOIN users u ON r.author_id = u.user_id
      WHERE r.topic_id = $1
      ORDER BY r.is_solution DESC, r.created_at ASC`,
      [id]
    );
    
    res.json({
      topic: topicResult.rows[0],
      replies: repliesResult.rows
    });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new topic
router.post('/topics', authenticate, async (req, res) => {
  try {
    const { course_id, title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO forum_topics (course_id, author_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [course_id || null, req.user.user_id, title, content]
    );
    
    res.status(201).json({ topic: result.rows[0] });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create reply
router.post('/topics/:id/replies', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Check if topic exists
    const topicCheck = await pool.query(
      'SELECT topic_id, is_locked FROM forum_topics WHERE topic_id = $1',
      [id]
    );
    
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    if (topicCheck.rows[0].is_locked) {
      return res.status(403).json({ error: 'Topic is locked' });
    }
    
    // Create reply
    const replyResult = await pool.query(
      `INSERT INTO forum_replies (topic_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.user_id, content]
    );
    
    // Update reply count
    await pool.query(
      `UPDATE forum_topics 
       SET reply_count = reply_count + 1, 
           updated_at = CURRENT_TIMESTAMP
       WHERE topic_id = $1`,
      [id]
    );
    
    // Get reply with author info
    const replyWithAuthor = await pool.query(
      `SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.avatar_url as author_avatar
      FROM forum_replies r
      JOIN users u ON r.author_id = u.user_id
      WHERE r.reply_id = $1`,
      [replyResult.rows[0].reply_id]
    );
    
    res.status(201).json({ reply: replyWithAuthor.rows[0] });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark reply as solution
router.post('/replies/:id/solution', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get reply and check if user is topic author
    const replyCheck = await pool.query(
      `SELECT r.reply_id, t.author_id as topic_author_id
       FROM forum_replies r
       JOIN forum_topics t ON r.topic_id = t.topic_id
       WHERE r.reply_id = $1`,
      [id]
    );
    
    if (replyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Only topic author can mark solution
    if (replyCheck.rows[0].topic_author_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Only topic author can mark solution' });
    }
    
    // Unmark other solutions first
    await pool.query(
      `UPDATE forum_replies 
       SET is_solution = FALSE 
       WHERE topic_id = (
         SELECT topic_id FROM forum_replies WHERE reply_id = $1
       )`,
      [id]
    );
    
    // Mark this reply as solution
    const result = await pool.query(
      `UPDATE forum_replies 
       SET is_solution = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE reply_id = $1
       RETURNING *`,
      [id]
    );
    
    res.json({ reply: result.rows[0] });
  } catch (error) {
    console.error('Mark solution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


