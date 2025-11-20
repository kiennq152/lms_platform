import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function approveUser(email) {
  try {
    console.log(`🔧 Approving user: ${email}`);
    
    const result = await pool.query(
      `UPDATE users 
       SET admin_approved = TRUE, 
           admin_approved_at = CURRENT_TIMESTAMP
       WHERE email = $1
       RETURNING user_id, email, first_name, last_name, role, admin_approved`,
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('✅ User approved successfully!');
    console.log('');
    console.log('User Details:');
    console.log('   User ID:', user.user_id);
    console.log('   Email:', user.email);
    console.log('   Name:', `${user.first_name} ${user.last_name}`);
    console.log('   Role:', user.role);
    console.log('   Admin Approved:', user.admin_approved);
    console.log('');
    console.log('✅ This user can now login!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Usage: node approve-user.js <email>');
  console.error('Example: node approve-user.js fantasy152k@gmail.com');
  process.exit(1);
}

approveUser(email);


