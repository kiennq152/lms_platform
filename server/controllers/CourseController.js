/**
 * Course Controller
 * Handles course-related business logic
 */
import CourseModel from '../models/CourseModel.js';

export class CourseController {
  /**
   * Get all courses with filters
   */
  async getAllCourses(req, res) {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        instructor_id: req.query.instructor_id,
        search: req.query.search,
        orderBy: req.query.orderBy || 'c.created_at DESC',
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      };

      const courses = await CourseModel.findAllWithFilters(filters);

      return res.json({
        courses,
        count: courses.length,
      });
    } catch (error) {
      console.error('Get courses error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(req, res) {
    try {
      const { id } = req.params;
      const course = await CourseModel.findByIdWithDetails(id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      return res.json({ course });
    } catch (error) {
      console.error('Get course error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Create new course
   */
  async createCourse(req, res) {
    try {
      const instructorId = req.user.user_id;

      // Verify user is instructor or admin
      if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only instructors can create courses' });
      }

      const courseData = {
        instructor_id: instructorId,
        title: req.body.title,
        description: req.body.description,
        short_description: req.body.short_description,
        price: req.body.price || 0,
        category_id: req.body.category_id || null,
        thumbnail_url: req.body.thumbnail_url || null,
        status: req.body.status || 'draft',
        level: req.body.level || 'beginner',
        language: req.body.language || 'vi',
      };

      const course = await CourseModel.createCourse(courseData);

      return res.status(201).json({
        message: 'Course created successfully',
        course,
      });
    } catch (error) {
      console.error('Create course error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update course
   */
  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const instructorId = req.user.user_id;
      const isAdmin = req.user.role === 'admin';

      const courseData = {};
      const allowedFields = [
        'title',
        'description',
        'short_description',
        'price',
        'category_id',
        'thumbnail_url',
        'status',
        'level',
        'language',
      ];

      // Only include allowed fields
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          courseData[field] = req.body[field];
        }
      });

      let course;
      if (isAdmin) {
        // Admin can update any course
        course = await CourseModel.update(id, courseData, 'course_id');
      } else {
        // Instructor can only update own courses
        course = await CourseModel.updateCourse(id, instructorId, courseData);
      }

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      return res.json({
        message: 'Course updated successfully',
        course,
      });
    } catch (error) {
      console.error('Update course error:', error);
      
      if (error.message.includes('permission')) {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Delete course
   */
  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      const instructorId = req.user.user_id;
      const isAdmin = req.user.role === 'admin';

      let course;
      if (isAdmin) {
        // Admin can delete any course
        course = await CourseModel.delete(id, 'course_id');
      } else {
        // Instructor can only delete own courses
        course = await CourseModel.deleteCourse(id, instructorId);
      }

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      return res.json({
        message: 'Course deleted successfully',
        course,
      });
    } catch (error) {
      console.error('Delete course error:', error);
      
      if (error.message.includes('permission')) {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new CourseController();

