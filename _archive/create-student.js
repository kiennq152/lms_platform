import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create or update student account
 * Usage:
 *   node create-student.js
 *   node create-student.js student@example.com password123
 *   EMAIL=student@example.com PASSWORD=password123 node create-student.js
 */
async function createStudent() {
  try {
    const email = process.argv[2] || process.env.EMAIL || process.env.STUDENT_EMAIL || 'student@example.com';
    const password = process.argv[3] || process.env.PASSWORD || process.env.STUDENT_PASSWORD || 'student123';
    const firstName = process.env.FIRST_NAME || process.env.STUDENT_FIRST_NAME || 'Student';
    const lastName = process.env.LAST_NAME || process.env.STUDENT_LAST_NAME || 'User';
    const phone = process.env.PHONE || process.env.STUDENT_PHONE || null;

    console.log('🔧 Creating/Updating student account...');
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

    // Students are auto-approved and auto-verified
    const adminApproved = true;
    const emailVerified = true;

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
             role = 'student',
             status = 'active',
             email_verified = $2,
             admin_approved = $3,
             first_name = $4,
             last_name = $5,
             phone = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = $7`,
        [passwordHash, emailVerified, adminApproved, firstName, lastName, phone, email]
      );
      console.log('✅ Student account updated successfully!');
      console.log('');
      console.log('📋 Updated Student Account Details:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
      console.log('   Role: student');
      console.log('   Status: active');
      console.log(`   Email Verified: ${emailVerified}`);
      console.log(`   Admin Approved: ${adminApproved}`);
      console.log('');
      console.log('💡 You can now login with these credentials at: http://localhost:5173');
      console.log('');
      console.log('⚠️  IMPORTANT: Keep your password secure!');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create student user
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
        phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING user_id, email, first_name, last_name, role, status, email_verified, admin_approved`,
      [email, passwordHash, firstName, lastName, 'student', 'active', emailVerified, adminApproved, phone]
    );

    const student = result.rows[0];
    console.log('✅ Student account created successfully!');
    console.log('');
    console.log('📋 Student Account Details:');
    console.log(`   Email: ${student.email}`);
    console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
    console.log(`   User ID: ${student.user_id}`);
    console.log(`   Role: ${student.role}`);
    console.log(`   Status: ${student.status}`);
    console.log(`   Email Verified: ${student.email_verified}`);
    console.log(`   Admin Approved: ${student.admin_approved}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('💡 You can now login with these credentials at: http://localhost:5173');
    console.log('');
    console.log('⚠️  IMPORTANT: Keep your password secure!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating student account:', error.message);
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

createStudent();


