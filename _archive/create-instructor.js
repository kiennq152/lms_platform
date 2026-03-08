import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create or update instructor/teacher account
 * Usage:
 *   node create-instructor.js
 *   node create-instructor.js teacher@example.com password123
 *   EMAIL=teacher@example.com PASSWORD=password123 node create-instructor.js
 */
async function createInstructor() {
  try {
    const email = process.argv[2] || process.env.EMAIL || process.env.INSTRUCTOR_EMAIL || 'teacher@example.com';
    const password = process.argv[3] || process.env.PASSWORD || process.env.INSTRUCTOR_PASSWORD || 'teacher123';
    const firstName = process.env.FIRST_NAME || process.env.INSTRUCTOR_FIRST_NAME || 'Teacher';
    const lastName = process.env.LAST_NAME || process.env.INSTRUCTOR_LAST_NAME || 'User';
    const phone = process.env.PHONE || process.env.INSTRUCTOR_PHONE || null;
    const bio = process.env.BIO || process.env.INSTRUCTOR_BIO || 'Experienced instructor with expertise in teaching';
    const autoApprove = process.env.AUTO_APPROVE === 'true' || process.env.AUTO_APPROVE === '1';

    console.log('🔧 Creating/Updating instructor account...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
    console.log(`   Name: ${firstName} ${lastName}`);

    // Validate email format
    if (email !== 'admin' && email !== 'guest') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('❌ Invalid email format. Use a valid email address.');
        process.exit(1);
      }
    }

    // Validate password
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long.');
      process.exit(1);
    }

    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT user_id, email, role FROM users WHERE email = $1',
      [email]
    );

    // Auto-approve if AUTO_APPROVE is set, otherwise require admin approval
    const adminApproved = autoApprove;
    const emailVerified = autoApprove;

    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      console.log('⚠️  User already exists!');
      console.log('   User ID:', existingUser.user_id);
      console.log('   Email:', existingUser.email);
      console.log('   Current Role:', existingUser.role);
      
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users 
         SET password_hash = $1,
             role = 'instructor',
             status = 'active',
             email_verified = $2,
             admin_approved = $3,
             first_name = $4,
             last_name = $5,
             phone = $6,
             bio = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = $8`,
        [passwordHash, emailVerified, adminApproved, firstName, lastName, phone, bio, email]
      );
      console.log('✅ Instructor account updated successfully!');
      console.log('');
      console.log('📋 Updated Instructor Account Details:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
      console.log('   Role: instructor');
      console.log('   Status: active');
      console.log(`   Email Verified: ${emailVerified}`);
      console.log(`   Admin Approved: ${adminApproved}`);
      console.log('');
      if (!adminApproved) {
        console.log('⚠️  NOTE: Instructor accounts require admin approval before login.');
        console.log('💡 An admin must approve this account using: POST /api/users/:id/approve');
      } else {
        console.log('💡 You can now login with these credentials at: http://localhost:5173');
      }
      console.log('');
      console.log('⚠️  IMPORTANT: Keep your password secure!');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create instructor user
    const result = await pool.query(
      `INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        status,
        email_verified,
        admin_approved,
        phone,
        bio
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING user_id, email, first_name, last_name, role, status, email_verified, admin_approved`,
      [email, passwordHash, firstName, lastName, 'instructor', 'active', emailVerified, adminApproved, phone, bio]
    );

    const instructor = result.rows[0];
    console.log('✅ Instructor account created successfully!');
    console.log('');
    console.log('📋 Instructor Account Details:');
    console.log(`   Email: ${instructor.email}`);
    console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
    console.log(`   User ID: ${instructor.user_id}`);
    console.log(`   Role: ${instructor.role}`);
    console.log(`   Status: ${instructor.status}`);
    console.log(`   Email Verified: ${instructor.email_verified}`);
    console.log(`   Admin Approved: ${instructor.admin_approved}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    
    if (!adminApproved) {
      console.log('⚠️  NOTE: Instructor accounts require admin approval before login.');
      console.log('💡 To auto-approve, use: AUTO_APPROVE=true node create-instructor.js');
      console.log('💡 Or an admin must approve this account using: POST /api/users/:id/approve');
    } else {
      console.log('💡 You can now login with these credentials at: http://localhost:5173');
    }
    console.log('');
    console.log('⚠️  IMPORTANT: Keep your password secure!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating instructor account:', error.message);
    if (error.code === '23505') {
      console.error('💡 User with this email already exists. The script will update it instead.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('💡 Database connection failed. Make sure PostgreSQL is running.');
      console.error('💡 Check your database configuration in server/.env');
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createInstructor();


