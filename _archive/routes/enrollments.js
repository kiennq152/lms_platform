import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get enrollments (student sees their own, instructor sees their course enrollments)
router.get('/', authenticate, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'student') {
      query = `
        SELECT 
          e.*,
          c.title as course_title,
          c.thumbnail_url,
          c.price,
          u.first_name || ' ' || u.last_name as instructor_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.course_id
        JOIN users u ON c.instructor_id = u.user_id
        WHERE e.student_id = $1
        ORDER BY e.enrollment_date DESC
      `;
      params = [req.user.user_id];
    } else if (req.user.role === 'instructor') {
      query = `
        SELECT 
          e.*,
          c.title as course_title,
          u.first_name || ' ' || u.last_name as student_name,
          u.email as student_email
        FROM enrollments e
        JOIN courses c ON e.course_id = c.course_id
        JOIN users u ON e.student_id = u.user_id
        WHERE c.instructor_id = $1
        ORDER BY e.enrollment_date DESC
      `;
      params = [req.user.user_id];
    } else {
      // Admin sees all
      query = `
        SELECT 
          e.*,
          c.title as course_title,
          u.first_name || ' ' || u.last_name as student_name,
          u.email as student_email
        FROM enrollments e
        JOIN courses c ON e.course_id = c.course_id
        JOIN users u ON e.student_id = u.user_id
        ORDER BY e.enrollment_date DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    res.json({ enrollments: result.rows });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll in course
router.post('/', authenticate, authorize('student'), async (req, res) => {
  try {
    const { course_id } = req.body;

    // Check if course exists
    const courseCheck = await pool.query(
      'SELECT course_id, status FROM courses WHERE course_id = $1',
      [course_id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (courseCheck.rows[0].status !== 'published') {
      return res.status(400).json({ error: 'Course is not available for enrollment' });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [req.user.user_id, course_id]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const result = await pool.query(
      `INSERT INTO enrollments (student_id, course_id, status, enrollment_date)
       VALUES ($1, $2, 'active', CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.user_id, course_id]
    );

    res.status(201).json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update enrollment progress
router.put('/:id/progress', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percentage, last_accessed_at } = req.body;

    // Check enrollment ownership
    const enrollmentCheck = await pool.query(
      'SELECT student_id FROM enrollments WHERE enrollment_id = $1',
      [id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollmentCheck.rows[0].student_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (progress_percentage !== undefined) {
      updateFields.push(`progress_percentage = $${paramCount++}`);
      values.push(progress_percentage);
    }

    if (last_accessed_at) {
      updateFields.push(`last_accessed_at = $${paramCount++}`);
      values.push(last_accessed_at);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE enrollments SET ${updateFields.join(', ')} WHERE enrollment_id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete enrollment (unenroll) - student can unenroll from their courses
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check enrollment ownership
    const enrollmentCheck = await pool.query(
      'SELECT student_id, course_id FROM enrollments WHERE enrollment_id = $1',
      [id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Students can only delete their own enrollments, admins can delete any
    if (enrollmentCheck.rows[0].student_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query('DELETE FROM enrollments WHERE enrollment_id = $1', [id]);

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alternative: Delete enrollment by course_id (for convenience)
router.delete('/course/:courseId', authenticate, authorize('student'), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if enrollment exists
    const enrollmentCheck = await pool.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [req.user.user_id, courseId]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await pool.query(
      'DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [req.user.user_id, courseId]
    );

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Delete enrollment by course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

