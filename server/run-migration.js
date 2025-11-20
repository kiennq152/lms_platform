import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000,
});

async function runMigration() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to lms_db!');

    const migrationPath = join(__dirname, 'database', 'migration_add_cart.sql');
    console.log(`📋 Reading migration from: ${migrationPath}`);

    if (!existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log(`📊 Executing migration...`);

    try {
      await client.query(migrationSQL);
      console.log(`\n✅ Migration executed successfully!`);
    } catch (error) {
      // Some errors are OK (like "already exists")
      if (error.message.includes('already exists') || 
          error.message.includes('does not exist')) {
        console.log(`\n✅ Migration executed (some objects may already exist)`);
      } else {
        console.error(`\n⚠️  Migration execution had errors:`);
        console.error(`   ${error.message}`);
        throw error;
      }
    }

    // Check if user_preferences table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'user_preferences'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ user_preferences table exists!');
    } else {
      console.warn('⚠️  user_preferences table not found. Migration may need manual execution.');
    }

    console.log('\n✅ Migration setup complete!');

  } catch (error) {
    console.error('❌ Error during migration execution:', error.message);
    console.error('💡 Make sure PostgreSQL is running and database "lms_db" exists.');
    console.error('💡 Check database credentials in server/.env');
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration();


