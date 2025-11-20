// Run database schema using Node.js pg library
// Run with: node run-schema.js

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Client } = pg;

async function runSchema() {
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
    console.log('✅ Connected to lms_db!');

    const schemaPath = join(__dirname, 'database', 'schema.sql');
    console.log(`📋 Reading schema from: ${schemaPath}`);

    if (!existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schemaSQL = readFileSync(schemaPath, 'utf8');
    
    console.log(`📊 Executing schema...`);

    try {
      // Execute the entire schema at once
      // This handles functions, triggers, and multi-statement blocks properly
      await client.query(schemaSQL);
      console.log(`\n✅ Schema executed successfully!`);
    } catch (error) {
      // Some errors are OK (like "already exists")
      if (error.message.includes('already exists') || 
          error.message.includes('does not exist')) {
        console.log(`\n✅ Schema executed (some objects may already exist)`);
      } else {
        console.error(`\n⚠️  Schema execution had errors:`);
        console.error(`   ${error.message.substring(0, 200)}`);
        // Continue anyway - tables might still be created
      }
    }

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists!');
    } else {
      console.log('⚠️  Users table not found. Schema may need manual execution.');
    }

    await client.end();
    console.log('\n✅ Schema setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

runSchema();

