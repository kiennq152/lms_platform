// Create users table directly
// Run with: node create-users-table.js

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function createUsersTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'lms_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔧 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ Users table already exists!');
      await client.end();
      return;
    }

    console.log('📋 Creating users table...');

    await client.query(`
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        avatar_url TEXT,
        phone VARCHAR(20),
        bio TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        email_verified_at TIMESTAMP,
        admin_approved BOOLEAN DEFAULT FALSE,
        admin_approved_at TIMESTAMP,
        approved_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );

      CREATE INDEX idx_email ON users(email);
      CREATE INDEX idx_role ON users(role);
      CREATE INDEX idx_status ON users(status);
    `);

    console.log('✅ Users table created successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

createUsersTable();


