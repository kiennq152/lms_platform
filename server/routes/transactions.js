import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get transactions (student sees own, admin sees all)
router.get('/', authenticate, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin') {
      // Admin sees all transactions
      query = `
        SELECT 
          t.*,
          c.title as course_title,
          u.first_name || ' ' || u.last_name as student_name,
          u.email as student_email
        FROM transactions t
        LEFT JOIN courses c ON t.course_id = c.course_id
        LEFT JOIN users u ON t.student_id = u.user_id
        ORDER BY t.created_at DESC
      `;
      params = [];
    } else {
      // Student sees own transactions
      query = `
        SELECT 
          t.*,
          c.title as course_title
        FROM transactions t
        LEFT JOIN courses c ON t.course_id = c.course_id
        WHERE t.student_id = $1
        ORDER BY t.created_at DESC
      `;
      params = [req.user.user_id];
    }

    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single transaction
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        t.*,
        c.title as course_title,
        u.first_name || ' ' || u.last_name as student_name
      FROM transactions t
      LEFT JOIN courses c ON t.course_id = c.course_id
      LEFT JOIN users u ON t.student_id = u.user_id
      WHERE t.transaction_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];

    // Check ownership (student can only see own transactions)
    if (transaction.student_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ transaction: transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create transaction (usually called after payment processing)
router.post('/', authenticate, authorize('student'), async (req, res) => {
  try {
    const {
      course_id,
      amount,
      payment_method,
      payment_status,
      payment_gateway_transaction_id,
      coupon_id
    } = req.body;

    // Validate required fields
    if (!course_id || !amount || !payment_method || !payment_status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if course exists
    const courseCheck = await pool.query(
      'SELECT course_id, price FROM courses WHERE course_id = $1',
      [course_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Calculate discount if coupon is used
    let finalAmount = parseFloat(amount);
    let discountAmount = 0;

    if (coupon_id) {
      const couponCheck = await pool.query(
        `SELECT * FROM coupons 
         WHERE coupon_id = $1 
         AND is_active = TRUE 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
        [coupon_id]
      );

      if (couponCheck.rows.length > 0) {
        const coupon = couponCheck.rows[0];
        if (coupon.discount_type === 'percentage') {
          discountAmount = (finalAmount * coupon.discount_value) / 100;
        } else {
          discountAmount = coupon.discount_value;
        }
        finalAmount = Math.max(0, finalAmount - discountAmount);
      }
    }

    // Create transaction
    const result = await pool.query(
      `INSERT INTO transactions (
        student_id, course_id, amount, discount_amount, final_amount,
        payment_method, payment_status, payment_gateway_transaction_id,
        coupon_id, transaction_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        req.user.user_id,
        course_id,
        amount,
        discountAmount,
        finalAmount,
        payment_method,
        payment_status,
        payment_gateway_transaction_id || null,
        coupon_id || null
      ]
    );

    // If payment is successful, create enrollment
    if (payment_status === 'completed' || payment_status === 'success') {
      // Check if already enrolled
      const existingEnrollment = await pool.query(
        'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [req.user.user_id, course_id]
      );

      if (existingEnrollment.rows.length === 0) {
        await pool.query(
          `INSERT INTO enrollments (student_id, course_id, status, enrollment_date)
           VALUES ($1, $2, 'active', CURRENT_TIMESTAMP)`,
          [req.user.user_id, course_id]
        );
      }
    }

    res.status(201).json({ transaction: result.rows[0] });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transaction status (for payment gateway callbacks)
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_gateway_transaction_id } = req.body;

    if (!payment_status) {
      return res.status(400).json({ error: 'Payment status is required' });
    }

    const result = await pool.query(
      `UPDATE transactions 
       SET payment_status = $1, 
           payment_gateway_transaction_id = COALESCE($2, payment_gateway_transaction_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $3
       RETURNING *`,
      [payment_status, payment_gateway_transaction_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];

    // If payment becomes successful, create enrollment if not exists
    if (payment_status === 'completed' || payment_status === 'success') {
      const existingEnrollment = await pool.query(
        'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [transaction.student_id, transaction.course_id]
      );

      if (existingEnrollment.rows.length === 0) {
        await pool.query(
          `INSERT INTO enrollments (student_id, course_id, status, enrollment_date)
           VALUES ($1, $2, 'active', CURRENT_TIMESTAMP)`,
          [transaction.student_id, transaction.course_id]
        );
      }
    }

    res.json({ transaction: transaction });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get financial reports (admin only)
router.get('/reports/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { start_date, end_date, period = 'all' } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'WHERE transaction_date BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    } else if (period === 'today') {
      dateFilter = 'WHERE transaction_date >= CURRENT_DATE';
    } else if (period === 'week') {
      dateFilter = 'WHERE transaction_date >= CURRENT_DATE - INTERVAL \'7 days\'';
    } else if (period === 'month') {
      dateFilter = 'WHERE transaction_date >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (period === 'year') {
      dateFilter = 'WHERE transaction_date >= CURRENT_DATE - INTERVAL \'365 days\'';
    }

    // Total revenue
    const revenueResult = await pool.query(
      `SELECT 
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COUNT(*) as total_transactions,
        COALESCE(SUM(discount_amount), 0) as total_discounts
      FROM transactions
      ${dateFilter}
      AND payment_status IN ('completed', 'success')`,
      params
    );

    // Revenue by course
    const revenueByCourse = await pool.query(
      `SELECT 
        c.course_id,
        c.title as course_title,
        COUNT(t.transaction_id) as transaction_count,
        COALESCE(SUM(t.final_amount), 0) as revenue
      FROM transactions t
      JOIN courses c ON t.course_id = c.course_id
      ${dateFilter.replace('transaction_date', 't.transaction_date')}
      AND t.payment_status IN ('completed', 'success')
      GROUP BY c.course_id, c.title
      ORDER BY revenue DESC
      LIMIT 10`,
      params
    );

    // Revenue by instructor
    const revenueByInstructor = await pool.query(
      `SELECT 
        u.user_id,
        u.first_name || ' ' || u.last_name as instructor_name,
        COUNT(t.transaction_id) as transaction_count,
        COALESCE(SUM(t.final_amount), 0) as revenue
      FROM transactions t
      JOIN courses c ON t.course_id = c.course_id
      JOIN users u ON c.instructor_id = u.user_id
      ${dateFilter.replace('transaction_date', 't.transaction_date')}
      AND t.payment_status IN ('completed', 'success')
      GROUP BY u.user_id, u.first_name, u.last_name
      ORDER BY revenue DESC
      LIMIT 10`,
      params
    );

    res.json({
      summary: revenueResult.rows[0],
      revenueByCourse: revenueByCourse.rows,
      revenueByInstructor: revenueByInstructor.rows
    });
  } catch (error) {
    console.error('Get financial reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


