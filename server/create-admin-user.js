import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin user already exists
    const checkResult = await pool.query(
      'SELECT user_id, email FROM users WHERE email = $1',
      ['admin']
    );

    if (checkResult.rows.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log('   User ID:', checkResult.rows[0].user_id);
      console.log('   Email:', checkResult.rows[0].email);
      
      // Update password if needed
      const passwordHash = await bcrypt.hash('admin', 10);
      await pool.query(
        `UPDATE users 
         SET password_hash = $1,
             role = 'admin',
             status = 'active',
             email_verified = TRUE,
             admin_approved = TRUE,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = 'admin'`,
        [passwordHash]
      );
      console.log('✅ Admin password updated!');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin', 10);

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
      ['admin', passwordHash, 'Admin', 'User', 'admin', 'active', true, true]
    );

    const admin = result.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Account Details:');
    console.log('   Email: admin');
    console.log('   Password: admin');
    console.log('   User ID:', admin.user_id);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);
    console.log('   Email Verified:', admin.email_verified);
    console.log('   Admin Approved:', admin.admin_approved);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();


