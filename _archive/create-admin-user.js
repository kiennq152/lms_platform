import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create or update admin user
 * Usage:
 *   node create-admin-user.js
 *   node create-admin-user.js admin@example.com mypassword123
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=mypassword123 node create-admin-user.js
 */
async function createAdminUser() {
  try {
    // Get email and password from command line args or environment variables
    const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';
    const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME || 'User';

    console.log('🔧 Creating/Updating admin user...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);

    // Validate email format (allow 'admin' as special case)
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

    // Check if admin user already exists
    const checkResult = await pool.query(
      'SELECT user_id, email, role FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      console.log('⚠️  User already exists!');
      console.log('   User ID:', existingUser.user_id);
      console.log('   Email:', existingUser.email);
      console.log('   Current Role:', existingUser.role);
      
      // Update to admin if not already admin
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users 
         SET password_hash = $1,
             role = 'admin',
             status = 'active',
             email_verified = TRUE,
             admin_approved = TRUE,
             first_name = $2,
             last_name = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = $4`,
        [passwordHash, firstName, lastName, email]
      );
      console.log('✅ Admin account updated successfully!');
      console.log('');
      console.log('📋 Updated Admin Account Details:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
      console.log('   Role: admin');
      console.log('   Status: active');
      console.log('   Email Verified: true');
      console.log('   Admin Approved: true');
      console.log('');
      console.log('⚠️  IMPORTANT: Keep your password secure!');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        status,
        email_verified,
        admin_approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING user_id, email, first_name, last_name, role, status, email_verified, admin_approved`,
      [email, passwordHash, firstName, lastName, 'admin', 'active', true, true]
    );

    const admin = result.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Account Details:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password.length > 0 ? '*'.repeat(password.length) : '(empty)'}`);
    console.log('   User ID:', admin.user_id);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);
    console.log('   Email Verified:', admin.email_verified);
    console.log('   Admin Approved:', admin.admin_approved);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Keep your password secure!');
    console.log('💡 You can now login with these credentials at: http://localhost:5173');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
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

createAdminUser();


