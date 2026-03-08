import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fix existing accounts by setting email_verified and admin_approved to true
 * This allows previous accounts to login without needing email verification or admin approval
 * 
 * Usage:
 *   node fix-existing-accounts.js
 *   node fix-existing-accounts.js --role student  (only fix students)
 *   node fix-existing-accounts.js --role instructor  (only fix instructors)
 *   node fix-existing-accounts.js --email user@example.com  (fix specific user)
 */
async function fixExistingAccounts() {
  try {
    const args = process.argv.slice(2);
    const roleFilter = args.find(arg => arg.startsWith('--role='))?.split('=')[1];
    const emailFilter = args.find(arg => arg.startsWith('--email='))?.split('=')[1];

    console.log('🔧 Fixing existing accounts...');
    console.log('');

    // Build query based on filters
    let query = 'SELECT user_id, email, first_name, last_name, role, email_verified, admin_approved, status FROM users';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (emailFilter) {
      conditions.push(`email = $${paramIndex}`);
      params.push(emailFilter.toLowerCase());
      paramIndex++;
    }

    if (roleFilter) {
      conditions.push(`role = $${paramIndex}`);
      params.push(roleFilter);
      paramIndex++;
    }

    // Exclude admin accounts (they should already be set correctly)
    conditions.push(`email NOT IN ('admin', 'guest')`);

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY user_id';

    console.log('📋 Finding accounts to fix...');
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      console.log('✅ No accounts found matching the criteria.');
      process.exit(0);
    }

    console.log(`Found ${result.rows.length} account(s) to check:`);
    console.log('');

    let fixedCount = 0;
    let skippedCount = 0;

    for (const user of result.rows) {
      const needsFix = !user.email_verified || !user.admin_approved || user.status !== 'active';
      
      if (needsFix) {
        console.log(`🔧 Fixing: ${user.email} (${user.role})`);
        console.log(`   Before: email_verified=${user.email_verified}, admin_approved=${user.admin_approved}, status=${user.status}`);
        
        await pool.query(
          `UPDATE users 
           SET email_verified = TRUE,
               admin_approved = TRUE,
               status = 'active',
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1`,
          [user.user_id]
        );

        console.log(`   After: email_verified=true, admin_approved=true, status=active`);
        console.log(`   ✅ Fixed!`);
        fixedCount++;
      } else {
        console.log(`✅ Skipping: ${user.email} (${user.role}) - already verified and approved`);
        skippedCount++;
      }
      console.log('');
    }

    console.log('📊 Summary:');
    console.log(`   Fixed: ${fixedCount} account(s)`);
    console.log(`   Skipped: ${skippedCount} account(s)`);
    console.log(`   Total: ${result.rows.length} account(s)`);
    console.log('');
    console.log('✅ Done! All accounts should now be able to login.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing accounts:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('💡 Database connection failed. Make sure PostgreSQL is running.');
      console.error('💡 Check your database configuration in server/.env');
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixExistingAccounts();


