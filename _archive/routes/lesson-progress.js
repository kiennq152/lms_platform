import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get lesson progress for enrollment
router.get('/enrollment/:enrollmentId', authenticate, async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    // Verify enrollment ownership
    const enrollmentCheck = await pool.query(
      'SELECT student_id FROM enrollments WHERE enrollment_id = $1',
      [enrollmentId]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollmentCheck.rows[0].student_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT 
        lp.*,
        l.title as lesson_title,
        l.content_type,
        l.order_index
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.lesson_id
      WHERE lp.enrollment_id = $1
      ORDER BY l.order_index`,
      [enrollmentId]
    );

    res.json({ progress: result.rows });
  } catch (error) {
    console.error('Get lesson progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lesson progress
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed, watch_time_seconds, last_position } = req.body;

    // Get progress record
    const progressCheck = await pool.query(
      `SELECT lp.*, e.student_id
       FROM lesson_progress lp
       JOIN enrollments e ON lp.enrollment_id = e.enrollment_id
       WHERE lp.progress_id = $1`,
      [id]
    );

    if (progressCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    if (progressCheck.rows[0].student_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (is_completed !== undefined) {
      updateFields.push(`is_completed = $${paramCount++}`);
      values.push(is_completed);
      if (is_completed) {
        updateFields.push(`completion_date = CURRENT_TIMESTAMP`);
      }
    }

    if (watch_time_seconds !== undefined) {
      updateFields.push(`watch_time_seconds = $${paramCount++}`);
      values.push(watch_time_seconds);
    }

    if (last_position !== undefined) {
      updateFields.push(`last_position = $${paramCount++}`);
      values.push(last_position);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE lesson_progress 
       SET ${updateFields.join(', ')} 
       WHERE progress_id = $${paramCount} 
       RETURNING *`,
      values
    );

    // Update enrollment progress percentage
    await updateEnrollmentProgress(progressCheck.rows[0].enrollment_id);

    res.json({ progress: result.rows[0] });
  } catch (error) {
    console.error('Update lesson progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update lesson progress
router.post('/', authenticate, async (req, res) => {
  try {
    const { enrollment_id, lesson_id, is_completed, watch_time_seconds, last_position } = req.body;

    if (!enrollment_id || !lesson_id) {
      return res.status(400).json({ error: 'enrollment_id and lesson_id are required' });
    }

    // Verify enrollment ownership
    const enrollmentCheck = await pool.query(
      'SELECT student_id FROM enrollments WHERE enrollment_id = $1',
      [enrollment_id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollmentCheck.rows[0].student_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if progress exists
    const existingProgress = await pool.query(
      'SELECT progress_id FROM lesson_progress WHERE enrollment_id = $1 AND lesson_id = $2',
      [enrollment_id, lesson_id]
    );

    let result;
    if (existingProgress.rows.length > 0) {
      // Update existing
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (is_completed !== undefined) {
        updateFields.push(`is_completed = $${paramCount++}`);
        values.push(is_completed);
        if (is_completed) {
          updateFields.push(`completion_date = CURRENT_TIMESTAMP`);
        }
      }

      if (watch_time_seconds !== undefined) {
        updateFields.push(`watch_time_seconds = $${paramCount++}`);
        values.push(watch_time_seconds);
      }

      if (last_position !== undefined) {
        updateFields.push(`last_position = $${paramCount++}`);
        values.push(last_position);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(existingProgress.rows[0].progress_id);

      result = await pool.query(
        `UPDATE lesson_progress 
         SET ${updateFields.join(', ')} 
         WHERE progress_id = $${paramCount} 
         RETURNING *`,
        values
      );
    } else {
      // Create new
      result = await pool.query(
        `INSERT INTO lesson_progress (
          enrollment_id, lesson_id, is_completed, watch_time_seconds, 
          last_position, completion_date
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          enrollment_id,
          lesson_id,
          is_completed || false,
          watch_time_seconds || 0,
          last_position || 0,
          is_completed ? new Date() : null
        ]
      );
    }

    // Update enrollment progress percentage
    await updateEnrollmentProgress(enrollment_id);

    res.json({ progress: result.rows[0] });
  } catch (error) {
    console.error('Create/update lesson progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to update enrollment progress percentage
async function updateEnrollmentProgress(enrollmentId) {
  try {
    // Get total lessons in course
    const courseResult = await pool.query(
      `SELECT c.course_id
       FROM enrollments e
       JOIN courses c ON e.course_id = c.course_id
       WHERE e.enrollment_id = $1`,
      [enrollmentId]
    );

    if (courseResult.rows.length === 0) return;

    const courseId = courseResult.rows[0].course_id;

    const totalLessonsResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM lessons l
       JOIN modules m ON l.module_id = m.module_id
       WHERE m.course_id = $1`,
      [courseId]
    );

    const totalLessons = parseInt(totalLessonsResult.rows[0].total) || 1;

    // Get completed lessons
    const completedResult = await pool.query(
      `SELECT COUNT(*) as completed
       FROM lesson_progress
       WHERE enrollment_id = $1 AND is_completed = TRUE`,
      [enrollmentId]
    );

    const completedLessons = parseInt(completedResult.rows[0].completed) || 0;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    // Update enrollment progress
    await pool.query(
      `UPDATE enrollments 
       SET progress_percentage = $1, updated_at = CURRENT_TIMESTAMP
       WHERE enrollment_id = $2`,
      [progressPercentage, enrollmentId]
    );

    // Check if course is completed (100%) and generate certificate
    if (progressPercentage >= 100) {
      await checkAndGenerateCertificate(enrollmentId, courseId);
    }
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
  }
}

// Helper function to generate certificate when course is completed
async function checkAndGenerateCertificate(enrollmentId, courseId) {
  try {
    // Check if certificate already exists
    const existingCert = await pool.query(
      'SELECT certificate_id FROM certificates WHERE enrollment_id = $1',
      [enrollmentId]
    );

    if (existingCert.rows.length > 0) {
      return; // Certificate already exists
    }

    // Get student info
    const enrollmentResult = await pool.query(
      `SELECT e.student_id, u.first_name, u.last_name, co.title as course_title
       FROM enrollments e
       JOIN users u ON e.student_id = u.user_id
       JOIN courses co ON e.course_id = co.course_id
       WHERE e.enrollment_id = $1`,
      [enrollmentId]
    );

    if (enrollmentResult.rows.length === 0) return;

    const enrollment = enrollmentResult.rows[0];

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create certificate
    await pool.query(
      `INSERT INTO certificates (
        enrollment_id, student_id, course_id, 
        certificate_number, issued_date
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [enrollmentId, enrollment.student_id, courseId, certificateNumber]
    );
  } catch (error) {
    console.error('Error generating certificate:', error);
  }
}

export default router;


