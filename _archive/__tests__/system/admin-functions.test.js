/**
 * System Tests for Admin Functions
 * Tests: User management, admin creation, course moderation, system logs
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { cleanupDatabase, setupTestDatabase, createTestUser, createTestCourse, getAuthToken } from '../setup/test-setup.js';

let app;

beforeAll(async () => {
  await setupTestDatabase();
  app = express();
  app.use(express.json());
  
  const usersRoutes = (await import('../../routes/users.js')).default;
  const coursesRoutes = (await import('../../routes/courses.js')).default;
  const systemLogsRoutes = (await import('../../routes/system-logs.js')).default;
  
  app.use('/api/users', usersRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api/system-logs', systemLogsRoutes);
});

afterAll(async () => {
  await cleanupDatabase();
});

beforeEach(async () => {
  await cleanupDatabase();
});

describe('Admin Functions System Tests', () => {
  let admin, instructor, student;
  let adminToken, instructorToken, studentToken;

  beforeEach(async () => {
    admin = await createTestUser({ role: 'admin', adminApproved: true });
    instructor = await createTestUser({ role: 'instructor', adminApproved: false });
    student = await createTestUser({ role: 'student', adminApproved: true });
    
    adminToken = await getAuthToken(admin);
    instructorToken = await getAuthToken(instructor);
    studentToken = await getAuthToken(student);
  });

  describe('Admin User Management', () => {
    describe('POST /api/users - Create User (Admin)', () => {
      it('should create new student as admin', async () => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'newstudent@example.com',
            password: 'Test123!@#',
            firstName: 'New',
            lastName: 'Student',
            role: 'student',
          });

        expect(response.status).toBe(201);
        expect(response.body.user.role).toBe('student');
        expect(response.body.user.admin_approved).toBe(true);
      });

      it('should create new instructor as admin', async () => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'newinstructor@example.com',
            password: 'Test123!@#',
            firstName: 'New',
            lastName: 'Instructor',
            role: 'instructor',
          });

        expect(response.status).toBe(201);
        expect(response.body.user.role).toBe('instructor');
        expect(response.body.user.admin_approved).toBe(true);
      });

      it('should create new admin as admin (ERD requirement)', async () => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'newadmin@example.com',
            password: 'Test123!@#',
            firstName: 'New',
            lastName: 'Admin',
            role: 'admin',
          });

        expect(response.status).toBe(201);
        expect(response.body.user.role).toBe('admin');
        expect(response.body.user.admin_approved).toBe(true);
        
        // Verify approved_by is set to creating admin (ERD requirement)
        const pool = (await import('../../config/database.js')).default;
        const result = await pool.query(
          'SELECT approved_by FROM users WHERE email = $1',
          ['newadmin@example.com']
        );
        expect(result.rows[0].approved_by).toBe(admin.user_id);
      });

      it('should reject user creation by non-admin', async () => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            email: 'hacked@example.com',
            password: 'Test123!@#',
            firstName: 'Hacked',
            lastName: 'User',
            role: 'student',
          });

        expect(response.status).toBe(403);
      });
    });

    describe('PUT /api/users/:id/approve - Approve Instructor', () => {
      it('should approve instructor as admin', async () => {
        const response = await request(app)
          .put(`/api/users/${instructor.user_id}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ approved: true });

        expect(response.status).toBe(200);
        expect(response.body.user.admin_approved).toBe(true);
        
        // Verify approved_by is set (ERD requirement)
        const pool = (await import('../../config/database.js')).default;
        const result = await pool.query(
          'SELECT approved_by FROM users WHERE user_id = $1',
          [instructor.user_id]
        );
        expect(result.rows[0].approved_by).toBe(admin.user_id);
      });

      it('should reject approval by non-admin', async () => {
        const response = await request(app)
          .put(`/api/users/${instructor.user_id}/approve`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ approved: true });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/users - List All Users (Admin)', () => {
      beforeEach(async () => {
        await createTestUser({ email: 'user1@example.com', role: 'student' });
        await createTestUser({ email: 'user2@example.com', role: 'instructor' });
      });

      it('should list all users as admin', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.users)).toBe(true);
        expect(response.body.users.length).toBeGreaterThanOrEqual(3);
      });

      it('should filter users by role', async () => {
        const response = await request(app)
          .get('/api/users?role=student')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        response.body.users.forEach(user => {
          expect(user.role).toBe('student');
        });
      });

      it('should reject user listing by non-admin', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('PUT /api/users/:id - Update User', () => {
      it('should update user as admin', async () => {
        const response = await request(app)
          .put(`/api/users/${student.user_id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'Updated',
            status: 'inactive',
          });

        expect(response.status).toBe(200);
        expect(response.body.user.first_name).toBe('Updated');
        expect(response.body.user.status).toBe('inactive');
      });
    });

    describe('DELETE /api/users/:id - Delete User', () => {
      it('should delete user as admin', async () => {
        const response = await request(app)
          .delete(`/api/users/${student.user_id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);

        const pool = (await import('../../config/database.js')).default;
        const result = await pool.query(
          'SELECT * FROM users WHERE user_id = $1',
          [student.user_id]
        );
        expect(result.rows.length).toBe(0);
      });
    });
  });

  describe('Admin Course Moderation', () => {
    let courseId;

    beforeEach(async () => {
      const course = await createTestCourse(instructor.user_id, { status: 'pending' });
      courseId = course.course_id;
    });

    it('should approve course as admin', async () => {
      const response = await request(app)
        .put(`/api/courses/${courseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true });

      expect(response.status).toBe(200);
      expect(response.body.course.status).toBe('approved');
    });

    it('should reject course as admin', async () => {
      const response = await request(app)
        .put(`/api/courses/${courseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: false });

      expect(response.status).toBe(200);
      expect(response.body.course.status).toBe('rejected');
    });

    it('should edit any course as admin', async () => {
      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Edited Title',
        });

      expect(response.status).toBe(200);
      expect(response.body.course.title).toBe('Admin Edited Title');
    });
  });

  describe('System Logs (Admin)', () => {
    it('should view system logs as admin', async () => {
      const response = await request(app)
        .get('/api/system-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should filter logs by type', async () => {
      const response = await request(app)
        .get('/api/system-logs?log_type=security')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.logs.length > 0) {
        response.body.logs.forEach(log => {
          expect(log.log_type).toBe('security');
        });
      }
    });

    it('should reject log access by non-admin', async () => {
      const response = await request(app)
        .get('/api/system-logs')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });
});

