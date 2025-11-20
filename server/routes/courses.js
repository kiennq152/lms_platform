import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const { status, category, search, instructor_id } = req.query;
    
    let query = `
      SELECT 
        c.course_id,
        c.title,
        c.description,
        c.short_description,
        c.price,
        c.thumbnail_url,
        c.status,
        c.category_id,
        cat.name as category_name,
        c.instructor_id,
        u.first_name || ' ' || u.last_name as instructor_name,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT e.enrollment_id) as enrollment_count,
        COALESCE(AVG(r.rating), 0) as average_rating
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      LEFT JOIN reviews r ON c.course_id = r.course_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (category) {
      query += ` AND c.category_id = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (instructor_id) {
      query += ` AND c.instructor_id = $${paramCount}`;
      params.push(instructor_id);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` GROUP BY c.course_id, cat.name, u.first_name, u.last_name ORDER BY c.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single course with modules and lessons
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get course
    const courseResult = await pool.query(
      `SELECT 
        c.*,
        cat.name as category_name,
        u.first_name || ' ' || u.last_name as instructor_name,
        COUNT(DISTINCT e.enrollment_id) as enrollment_count,
        COALESCE(AVG(r.rating), 0) as average_rating
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       LEFT JOIN users u ON c.instructor_id = u.user_id
       LEFT JOIN enrollments e ON c.course_id = e.course_id
       LEFT JOIN reviews r ON c.course_id = r.course_id
       WHERE c.course_id = $1
       GROUP BY c.course_id, cat.name, u.first_name, u.last_name`,
      [id]
    );
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = courseResult.rows[0];
    
    // Get modules
    const modulesResult = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index',
      [id]
    );
    
    // Get lessons for each module
    const modules = await Promise.all(
      modulesResult.rows.map(async (module) => {
        const lessonsResult = await pool.query(
          'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index',
          [module.module_id]
        );
        // Handle content_data - PostgreSQL JSONB returns as object, but handle both cases
        const lessons = lessonsResult.rows.map(lesson => {
          if (lesson.content_data) {
            if (typeof lesson.content_data === 'string') {
              try {
                lesson.content_data = JSON.parse(lesson.content_data);
              } catch (e) {
                console.error('Error parsing content_data for lesson', lesson.lesson_id, e);
                lesson.content_data = {};
              }
            }
            // If it's already an object (JSONB), use it as-is
          } else {
            lesson.content_data = {};
          }
          return lesson;
        });
        return {
          ...module,
          lessons: lessons
        };
      })
    );
    
    res.json({
      course: {
        ...course,
        modules
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create course (instructor only)
router.post('/', authenticate, authorize('instructor', 'admin'), [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      short_description,
      description,
      price,
      category_id,
      thumbnail_url,
      level,
      language
    } = req.body;

    const result = await pool.query(
      `INSERT INTO courses (
        title, short_description, description, price, category_id, 
        instructor_id, thumbnail_url, level, language, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        title,
        short_description || null,
        description,
        price,
        category_id || null,
        req.user.user_id,
        thumbnail_url || null,
        level || 'beginner',
        language || 'en',
        'pending' // New courses need admin approval
      ]
    );

    res.status(201).json({ course: result.rows[0] });
  } catch (error) {
    console.error('Create course error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update course (instructor only)
router.put('/:id', authenticate, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if course belongs to instructor
    const courseCheck = await pool.query(
      'SELECT instructor_id FROM courses WHERE course_id = $1',
      [id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (courseCheck.rows[0].instructor_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      title,
      short_description,
      description,
      price,
      category_id,
      thumbnail_url,
      level,
      language,
      status
    } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (short_description !== undefined) {
      updateFields.push(`short_description = $${paramCount++}`);
      values.push(short_description);
    }
    if (description) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (thumbnail_url !== undefined) {
      updateFields.push(`thumbnail_url = $${paramCount++}`);
      values.push(thumbnail_url);
    }
    if (level) {
      updateFields.push(`level = $${paramCount++}`);
      values.push(level);
    }
    if (language) {
      updateFields.push(`language = $${paramCount++}`);
      values.push(language);
    }
    if (status && req.user.role === 'admin') {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE courses SET ${updateFields.join(', ')} WHERE course_id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Update course error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete course (instructor only)
router.delete('/:id', authenticate, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const courseCheck = await pool.query(
      'SELECT instructor_id FROM courses WHERE course_id = $1',
      [id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (courseCheck.rows[0].instructor_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query('DELETE FROM courses WHERE course_id = $1', [id]);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update module
router.post('/:courseId/modules', authenticate, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { module_id, title, order_index } = req.body;

    // Verify course ownership
    const courseCheck = await pool.query(
      'SELECT instructor_id FROM courses WHERE course_id = $1',
      [courseId]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Module title is required' });
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
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create/Update lesson
router.post('/:courseId/lessons', authenticate, authorize('instructor', 'admin'), async (req, res) => {
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

    // Handle content_data - ensure it's an object and stringify it
    let contentDataJson = '{}';
    if (content_data) {
      if (typeof content_data === 'object') {
        contentDataJson = JSON.stringify(content_data);
      } else if (typeof content_data === 'string') {
        // Already a string, validate it's valid JSON
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
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

