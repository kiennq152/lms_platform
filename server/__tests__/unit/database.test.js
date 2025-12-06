/**
 * Unit Tests for Database Operations
 * Tests: Connection, queries, transactions, error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestPool, closeTestPool, cleanupDatabase, setupTestDatabase } from '../setup/test-setup.js';

describe('Database Unit Tests', () => {
  let pool;

  beforeAll(async () => {
    pool = createTestPool();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await closeTestPool();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBe(1);
    });

    it('should execute SELECT query', async () => {
      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should handle connection errors gracefully', async () => {
      const invalidPool = new (await import('pg')).Pool({
        host: 'invalid-host',
        port: 5432,
        database: 'invalid-db',
        user: 'invalid-user',
        password: 'invalid-password',
      });

      await expect(invalidPool.query('SELECT 1')).rejects.toThrow();
      await invalidPool.end();
    });
  });

  describe('User Table Operations', () => {
    beforeEach(async () => {
      await cleanupDatabase();
    });

    it('should insert user into database', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Test123!@#', 10);
      
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, email, first_name, last_name, role`,
        ['test@example.com', passwordHash, 'Test', 'User', 'student', true, true]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].email).toBe('test@example.com');
      expect(result.rows[0].first_name).toBe('Test');
      expect(result.rows[0].role).toBe('student');
    });

    it('should enforce unique email constraint', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Test123!@#', 10);
      
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['duplicate@example.com', passwordHash, 'Test', 'User', 'student', true, true]
      );

      await expect(
        pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          ['duplicate@example.com', passwordHash, 'Test2', 'User2', 'student', true, true]
        )
      ).rejects.toThrow();
    });

    it('should query user by email', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Test123!@#', 10);
      
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['query@example.com', passwordHash, 'Query', 'User', 'student', true, true]
      );

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['query@example.com']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].email).toBe('query@example.com');
    });

    it('should update user information', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Test123!@#', 10);
      
      const insertResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id`,
        ['update@example.com', passwordHash, 'Update', 'User', 'student', true, true]
      );

      const userId = insertResult.rows[0].user_id;

      await pool.query(
        'UPDATE users SET first_name = $1 WHERE user_id = $2',
        ['Updated', userId]
      );

      const result = await pool.query(
        'SELECT first_name FROM users WHERE user_id = $1',
        [userId]
      );

      expect(result.rows[0].first_name).toBe('Updated');
    });

    it('should delete user from database', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Test123!@#', 10);
      
      const insertResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id`,
        ['delete@example.com', passwordHash, 'Delete', 'User', 'student', true, true]
      );

      const userId = insertResult.rows[0].user_id;

      await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);

      const result = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Course Table Operations', () => {
    let instructorId;

    beforeEach(async () => {
      await cleanupDatabase();
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Test123!@#', 10);
      
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id`,
        ['instructor@example.com', passwordHash, 'Instructor', 'User', 'instructor', true, true]
      );
      instructorId = result.rows[0].user_id;
    });

    it('should insert course with instructor_id', async () => {
      const result = await pool.query(
        `INSERT INTO courses (instructor_id, title, description, short_description, price, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [instructorId, 'Test Course', 'Description', 'Short', 99.99, 'published']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].instructor_id).toBe(instructorId);
      expect(result.rows[0].title).toBe('Test Course');
    });

    it('should enforce foreign key constraint for instructor_id', async () => {
      await expect(
        pool.query(
          `INSERT INTO courses (instructor_id, title, description, short_description, price, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [99999, 'Test Course', 'Description', 'Short', 99.99, 'published']
        )
      ).rejects.toThrow();
    });

    it('should cascade delete courses when instructor is deleted', async () => {
      const courseResult = await pool.query(
        `INSERT INTO courses (instructor_id, title, description, short_description, price, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING course_id`,
        [instructorId, 'Test Course', 'Description', 'Short', 99.99, 'published']
      );
      const courseId = courseResult.rows[0].course_id;

      await pool.query('DELETE FROM users WHERE user_id = $1', [instructorId]);

      const result = await pool.query(
        'SELECT * FROM courses WHERE course_id = $1',
        [courseId]
      );

      expect(result.rows.length).toBe(0);
    });
  });
});

