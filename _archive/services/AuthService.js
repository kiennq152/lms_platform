/**
 * Auth Service
 * Handles complex authentication business logic
 */
import UserModel from '../models/UserModel.js';
import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
  }

  /**
   * Generate email verification token
   */
  generateVerificationToken(email) {
    return jwt.sign(
      { email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Validate user can login
   */
  async validateLogin(user) {
    const errors = [];

    // Admin accounts bypass approval checks
    if (user.role !== 'admin') {
      if (user.role === 'instructor' && !user.admin_approved) {
        errors.push('Your account is pending approval. Please wait for administrator approval.');
      }
    }

    if (user.status !== 'active') {
      errors.push(`Your account is ${user.status}. Please contact administrator.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new AuthService();

