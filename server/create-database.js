// Create database using Node.js pg library
// Run with: node create-database.js

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function createDatabase() {
  // Connect to postgres database to create lms_db
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔧 Connecting to PostgreSQL...');
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL!');

    // Check if database exists
    const checkResult = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'lms_db'"
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Database "lms_db" already exists!');
    } else {
      console.log('📋 Creating database "lms_db"...');
      await adminClient.query('CREATE DATABASE lms_db');
      console.log('✅ Database "lms_db" created successfully!');
    }

    await adminClient.end();

    // Now test connection to lms_db
    console.log('\n🔍 Testing connection to lms_db...');
    const testClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'lms_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    await testClient.connect();
    console.log('✅ Successfully connected to lms_db!');
    
    const versionResult = await testClient.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', versionResult.rows[0].version.split(',')[0]);
    
    await testClient.end();
    
    console.log('\n✅ Database setup complete!');
    console.log('💡 Next step: Run schema with: psql -U postgres -d lms_db -f database/schema.sql');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL is not running. Start the service first.');
    } else if (error.code === '28P01') {
      console.error('\n💡 Password authentication failed. Check DB_PASSWORD in .env file.');
    } else {
      console.error('\n💡 Check your PostgreSQL configuration.');
    }
    
    await adminClient.end().catch(() => {});
    process.exit(1);
  }
}

createDatabase();


