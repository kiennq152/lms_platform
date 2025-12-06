/**
 * User Model
 * Handles all user-related database operations
 */
import { BaseModel } from './BaseModel.js';
import bcrypt from 'bcryptjs';

export class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  /**
   * Find user by ID
   */
  async findById(userId) {
    return await super.findById(userId, 'user_id');
  }

  /**
   * Create user with hashed password
   */
  async createUser(userData) {
    const { password, ...otherData } = userData;
    
    // Hash password if provided
    if (password) {
      otherData.password_hash = await bcrypt.hash(password, 10);
    }

    return await this.create(otherData);
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update user password
   */
  async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return await this.update(userId, { password_hash: passwordHash }, 'user_id');
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    const user = await this.findByEmail(email);
    return !!user;
  }

  /**
   * Update user status
   */
  async updateStatus(userId, status) {
    return await this.update(userId, { status }, 'user_id');
  }

  /**
   * Approve user (for instructors/admins)
   */
  async approveUser(userId, approvedBy) {
    return await this.update(
      userId,
      { 
        admin_approved: true,
        admin_approved_at: new Date(),
        approved_by: approvedBy
      },
      'user_id'
    );
  }

  /**
   * Verify email
   */
  async verifyEmail(userId) {
    return await this.update(
      userId,
      {
        email_verified: true,
        email_verified_at: new Date()
      },
      'user_id'
    );
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId) {
    return await this.update(
      userId,
      { last_login: new Date() },
      'user_id'
    );
  }

  /**
   * Find users by role
   */
  async findByRole(role) {
    return await this.findAll({ role });
  }

  /**
   * Find users by status
   */
  async findByStatus(status) {
    return await this.findAll({ status });
  }

  /**
   * Get user with related data
   */
  async findByIdWithDetails(userId) {
    const query = `
      SELECT 
        u.*,
        COUNT(DISTINCT c.course_id) as course_count,
        COUNT(DISTINCT e.enrollment_id) as enrollment_count
      FROM users u
      LEFT JOIN courses c ON u.user_id = c.instructor_id
      LEFT JOIN enrollments e ON u.user_id = e.student_id
      WHERE u.user_id = $1
      GROUP BY u.user_id
    `;
    
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }
}

export default new UserModel();

