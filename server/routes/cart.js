import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/', authenticate, async (req, res) => {
  try {
    // For now, we'll use a simple JSONB column in users table or create a cart_items table
    // Using a simple approach: store cart in user preferences or create cart_items table
    const result = await pool.query(
      `SELECT cart_items FROM user_preferences WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      // Initialize cart
      await pool.query(
        `INSERT INTO user_preferences (user_id, cart_items) VALUES ($1, '[]'::jsonb)`,
        [req.user.user_id]
      );
      return res.json({ cart: [] });
    }

    const cartItems = result.rows[0].cart_items || [];
    res.json({ cart: cartItems });
  } catch (error) {
    console.error('Get cart error:', error);
    // If table doesn't exist, return empty cart
    res.json({ cart: [] });
  }
});

// Add item to cart
router.post('/', authenticate, async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course exists
    const courseCheck = await pool.query(
      'SELECT course_id, title, price, thumbnail_url FROM courses WHERE course_id = $1',
      [course_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseCheck.rows[0];

    // Get current cart
    let result = await pool.query(
      `SELECT cart_items FROM user_preferences WHERE user_id = $1`,
      [req.user.user_id]
    );

    let cartItems = [];
    if (result.rows.length === 0) {
      // Create user preferences
      await pool.query(
        `INSERT INTO user_preferences (user_id, cart_items) VALUES ($1, '[]'::jsonb)`,
        [req.user.user_id]
      );
    } else {
      cartItems = result.rows[0].cart_items || [];
    }

    // Check if already in cart (ensure type consistency)
    const courseIdInt = parseInt(course_id);
    if (cartItems.some(item => parseInt(item.course_id) === courseIdInt)) {
      return res.status(400).json({ error: 'Course already in cart' });
    }

    // Add to cart
    cartItems.push({
      course_id: course.course_id,
      title: course.title,
      price: parseFloat(course.price),
      thumbnail_url: course.thumbnail_url,
      added_at: new Date().toISOString()
    });

    // PostgreSQL pg library handles JSON serialization automatically
    await pool.query(
      `UPDATE user_preferences SET cart_items = $1::jsonb WHERE user_id = $2`,
      [cartItems, req.user.user_id]
    );

    res.json({ cart: cartItems });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT cart_items FROM user_preferences WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.json({ cart: [] });
    }

    let cartItems = result.rows[0].cart_items || [];
    const courseIdInt = parseInt(courseId);
    cartItems = cartItems.filter(item => parseInt(item.course_id) !== courseIdInt);

    // PostgreSQL pg library handles JSON serialization automatically
    await pool.query(
      `UPDATE user_preferences SET cart_items = $1::jsonb WHERE user_id = $2`,
      [cartItems, req.user.user_id]
    );

    res.json({ cart: cartItems });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear cart
router.delete('/', authenticate, async (req, res) => {
  try {
    // Check if user_preferences exists, if not create it
    const checkResult = await pool.query(
      `SELECT user_id FROM user_preferences WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (checkResult.rows.length === 0) {
      // Create user preferences if doesn't exist
      await pool.query(
        `INSERT INTO user_preferences (user_id, cart_items) VALUES ($1, '[]'::jsonb)`,
        [req.user.user_id]
      );
    } else {
      // Update existing cart
      await pool.query(
        `UPDATE user_preferences SET cart_items = '[]'::jsonb WHERE user_id = $1`,
        [req.user.user_id]
      );
    }

    res.json({ cart: [] });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

