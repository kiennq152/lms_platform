/**
 * Course Routes (MVC Pattern)
 * Routes only handle HTTP concerns, business logic in controllers
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import CourseController from '../controllers/CourseController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Get all courses (public)
router.get('/', async (req, res, next) => {
  try {
    await CourseController.getAllCourses(req, res);
  } catch (error) {
    next(error);
  }
});

// Create/Update module - MUST be before /:id route
router.post('/:courseId/modules', authenticate, authorize('instructor', 'admin'), async (req, res, next) => {
  console.log('📥 POST /api/courses/:courseId/modules hit!', { courseId: req.params.courseId, body: req.body });
  try {
    const { courseId } = req.params;
    const { module_id, title, order_index } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Module title is required' });
    }
    
    // Verify course ownership
    const courseCheck = await pool.query(
      'SELECT instructor_id FROM courses WHERE course_id = $1',
      [courseId]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (courseCheck.rows[0].instructor_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let result;
    if (module_id) {
      // Update
      result = await pool.query(
        'UPDATE modules SET title = $1, order_index = $2, updated_at = CURRENT_TIMESTAMP WHERE module_id = $3 RETURNING *',
        [title, order_index || 0, module_id]
      );
    } else {
      // Create
      result = await pool.query(
        'INSERT INTO modules (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING *',
        [courseId, title, order_index || 0]
      );
    }

    res.json({ module: result.rows[0] });
  } catch (error) {
    console.error('Module operation error:', error);
    next(error);
  }
});

// Create/Update lesson - MUST be before /:id route
router.post('/:courseId/lessons', authenticate, authorize('instructor', 'admin'), async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { lesson_id, module_id, title, content_type, content_data, order_index, is_preview } = req.body;
    
    // Verify course ownership
    const courseCheck = await pool.query(
      'SELECT instructor_id FROM courses WHERE course_id = $1',
      [courseId]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (courseCheck.rows[0].instructor_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Handle content_data - ensure it's an object and stringify it
    let contentDataJson = '{}';
    if (content_data) {
      if (typeof content_data === 'object') {
        contentDataJson = JSON.stringify(content_data);
      } else if (typeof content_data === 'string') {
        try {
          JSON.parse(content_data);
          contentDataJson = content_data;
        } catch (e) {
          contentDataJson = '{}';
        }
      }
    }

    let result;
    if (lesson_id) {
      // Update
      result = await pool.query(
        `UPDATE lessons SET 
          title = $1, content_type = $2, content_data = $3, 
          order_index = $4, is_preview = $5, updated_at = CURRENT_TIMESTAMP 
         WHERE lesson_id = $6 RETURNING *`,
        [title || '', content_type || 'video', contentDataJson, order_index || 0, is_preview || false, lesson_id]
      );
    } else {
      // Create
      if (!module_id) {
        return res.status(400).json({ error: 'module_id is required' });
      }
      result = await pool.query(
        `INSERT INTO lessons (module_id, title, content_type, content_data, order_index, is_preview)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [module_id, title || '', content_type || 'video', contentDataJson, order_index || 0, is_preview || false]
      );
    }

    res.json({ lesson: result.rows[0] });
  } catch (error) {
    console.error('Lesson operation error:', error);
    next(error);
  }
});

// Get course by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    await CourseController.getCourseById(req, res);
  } catch (error) {
    next(error);
  }
});

// Create course (instructor/admin only)
router.post(
  '/',
  authenticate,
  authorize('instructor', 'admin'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      await CourseController.createCourse(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update course (instructor/admin only)
router.put(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  async (req, res, next) => {
    try {
      await CourseController.updateCourse(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Delete course (instructor/admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  async (req, res, next) => {
    try {
      await CourseController.deleteCourse(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

