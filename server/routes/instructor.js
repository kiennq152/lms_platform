import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get instructor dashboard stats
router.get('/dashboard/stats', authenticate, authorize('instructor'), async (req, res) => {
  try {
    const instructorId = req.user.user_id;

    // Total revenue
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(c.price), 0) as total_revenue
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       WHERE c.instructor_id = $1`,
      [instructorId]
    );

    // Total enrollments
    const enrollmentsResult = await pool.query(
      `SELECT COUNT(*) as total_enrollments
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       WHERE c.instructor_id = $1`,
      [instructorId]
    );

    // Active courses
    const coursesResult = await pool.query(
      `SELECT COUNT(*) as active_courses
       FROM courses
       WHERE instructor_id = $1 AND status = 'published'`,
      [instructorId]
    );

    // Monthly revenue (last 30 days)
    const monthlyRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(c.price), 0) as monthly_revenue
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       WHERE c.instructor_id = $1 
       AND e.enrollment_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [instructorId]
    );

    res.json({
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
      totalEnrollments: parseInt(enrollmentsResult.rows[0].total_enrollments),
      activeCourses: parseInt(coursesResult.rows[0].active_courses),
      monthlyRevenue: parseFloat(monthlyRevenueResult.rows[0].monthly_revenue)
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get instructor courses
router.get('/courses', authenticate, authorize('instructor'), async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        c.*,
        cat.name as category_name,
        COUNT(DISTINCT e.enrollment_id) as enrollment_count,
        COALESCE(AVG(r.rating), 0) as average_rating
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      LEFT JOIN reviews r ON c.course_id = r.course_id
      WHERE c.instructor_id = $1
    `;
    
    const params = [req.user.user_id];
    
    if (status) {
      query += ` AND c.status = $2`;
      params.push(status);
    }
    
    query += ` GROUP BY c.course_id, cat.name ORDER BY c.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get instructor students
router.get('/students', authenticate, authorize('instructor'), async (req, res) => {
  try {
    const { course_id } = req.query;
    
    let query = `
      SELECT 
        e.*,
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email,
        c.title as course_title
      FROM enrollments e
      JOIN users u ON e.student_id = u.user_id
      JOIN courses c ON e.course_id = c.course_id
      WHERE c.instructor_id = $1
    `;
    
    const params = [req.user.user_id];
    
    if (course_id) {
      query += ` AND e.course_id = $2`;
      params.push(course_id);
    }
    
    query += ` ORDER BY e.enrollment_date DESC`;
    
    const result = await pool.query(query, params);
    res.json({ students: result.rows });
  } catch (error) {
    console.error('Get instructor students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get instructor analytics
router.get('/analytics', authenticate, authorize('instructor'), async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const instructorId = req.user.user_id;

    // Revenue over time
    const revenueResult = await pool.query(
      `SELECT 
        DATE_TRUNC('week', e.enrollment_date) as week,
        SUM(c.price) as revenue
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       WHERE c.instructor_id = $1
       AND e.enrollment_date >= CURRENT_DATE - INTERVAL '${period} days'
       GROUP BY DATE_TRUNC('week', e.enrollment_date)
       ORDER BY week`,
      [instructorId]
    );

    // Top courses
    const topCoursesResult = await pool.query(
      `SELECT 
        c.course_id,
        c.title,
        COUNT(e.enrollment_id) as enrollments,
        SUM(c.price) as revenue,
        COALESCE(AVG(r.rating), 0) as rating
       FROM courses c
       LEFT JOIN enrollments e ON c.course_id = e.course_id
       LEFT JOIN reviews r ON c.course_id = r.course_id
       WHERE c.instructor_id = $1
       GROUP BY c.course_id, c.title
       ORDER BY revenue DESC
       LIMIT 5`,
      [instructorId]
    );

    res.json({
      revenueChart: revenueResult.rows,
      topCourses: topCoursesResult.rows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


