import pool from './config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login directly...');
    console.log('');

    // Check if admin exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      console.log('Creating admin user...');
      
      const passwordHash = await bcrypt.hash('admin', 10);
      const insertResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified, admin_approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING user_id, email, role, email_verified, admin_approved, status`,
        ['admin', passwordHash, 'Admin', 'User', 'admin', 'active', true, true]
      );
      console.log('✅ Admin user created:', insertResult.rows[0]);
    } else {
      const admin = result.rows[0];
      console.log('✅ Admin user found:');
      console.log('   User ID:', admin.user_id);
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   Status:', admin.status);
      console.log('   Email Verified:', admin.email_verified);
      console.log('   Admin Approved:', admin.admin_approved);
      console.log('');

      // Test password
      const isValidPassword = await bcrypt.compare('admin', admin.password_hash);
      console.log('🔑 Password check:', isValidPassword ? '✅ Valid' : '❌ Invalid');
      
      if (!isValidPassword) {
        console.log('Updating admin password...');
        const passwordHash = await bcrypt.hash('admin', 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2',
          [passwordHash, 'admin']
        );
        console.log('✅ Password updated');
      }
    }

    // Verify admin can login (check all conditions)
    const adminCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin']
    );
    
    if (adminCheck.rows.length > 0) {
      const admin = adminCheck.rows[0];
      const passwordCheck = await bcrypt.compare('admin', admin.password_hash);
      
      console.log('');
      console.log('📋 Login Readiness Check:');
      console.log('   ✅ User exists:', adminCheck.rows.length > 0);
      console.log('   ✅ Password correct:', passwordCheck);
      console.log('   ✅ Email verified:', admin.email_verified);
      console.log('   ✅ Admin approved:', admin.admin_approved);
      console.log('   ✅ Status active:', admin.status === 'active');
      console.log('   ✅ Role admin:', admin.role === 'admin');
      
      if (passwordCheck && admin.email_verified && admin.admin_approved && admin.status === 'active') {
        console.log('');
        console.log('✅ Admin account is ready for login!');
      } else {
        console.log('');
        console.log('⚠️  Some conditions not met. Fixing...');
        
        await pool.query(
          `UPDATE users 
           SET email_verified = TRUE,
               admin_approved = TRUE,
               status = 'active',
               role = 'admin'
           WHERE email = 'admin'`
        );
        console.log('✅ Admin account fixed!');
      }
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdminLogin();


