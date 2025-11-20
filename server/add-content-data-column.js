import pool from './config/database.js';

async function addContentDataColumn() {
  try {
    console.log('Adding content_data column to lessons table...');
    
    // Check if column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lessons' AND column_name = 'content_data'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ content_data column already exists');
      process.exit(0);
    }
    
    // Add content_data column
    await pool.query(`
      ALTER TABLE lessons 
      ADD COLUMN content_data JSONB
    `);
    
    console.log('✅ content_data column added successfully');
    
    // Also add youtube_url if it doesn't exist
    const youtubeCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lessons' AND column_name = 'youtube_url'
    `);
    
    if (youtubeCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE lessons 
        ADD COLUMN youtube_url TEXT
      `);
      console.log('✅ youtube_url column added successfully');
    } else {
      console.log('✅ youtube_url column already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addContentDataColumn();


