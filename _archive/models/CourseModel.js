/**
 * Course Model
 * Handles all course-related database operations
 */
import { BaseModel } from './BaseModel.js';

export class CourseModel extends BaseModel {
  constructor() {
    super('courses');
  }

  /**
   * Find course by ID with related data
   */
  async findByIdWithDetails(courseId) {
    const query = `
      SELECT 
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
      GROUP BY c.course_id, cat.name, u.first_name, u.last_name
    `;
    
    const result = await this.query(query, [courseId]);
    return result.rows[0] || null;
  }

  /**
   * Find all courses with filters
   */
  async findAllWithFilters(filters = {}) {
    let query = `
      SELECT 
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
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND c.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.category_id) {
      query += ` AND c.category_id = $${paramCount++}`;
      params.push(filters.category_id);
    }

    if (filters.instructor_id) {
      query += ` AND c.instructor_id = $${paramCount++}`;
      params.push(filters.instructor_id);
    }

    if (filters.search) {
      query += ` AND (c.title ILIKE $${paramCount++} OR c.description ILIKE $${paramCount})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
      paramCount++;
    }

    query += ` GROUP BY c.course_id, cat.name, u.first_name, u.last_name`;

    if (filters.orderBy) {
      query += ` ORDER BY ${filters.orderBy}`;
    } else {
      query += ` ORDER BY c.created_at DESC`;
    }

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Find courses by instructor
   */
  async findByInstructor(instructorId) {
    return await this.findAllWithFilters({ instructor_id: instructorId });
  }

  /**
   * Create course (instructor_id is set automatically)
   */
  async createCourse(courseData) {
    return await this.create(courseData);
  }

  /**
   * Update course with ownership check
   */
  async updateCourse(courseId, instructorId, courseData) {
    // Verify ownership
    const course = await this.findById(courseId, 'course_id');
    if (!course) {
      throw new Error('Course not found');
    }
    
    if (course.instructor_id !== instructorId) {
      throw new Error('You do not have permission to update this course');
    }

    return await this.update(courseId, courseData, 'course_id');
  }

  /**
   * Delete course with ownership check
   */
  async deleteCourse(courseId, instructorId) {
    // Verify ownership
    const course = await this.findById(courseId, 'course_id');
    if (!course) {
      throw new Error('Course not found');
    }
    
    if (course.instructor_id !== instructorId) {
      throw new Error('You do not have permission to delete this course');
    }

    return await this.delete(courseId, 'course_id');
  }

  /**
   * Approve/reject course (admin only)
   */
  async updateStatus(courseId, status) {
    return await this.update(
      courseId,
      { 
        status,
        ...(status === 'approved' && { published_at: new Date() })
      },
      'course_id'
    );
  }
}

export default new CourseModel();

