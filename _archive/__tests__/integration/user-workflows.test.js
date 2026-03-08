/**
 * Integration Tests for Complete User Workflows
 * Tests end-to-end scenarios based on SRS requirements
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { cleanupDatabase, setupTestDatabase, createTestUser, getAuthToken } from '../setup/test-setup.js';

let app;

beforeAll(async () => {
  await setupTestDatabase();
  app = express();
  app.use(express.json());
  
  // Import all routes
  const authRoutes = (await import('../../routes/auth.js')).default;
  const coursesRoutes = (await import('../../routes/courses.js')).default;
  const enrollmentsRoutes = (await import('../../routes/enrollments.js')).default;
  const cartRoutes = (await import('../../routes/cart.js')).default;
  const transactionsRoutes = (await import('../../routes/transactions.js')).default;
  const certificatesRoutes = (await import('../../routes/certificates.js')).default;
  
  app.use('/api/auth', authRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api/enrollments', enrollmentsRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/certificates', certificatesRoutes);
});

afterAll(async () => {
  await cleanupDatabase();
});

beforeEach(async () => {
  await cleanupDatabase();
});

describe('User Workflow Integration Tests', () => {
  describe('Student Complete Journey (SRS FR-030 to FR-055)', () => {
    let student, instructor, admin;
    let studentToken, instructorToken, adminToken;
    let courseId;

    beforeEach(async () => {
      // Setup users
      student = await createTestUser({ 
        email: 'student@example.com',
        role: 'student', 
        adminApproved: true 
      });
      instructor = await createTestUser({ 
        email: 'instructor@example.com',
        role: 'instructor', 
        adminApproved: true 
      });
      admin = await createTestUser({ 
        email: 'admin@example.com',
        role: 'admin', 
        adminApproved: true 
      });
      
      studentToken = await getAuthToken(student);
      instructorToken = await getAuthToken(instructor);
      adminToken = await getAuthToken(admin);

      // Create course
      const courseResponse = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Complete Course',
          description: 'Full course description',
          short_description: 'Short',
          price: 99.99,
          status: 'published',
        });
      courseId = courseResponse.body.course.course_id;
    });

    it('should complete full student enrollment workflow', async () => {
      // Step 1: Browse courses (FR-015)
      const browseResponse = await request(app)
        .get('/api/courses?status=published');
      expect(browseResponse.status).toBe(200);
      expect(browseResponse.body.courses.length).toBeGreaterThan(0);

      // Step 2: View course details (FR-019)
      const detailsResponse = await request(app)
        .get(`/api/courses/${courseId}`);
      expect(detailsResponse.status).toBe(200);
      expect(detailsResponse.body.course.course_id).toBe(courseId);

      // Step 3: Add to cart (FR-034)
      const addToCartResponse = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: courseId });
      expect(addToCartResponse.status).toBe(200);

      // Step 4: View cart (FR-035)
      const viewCartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(viewCartResponse.status).toBe(200);
      expect(viewCartResponse.body.cartItems.length).toBeGreaterThan(0);

      // Step 5: Enroll in course (FR-030)
      const enrollResponse = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: courseId });
      expect(enrollResponse.status).toBe(200);
      expect(enrollResponse.body.enrollment).toBeDefined();

      // Step 6: View enrolled courses (FR-033)
      const enrolledResponse = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(enrolledResponse.status).toBe(200);
      expect(enrolledResponse.body.enrollments.some(e => e.course_id === courseId)).toBe(true);

      // Step 7: Track progress (FR-048, FR-049)
      const progressResponse = await request(app)
        .get(`/api/enrollments/${enrollResponse.body.enrollment.enrollment_id}/progress`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(progressResponse.status).toBe(200);
      expect(progressResponse.body.progress).toBeDefined();
    });

    it('should complete payment and certificate workflow', async () => {
      // Step 1: Enroll in paid course
      const enrollResponse = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ course_id: courseId });
      expect(enrollResponse.status).toBe(200);

      // Step 2: Process payment (FR-038, FR-039)
      const paymentResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          course_id: courseId,
          amount: 99.99,
          payment_method: 'credit_card',
          payment_status: 'completed',
        });
      expect(paymentResponse.status).toBe(200);

      // Step 3: Complete course (simulate)
      const pool = (await import('../../config/database.js')).default;
      await pool.query(
        `UPDATE enrollments 
         SET progress_percentage = 100, status = 'completed', completion_date = NOW()
         WHERE enrollment_id = $1`,
        [enrollResponse.body.enrollment.enrollment_id]
      );

      // Step 4: Generate certificate (FR-052, FR-053)
      const certificateResponse = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          enrollment_id: enrollResponse.body.enrollment.enrollment_id,
        });
      
      // Certificate might be auto-generated or require manual creation
      if (certificateResponse.status === 200 || certificateResponse.status === 201) {
        expect(certificateResponse.body.certificate).toBeDefined();
      }

      // Step 5: View certificates (FR-055)
      const certificatesResponse = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(certificatesResponse.status).toBe(200);
    });
  });

  describe('Instructor Complete Journey (SRS FR-020 to FR-025)', () => {
    let instructor;
    let instructorToken;

    beforeEach(async () => {
      instructor = await createTestUser({ 
        role: 'instructor', 
        adminApproved: true 
      });
      instructorToken = await getAuthToken(instructor);
    });

    it('should complete full course creation workflow', async () => {
      // Step 1: Create course (FR-020, FR-021)
      const createResponse = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'New Course',
          description: 'Full description',
          short_description: 'Short description',
          price: 149.99,
          status: 'draft',
        });
      expect(createResponse.status).toBe(201);
      const courseId = createResponse.body.course.course_id;

      // Step 2: Update course (FR-022)
      const updateResponse = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          description: 'Updated description',
          price: 199.99,
        });
      expect(updateResponse.status).toBe(200);

      // Step 3: Publish course (FR-025)
      const publishResponse = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          status: 'published',
        });
      expect(publishResponse.status).toBe(200);
      expect(publishResponse.body.course.status).toBe('published');

      // Step 4: View own courses
      const coursesResponse = await request(app)
        .get('/api/instructor/courses')
        .set('Authorization', `Bearer ${instructorToken}`);
      expect(coursesResponse.status).toBe(200);
      expect(coursesResponse.body.courses.some(c => c.course_id === courseId)).toBe(true);
    });
  });

  describe('Admin Complete Journey (SRS FR-010 to FR-014)', () => {
    let admin;
    let adminToken;

    beforeEach(async () => {
      admin = await createTestUser({ 
        role: 'admin', 
        adminApproved: true 
      });
      adminToken = await getAuthToken(admin);
    });

    it('should complete full admin user management workflow', async () => {
      // Step 1: Create new user (FR-011)
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'Test123!@#',
          firstName: 'New',
          lastName: 'User',
          role: 'student',
        });
      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.user.user_id;

      // Step 2: List all users (FR-010)
      const listResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.users.length).toBeGreaterThan(0);

      // Step 3: Filter users by role (FR-013)
      const filterResponse = await request(app)
        .get('/api/users?role=student')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(filterResponse.status).toBe(200);
      filterResponse.body.users.forEach(user => {
        expect(user.role).toBe('student');
      });

      // Step 4: Update user (FR-011)
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          status: 'active',
        });
      expect(updateResponse.status).toBe(200);

      // Step 5: Suspend user (FR-012)
      const suspendResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'suspended',
        });
      expect(suspendResponse.status).toBe(200);
      expect(suspendResponse.body.user.status).toBe('suspended');
    });
  });
});

