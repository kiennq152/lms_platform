/**
 * Enrollment Model
 * Handles enrollment-related database operations
 */
import { BaseModel } from './BaseModel.js';

export class EnrollmentModel extends BaseModel {
  constructor() {
    super('enrollments');
  }

  /**
   * Find enrollment by student and course
   */
  async findByStudentAndCourse(studentId, courseId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE student_id = $1 AND course_id = $2
    `;
    const result = await this.query(query, [studentId, courseId]);
    return result.rows[0] || null;
  }

  /**
   * Find enrollments by student
   */
  async findByStudent(studentId) {
    const query = `
      SELECT 
        e.*,
        c.title as course_title,
        c.thumbnail_url,
        c.price,
        u.first_name || ' ' || u.last_name as instructor_name
      FROM ${this.tableName} e
      JOIN courses c ON e.course_id = c.course_id
      JOIN users u ON c.instructor_id = u.user_id
      WHERE e.student_id = $1
      ORDER BY e.enrollment_date DESC
    `;
    const result = await this.query(query, [studentId]);
    return result.rows;
  }

  /**
   * Create enrollment
   */
  async createEnrollment(studentId, courseId) {
    // Check if already enrolled
    const existing = await this.findByStudentAndCourse(studentId, courseId);
    if (existing) {
      throw new Error('Already enrolled in this course');
    }

    return await this.create({
      student_id: studentId,
      course_id: courseId,
      enrollment_date: new Date(),
      status: 'active',
      progress_percentage: 0,
    });
  }

  /**
   * Update progress
   */
  async updateProgress(enrollmentId, progressPercentage) {
    return await this.update(
      enrollmentId,
      {
        progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
        last_accessed_at: new Date(),
        ...(progressPercentage >= 100 && {
          completion_date: new Date(),
          status: 'completed',
        }),
      },
      'enrollment_id'
    );
  }
}

export default new EnrollmentModel();

