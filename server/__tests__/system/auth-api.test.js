/**
 * System Tests for Authentication API Endpoints
 * Tests: Registration, Login, Token validation, Password reset
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { cleanupDatabase, setupTestDatabase, createTestUser, getAuthToken } from '../setup/test-setup.js';

// Import app setup
let app;

beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();
  
  // Create Express app with routes
  app = express();
  app.use(express.json());
  
  // Import and mount auth routes
  const authRoutes = (await import('../../routes/auth.js')).default;
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await cleanupDatabase();
});

beforeEach(async () => {
  await cleanupDatabase();
});

describe('Authentication API System Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newstudent@example.com',
          password: 'Test123!@#',
          firstName: 'New',
          lastName: 'Student',
          role: 'student',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newstudent@example.com');
      expect(response.body.user.role).toBe('student');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should register a new instructor successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newinstructor@example.com',
          password: 'Test123!@#',
          firstName: 'New',
          lastName: 'Instructor',
          role: 'instructor',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('instructor');
      expect(response.body.user.admin_approved).toBe(false); // Instructors need approval
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345', // Too short
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password, firstName, lastName
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'login@example.com',
        password: 'Test123!@#',
        adminApproved: true,
        emailVerified: true,
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(401);
    });

    it('should reject login for unapproved instructor', async () => {
      await createTestUser({
        email: 'unapproved@example.com',
        password: 'Test123!@#',
        role: 'instructor',
        adminApproved: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unapproved@example.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('approved');
    });

    it('should reject login for inactive user', async () => {
      const pool = (await import('../../config/database.js')).default;
      const user = await createTestUser({
        email: 'inactive@example.com',
        password: 'Test123!@#',
      });

      await pool.query(
        "UPDATE users SET status = 'inactive' WHERE user_id = $1",
        [user.user_id]
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const user = await createTestUser({
        email: 'me@example.com',
        adminApproved: true,
      });
      const token = await getAuthToken(user);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('me@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const pool = (await import('../../config/database.js')).default;
      const jwt = await import('jsonwebtoken');
      
      const user = await createTestUser({
        email: 'verify@example.com',
        emailVerified: false,
      });

      const verificationToken = jwt.sign(
        { email: 'verify@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      await pool.query(
        'UPDATE users SET email_verification_token = $1 WHERE user_id = $2',
        [verificationToken, user.user_id]
      );

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken });

      expect(response.status).toBe(200);
      
      const updatedUser = await pool.query(
        'SELECT email_verified FROM users WHERE user_id = $1',
        [user.user_id]
      );
      expect(updatedUser.rows[0].email_verified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(400);
    });
  });
});

