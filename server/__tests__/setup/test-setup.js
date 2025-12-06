/**
 * Test Setup and Utilities
 * Provides database setup, teardown, and helper functions for all tests
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const { Pool } = pg;

// Test database configuration
const TEST_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'lms_test_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

let testPool = null;

/**
 * Create test database connection pool
 */
export function createTestPool() {
  if (!testPool) {
    testPool = new Pool(TEST_DB_CONFIG);
  }
  return testPool;
}

/**
 * Clean up test database
 */
export async function cleanupDatabase() {
  const pool = createTestPool();
  
  // Truncate all tables in reverse dependency order
  const tables = [
    'lesson_progress',
    'certificates',
    'reviews',
    'forum_replies',
    'forum_topics',
    'notifications',
    'system_logs',
    'settings',
    'transactions',
    'enrollments',
    'lessons',
    'modules',
    'courses',
    'categories',
    'coupons',
    'users',
  ];

  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (error) {
      // Table might not exist, ignore
      console.warn(`Warning: Could not truncate ${table}:`, error.message);
    }
  }
}

/**
 * Setup test database with schema
 */
export async function setupTestDatabase() {
  const pool = createTestPool();
  
  // Read and execute schema
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
    }
  } catch (error) {
    console.warn('Warning: Could not load schema:', error.message);
  }
}

/**
 * Create test user
 */
export async function createTestUser(overrides = {}) {
  const pool = createTestPool();
  const bcrypt = await import('bcryptjs');
  
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    adminApproved: true,
    emailVerified: true,
    ...overrides,
  };

  const passwordHash = await bcrypt.hash(defaultUser.password, 10);
  
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, admin_approved, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING user_id, email, first_name, last_name, role, status, admin_approved, email_verified`,
    [
      defaultUser.email,
      passwordHash,
      defaultUser.firstName,
      defaultUser.lastName,
      defaultUser.role,
      defaultUser.adminApproved,
      defaultUser.emailVerified,
    ]
  );

  return {
    ...result.rows[0],
    password: defaultUser.password,
  };
}

/**
 * Create test course
 */
export async function createTestCourse(instructorId, overrides = {}) {
  const pool = createTestPool();
  
  const defaultCourse = {
    title: 'Test Course',
    description: 'Test Course Description',
    shortDescription: 'Short desc',
    price: 99.99,
    status: 'published',
    ...overrides,
  };

  const result = await pool.query(
    `INSERT INTO courses (instructor_id, title, description, short_description, price, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      instructorId,
      defaultCourse.title,
      defaultCourse.description,
      defaultCourse.shortDescription,
      defaultCourse.price,
      defaultCourse.status,
    ]
  );

  return result.rows[0];
}

/**
 * Get JWT token for test user
 */
export async function getAuthToken(user) {
  const jwt = await import('jsonwebtoken');
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

/**
 * Close test database connection
 */
export async function closeTestPool() {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

// Global test setup/teardown
export const testHelpers = {
  createTestUser,
  createTestCourse,
  getAuthToken,
  cleanupDatabase,
  setupTestDatabase,
  createTestPool,
  closeTestPool,
};

