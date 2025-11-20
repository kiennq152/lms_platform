import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSchema() {
  try {
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Executing schema...');
    console.log('   This may take a moment...');
    
    // Execute the entire schema as a single query
    await pool.query(schemaSQL);
    
    console.log('✅ Schema executed successfully!');
    console.log('📊 Verifying tables...');
    
    // Verify tables were created
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n✅ Created ${tablesCheck.rows.length} tables:`);
    tablesCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check courses table specifically
    const coursesCheck = await pool.query(`
      SELECT COUNT(*) as count FROM courses
    `);
    console.log(`\n📚 Courses table: ${coursesCheck.rows[0].count} courses`);
    
    console.log('\n✅ Database schema setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error running schema:');
    console.error('Error:', error.message);
    if (error.position) {
      console.error('Position:', error.position);
    }
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

runSchema();


