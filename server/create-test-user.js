// Create a test user for login testing
// Run with: node create-test-user.js

import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const testUser = {
  email: 'test@example.com',
  password: 'test123456',
  firstName: 'Test',
  lastName: 'User',
  role: 'student'
};

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...\n');
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id, email FROM users WHERE email = $1',
      [testUser.email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists:', testUser.email);
      console.log('   Updating password and verification status...\n');
      
      // Hash password
      const passwordHash = await bcrypt.hash(testUser.password, 10);
      
      // Update user
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, 
             email_verified = TRUE, 
             admin_approved = TRUE,
             status = 'active'
         WHERE email = $2`,
        [passwordHash, testUser.email]
      );
      
      console.log('✅ Test user updated successfully!\n');
    } else {
      // Hash password
      const passwordHash = await bcrypt.hash(testUser.password, 10);
      
      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, admin_approved, status)
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, 'active')
         RETURNING user_id, email, first_name, last_name, role`,
        [testUser.email, passwordHash, testUser.firstName, testUser.lastName, testUser.role]
      );
      
      console.log('✅ Test user created successfully!\n');
    }
    
    console.log('📋 Test User Credentials:');
    console.log('   Email:', testUser.email);
    console.log('   Password:', testUser.password);
    console.log('   Role:', testUser.role);
    console.log('\n✅ You can now login with these credentials!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating test user:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database lms_db exists');
    console.error('   3. Database schema has been run');
    console.error('   4. .env file is configured correctly');
    
    await pool.end();
    process.exit(1);
  }
}

createTestUser();


