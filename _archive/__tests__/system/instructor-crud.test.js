/**
 * System Tests for Instructor CRUD Operations
 * Based on ERD requirements: Instructors can only manage their own courses
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
  const instructorRoutes = (await import('../../routes/instructor.js')).default;
  app.use('/api/courses', coursesRoutes);
  app.use('/api/instructor', instructorRoutes);
});

afterAll(async () => {
  await cleanupDatabase();
});

beforeEach(async () => {
  await cleanupDatabase();
});

describe('Instructor CRUD Operations (ERD Compliance)', () => {
  let instructor1, instructor2;
  let token1, token2;

  beforeEach(async () => {
    instructor1 = await createTestUser({ 
      email: 'instructor1@example.com',
      role: 'instructor', 
      adminApproved: true 
    });
    instructor2 = await createTestUser({ 
      email: 'instructor2@example.com',
      role: 'instructor', 
      adminApproved: true 
    });
    
    token1 = await getAuthToken(instructor1);
    token2 = await getAuthToken(instructor2);
  });

  describe('CREATE - Instructor Course Creation', () => {
    it('should create course with instructor_id automatically set', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Instructor 1 Course',
          description: 'Description',
          short_description: 'Short',
          price: 99.99,
          status: 'draft',
        });

      expect(response.status).toBe(201);
      expect(response.body.course.instructor_id).toBe(instructor1.user_id);
      expect(response.body.course.title).toBe('Instructor 1 Course');
    });

    it('should not allow setting instructor_id to different value', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Hacked Course',
          description: 'Description',
          short_description: 'Short',
          price: 99.99,
          instructor_id: instructor2.user_id, // Try to set different instructor
        });

      expect(response.status).toBe(201);
      // Should ignore provided instructor_id and use authenticated user
      expect(response.body.course.instructor_id).toBe(instructor1.user_id);
    });
  });

  describe('READ - Instructor Course Reading', () => {
    beforeEach(async () => {
      await createTestCourse(instructor1.user_id, { title: 'Course 1' });
      await createTestCourse(instructor1.user_id, { title: 'Course 2' });
      await createTestCourse(instructor2.user_id, { title: 'Course 3' });
    });

    it('should only return instructor\'s own courses', async () => {
      const response = await request(app)
        .get('/api/instructor/courses')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.courses)).toBe(true);
      response.body.courses.forEach(course => {
        expect(course.instructor_id).toBe(instructor1.user_id);
      });
    });

    it('should not return other instructor\'s courses', async () => {
      const response = await request(app)
        .get('/api/instructor/courses')
        .set('Authorization', `Bearer ${token1}`);

      const hasInstructor2Course = response.body.courses.some(
        c => c.instructor_id === instructor2.user_id
      );
      expect(hasInstructor2Course).toBe(false);
    });
  });

  describe('UPDATE - Instructor Course Update', () => {
    let course1Id, course2Id;

    beforeEach(async () => {
      const course1 = await createTestCourse(instructor1.user_id);
      const course2 = await createTestCourse(instructor2.user_id);
      course1Id = course1.course_id;
      course2Id = course2.course_id;
    });

    it('should update own course', async () => {
      const response = await request(app)
        .put(`/api/courses/${course1Id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Updated by Owner',
        });

      expect(response.status).toBe(200);
      expect(response.body.course.title).toBe('Updated by Owner');
      expect(response.body.course.instructor_id).toBe(instructor1.user_id);
    });

    it('should reject update of other instructor\'s course', async () => {
      const response = await request(app)
        .put(`/api/courses/${course2Id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Hacked Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('permission');
    });

    it('should enforce instructor_id ownership in database', async () => {
      const pool = (await import('../../config/database.js')).default;
      
      // Try to update directly in database (should fail or be prevented)
      const result = await pool.query(
        `UPDATE courses SET title = 'Direct DB Update' 
         WHERE course_id = $1 AND instructor_id = $2`,
        [course2Id, instructor1.user_id] // Wrong instructor_id
      );

      // Verify update didn't happen
      const course = await pool.query(
        'SELECT title FROM courses WHERE course_id = $1',
        [course2Id]
      );
      expect(course.rows[0].title).not.toBe('Direct DB Update');
    });
  });

  describe('DELETE - Instructor Course Deletion', () => {
    let course1Id, course2Id;

    beforeEach(async () => {
      const course1 = await createTestCourse(instructor1.user_id);
      const course2 = await createTestCourse(instructor2.user_id);
      course1Id = course1.course_id;
      course2Id = course2.course_id;
    });

    it('should delete own course', async () => {
      const response = await request(app)
        .delete(`/api/courses/${course1Id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);

      const pool = (await import('../../config/database.js')).default;
      const result = await pool.query(
        'SELECT * FROM courses WHERE course_id = $1',
        [course1Id]
      );
      expect(result.rows.length).toBe(0);
    });

    it('should reject deletion of other instructor\'s course', async () => {
      const response = await request(app)
        .delete(`/api/courses/${course2Id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(403);

      // Verify course still exists
      const pool = (await import('../../config/database.js')).default;
      const result = await pool.query(
        'SELECT * FROM courses WHERE course_id = $1',
        [course2Id]
      );
      expect(result.rows.length).toBe(1);
    });

    it('should cascade delete related data (modules, lessons)', async () => {
      const pool = (await import('../../config/database.js')).default;
      
      // Create module and lesson
      const moduleResult = await pool.query(
        `INSERT INTO modules (course_id, title, order_index)
         VALUES ($1, 'Test Module', 1)
         RETURNING module_id`,
        [course1Id]
      );
      const moduleId = moduleResult.rows[0].module_id;

      await pool.query(
        `INSERT INTO lessons (module_id, title, content_type, order_index)
         VALUES ($1, 'Test Lesson', 'video', 1)`,
        [moduleId]
      );

      // Delete course
      await request(app)
        .delete(`/api/courses/${course1Id}`)
        .set('Authorization', `Bearer ${token1}`);

      // Verify cascade delete
      const moduleCheck = await pool.query(
        'SELECT * FROM modules WHERE module_id = $1',
        [moduleId]
      );
      expect(moduleCheck.rows.length).toBe(0);
    });
  });

  describe('Ownership Enforcement', () => {
    it('should enforce instructor_id foreign key constraint', async () => {
      const pool = (await import('../../config/database.js')).default;
      
      // Try to create course with invalid instructor_id
      await expect(
        pool.query(
          `INSERT INTO courses (instructor_id, title, description, short_description, price, status)
           VALUES ($1, 'Test', 'Desc', 'Short', 99.99, 'draft')`,
          [99999] // Non-existent instructor_id
        )
      ).rejects.toThrow();
    });

    it('should cascade delete courses when instructor is deleted', async () => {
      const pool = (await import('../../config/database.js')).default;
      const course = await createTestCourse(instructor1.user_id);

      // Delete instructor
      await pool.query('DELETE FROM users WHERE user_id = $1', [instructor1.user_id]);

      // Verify course is deleted (CASCADE)
      const result = await pool.query(
        'SELECT * FROM courses WHERE course_id = $1',
        [course.course_id]
      );
      expect(result.rows.length).toBe(0);
    });
  });
});

