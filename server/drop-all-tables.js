import pool from './config/database.js';

async function dropAllTables() {
  try {
    console.log('🗑️  Dropping all tables...');
    
    // Drop tables in reverse dependency order
    await pool.query(`
      DROP TABLE IF EXISTS email_verification_tokens CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
      DROP TABLE IF EXISTS system_logs CASCADE;
      DROP TABLE IF EXISTS forum_replies CASCADE;
      DROP TABLE IF EXISTS forum_topics CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS certificates CASCADE;
      DROP TABLE IF EXISTS lesson_progress CASCADE;
      DROP TABLE IF EXISTS enrollments CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS coupons CASCADE;
      DROP TABLE IF EXISTS lessons CASCADE;
      DROP TABLE IF EXISTS modules CASCADE;
      DROP TABLE IF EXISTS courses CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    console.log('✅ All tables dropped successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error dropping tables:', error.message);
    process.exit(1);
  }
}

dropAllTables();


