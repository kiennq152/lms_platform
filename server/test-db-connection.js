// Test database connection directly
// Run with: node test-db-connection.js

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

console.log('🔍 Testing database connection...\n');
console.log('📋 Configuration:');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost (default)'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || '5432 (default)'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'lms_db (default)'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'postgres (default)'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '*** (set)' : 'postgres (default)'}`);
console.log('');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ SUCCESS! Database connected successfully!');
    
    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('\n📊 Database Info:');
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(',')[0]}`);
    console.log(`   Current Database: ${result.rows[0].current_database}`);
    console.log(`   Current User: ${result.rows[0].current_user}`);
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('\n✅ Users table exists!');
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`   Total users: ${userCount.rows[0].count}`);
    } else {
      console.log('\n⚠️ Users table does NOT exist. Run database schema!');
    }
    
    client.release();
    await pool.end();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error(`\nError: ${error.message}`);
    console.error(`Code: ${error.code || 'N/A'}`);
    
    console.log('\n💡 Troubleshooting:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   → PostgreSQL is not running or not accessible');
      console.log('   → Check: Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" }');
      console.log('   → Start PostgreSQL service from Services (services.msc)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   → Cannot resolve hostname');
      console.log('   → Check DB_HOST in .env file (should be "localhost")');
    } else if (error.code === '28P01') {
      console.log('   → Password authentication failed');
      console.log('   → Check DB_PASSWORD in .env file matches PostgreSQL password');
    } else if (error.code === '3D000') {
      console.log('   → Database does not exist');
      console.log('   → Create database: CREATE DATABASE lms_db;');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   → Connection timeout');
      console.log('   → PostgreSQL might not be running or firewall blocking');
    } else {
      console.log('   → Check PostgreSQL is installed and running');
      console.log('   → Verify .env file exists in server/ directory');
      console.log('   → Check database credentials are correct');
    }
    
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure PostgreSQL is installed');
    console.log('   2. Start PostgreSQL service');
    console.log('   3. Create .env file in server/ directory');
    console.log('   4. Update DB_PASSWORD in .env with your PostgreSQL password');
    console.log('   5. Create database: CREATE DATABASE lms_db;');
    console.log('   6. Run schema: psql -U postgres -d lms_db -f database/schema.sql (from server directory)');
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

