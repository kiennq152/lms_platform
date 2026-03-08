import pool from './config/database.js';

async function testCourseDB() {
  try {
    console.log('Testing course database operations...\n');
    
    // Test 1: Check if courses table exists
    console.log('1. Checking courses table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'courses'
      );
    `);
    console.log('   Courses table exists:', tableCheck.rows[0].exists);
    
    // Test 2: Count courses
    console.log('\n2. Counting courses...');
    const countResult = await pool.query('SELECT COUNT(*) as count FROM courses');
    console.log('   Total courses:', countResult.rows[0].count);
    
    // Test 3: Get sample courses
    console.log('\n3. Getting sample courses...');
    const coursesResult = await pool.query(`
      SELECT course_id, title, instructor_id, status 
      FROM courses 
      LIMIT 5
    `);
    console.log('   Sample courses:');
    coursesResult.rows.forEach(c => {
      console.log(`   - ID: ${c.course_id}, Title: ${c.title}, Instructor: ${c.instructor_id}, Status: ${c.status}`);
    });
    
    // Test 4: Check modules table
    console.log('\n4. Checking modules table...');
    const modulesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'modules'
      );
    `);
    console.log('   Modules table exists:', modulesCheck.rows[0].exists);
    
    // Test 5: Count modules
    if (modulesCheck.rows[0].exists) {
      const modulesCount = await pool.query('SELECT COUNT(*) as count FROM modules');
      console.log('   Total modules:', modulesCount.rows[0].count);
    }
    
    // Test 6: Check lessons table
    console.log('\n5. Checking lessons table...');
    const lessonsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lessons'
      );
    `);
    console.log('   Lessons table exists:', lessonsCheck.rows[0].exists);
    
    if (lessonsCheck.rows[0].exists) {
      const lessonsCount = await pool.query('SELECT COUNT(*) as count FROM lessons');
      console.log('   Total lessons:', lessonsCount.rows[0].count);
    }
    
    console.log('\n✅ Database test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCourseDB();


