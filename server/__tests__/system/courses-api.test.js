/**
 * System Tests for Courses API Endpoints
 * Tests: Course CRUD, filtering, search, instructor ownership
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
  
  const coursesRoutes = (await import('../../routes/courses.js')).default;
  app.use('/api/courses', coursesRoutes);
});

afterAll(async () => {
  await cleanupDatabase();
});

beforeEach(async () => {
  await cleanupDatabase();
});

describe('Courses API System Tests', () => {
  let instructor, student, admin;
  let instructorToken, studentToken, adminToken;

  beforeEach(async () => {
    instructor = await createTestUser({ role: 'instructor', adminApproved: true });
    student = await createTestUser({ role: 'student', adminApproved: true });
    admin = await createTestUser({ role: 'admin', adminApproved: true });
    
    instructorToken = await getAuthToken(instructor);
    studentToken = await getAuthToken(student);
    adminToken = await getAuthToken(admin);
  });

  describe('GET /api/courses', () => {
    it('should get all published courses (public)', async () => {
      await createTestCourse(instructor.user_id, { status: 'published' });
      await createTestCourse(instructor.user_id, { status: 'published', title: 'Course 2' });

      const response = await request(app)
        .get('/api/courses');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.courses)).toBe(true);
      expect(response.body.courses.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter courses by status', async () => {
      await createTestCourse(instructor.user_id, { status: 'published' });
      await createTestCourse(instructor.user_id, { status: 'draft' });

      const response = await request(app)
        .get('/api/courses?status=published');

      expect(response.status).toBe(200);
      response.body.courses.forEach(course => {
        expect(course.status).toBe('published');
      });
    });

    it('should search courses by title', async () => {
      await createTestCourse(instructor.user_id, { title: 'JavaScript Basics', status: 'published' });
      await createTestCourse(instructor.user_id, { title: 'Python Advanced', status: 'published' });

      const response = await request(app)
        .get('/api/courses?search=JavaScript');

      expect(response.status).toBe(200);
      expect(response.body.courses.some(c => c.title.includes('JavaScript'))).toBe(true);
    });
  });

  describe('POST /api/courses (Create Course)', () => {
    it('should create course as instructor', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'New Course',
          description: 'Course Description',
          short_description: 'Short desc',
          price: 99.99,
          status: 'draft',
        });

      expect(response.status).toBe(201);
      expect(response.body.course.title).toBe('New Course');
      expect(response.body.course.instructor_id).toBe(instructor.user_id);
    });

    it('should reject course creation by student', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'New Course',
          description: 'Course Description',
          price: 99.99,
        });

      expect(response.status).toBe(403);
    });

    it('should reject course creation without authentication', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({
          title: 'New Course',
          description: 'Course Description',
          price: 99.99,
        });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/courses/:id (Update Course)', () => {
    let courseId;

    beforeEach(async () => {
      const course = await createTestCourse(instructor.user_id);
      courseId = course.course_id;
    });

    it('should update own course as instructor', async () => {
      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Updated Course Title',
          price: 149.99,
        });

      expect(response.status).toBe(200);
      expect(response.body.course.title).toBe('Updated Course Title');
      expect(response.body.course.price).toBe('149.99');
    });

    it('should reject update of other instructor\'s course', async () => {
      const otherInstructor = await createTestUser({ role: 'instructor', adminApproved: true });
      const otherToken = await getAuthToken(otherInstructor);

      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(response.status).toBe(403);
    });

    it('should allow admin to update any course', async () => {
      const response = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Updated Title',
        });

      expect(response.status).toBe(200);
      expect(response.body.course.title).toBe('Admin Updated Title');
    });
  });

  describe('DELETE /api/courses/:id (Delete Course)', () => {
    let courseId;

    beforeEach(async () => {
      const course = await createTestCourse(instructor.user_id);
      courseId = course.course_id;
    });

    it('should delete own course as instructor', async () => {
      const response = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(200);

      // Verify course is deleted
      const pool = (await import('../../config/database.js')).default;
      const result = await pool.query(
        'SELECT * FROM courses WHERE course_id = $1',
        [courseId]
      );
      expect(result.rows.length).toBe(0);
    });

    it('should reject deletion of other instructor\'s course', async () => {
      const otherInstructor = await createTestUser({ role: 'instructor', adminApproved: true });
      const otherToken = await getAuthToken(otherInstructor);

      const response = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to delete any course', async () => {
      const response = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course details by ID', async () => {
      const course = await createTestCourse(instructor.user_id, { status: 'published' });

      const response = await request(app)
        .get(`/api/courses/${course.course_id}`);

      expect(response.status).toBe(200);
      expect(response.body.course.course_id).toBe(course.course_id);
      expect(response.body.course.title).toBe(course.title);
    });

    it('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .get('/api/courses/99999');

      expect(response.status).toBe(404);
    });
  });
});

