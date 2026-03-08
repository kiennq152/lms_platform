import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create or update user account (admin, instructor, or student)
 * Usage:
 *   node create-user.js instructor teacher@example.com password123
 *   node create-user.js student student@example.com password123
 *   node create-user.js admin admin@example.com password123
 *   ROLE=instructor EMAIL=teacher@example.com PASSWORD=password123 node create-user.js
 */
async function createUser() {
  try {
    // Get role, email and password from command line args or environment variables
    const role = (process.argv[2] || process.env.ROLE || '').toLowerCase();
    const email = process.argv[3] || process.env.EMAIL || '';
    const password = process.argv[4] || process.env.PASSWORD || '';
    const firstName = process.env.FIRST_NAME || (role === 'instructor' ? 'Teacher' : role === 'admin' ? 'Admin' : 'Student');
    const lastName = process.env.LAST_NAME || 'User';
    const phone = process.env.PHONE || null;
    const bio = process.env.BIO || (role === 'instructor' ? 'Experienced instructor' : null);

    // Validate role
    if (!['admin', 'instructor', 'student'].includes(role)) {
      console.error('❌ Invalid role. Must be: admin, instructor, or student');
      console.error('');
      console.error('Usage:');
      console.error('  node create-user.js <role> <email> <password>');
      console.error('  node create-user.js instructor teacher@example.com password123');
      console.error('  node create-user.js student student@example.com password123');
      console.error('');
      console.error('Or use environment variables:');
      console.error('  ROLE=instructor EMAIL=teacher@example.com PASSWORD=password123 node create-user.js');
      process.exit(1);
    }

    // Validate email
    if (!email) {
      console.error('❌ Email is required');
      process.exit(1);
    }

    // Validate email format (allow 'admin' and 'guest' as special cases)
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

    console.log(`🔧 Creating/Updating ${role} user...`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
    console.log(`   Name: ${firstName} ${lastName}`);

    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT user_id, email, role FROM users WHERE email = $1',
      [email]
    );

    // Determine admin_approved and email_verified based on role
    const adminApproved = role === 'admin' || role === 'student'; // Admins and students auto-approved
    const emailVerified = role === 'admin' || role === 'student'; // Admins and students auto-verified

    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      console.log('⚠️  User already exists!');
      console.log('   User ID:', existingUser.user_id);
      console.log('   Email:', existingUser.email);
      console.log('   Current Role:', existingUser.role);
      
      // Update user
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users 
         SET password_hash = $1,
             role = $2,
             status = 'active',
             email_verified = $3,
             admin_approved = $4,
             first_name = $5,
             last_name = $6,
             phone = $7,
             bio = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = $9`,
        [passwordHash, role, emailVerified, adminApproved, firstName, lastName, phone, bio, email]
      );
      console.log(`✅ ${role} account updated successfully!`);
      console.log('');
      console.log(`📋 Updated ${role} Account Details:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
      console.log(`   Role: ${role}`);
      console.log(`   Status: active`);
      console.log(`   Email Verified: ${emailVerified}`);
      console.log(`   Admin Approved: ${adminApproved}`);
      if (role === 'instructor' && !adminApproved) {
        console.log('');
        console.log('⚠️  NOTE: Instructor accounts require admin approval before login.');
        console.log('💡 An admin must approve this account using: POST /api/users/:id/approve');
      }
      console.log('');
      console.log('⚠️  IMPORTANT: Keep your password secure!');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
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
      [email, passwordHash, firstName, lastName, role, 'active', emailVerified, adminApproved, phone, bio]
    );

    const user = result.rows[0];
    console.log(`✅ ${role} user created successfully!`);
    console.log('');
    console.log(`📋 ${role.charAt(0).toUpperCase() + role.slice(1)} Account Details:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
    console.log(`   User ID: ${user.user_id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Admin Approved: ${user.admin_approved}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    
    if (role === 'instructor' && !adminApproved) {
      console.log('⚠️  NOTE: Instructor accounts require admin approval before login.');
      console.log('💡 An admin must approve this account using: POST /api/users/:id/approve');
      console.log('💡 Or use: npm run approve-user <user_id>');
    } else {
      console.log('💡 You can now login with these credentials at: http://localhost:5173');
    }
    console.log('');
    console.log('⚠️  IMPORTANT: Keep your password secure!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
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

createUser();


